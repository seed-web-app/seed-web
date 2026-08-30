import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  dashboardUrl,
  isAvailableUsernameFormat,
  normalizeUsername,
} from "@/lib/tenancy";

const usernameSchema = z
  .string()
  .transform(normalizeUsername)
  .refine(isAvailableUsernameFormat, {
    message:
      "Use 3–30 lowercase letters, numbers, or hyphens. Start and end with a letter or number.",
  });

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { message: "Seed authentication is not configured." },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Sign in first." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const parsed = usernameSchema.safeParse(
    typeof body === "object" && body !== null && "username" in body
      ? body.username
      : undefined,
  );
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid username." },
      { status: 400 },
    );
  }

  const { data: claimedUsername, error } = await supabase.rpc(
    "claim_seed_username",
    { requested_username: parsed.data },
  );

  if (error) {
    const unavailable =
      error.code === "23505" || error.message.includes("username_unavailable");
    return NextResponse.json(
      {
        message: unavailable
          ? "That username is already taken. Try another one."
          : "Seed could not save that username. Please try again.",
      },
      { status: unavailable ? 409 : 500 },
    );
  }

  const username = String(claimedUsername);
  // Re-issue an existing root-domain session with the shared cookie scope so
  // accounts created before subdomain tenancy was enabled transition cleanly.
  await supabase.auth.refreshSession();
  return NextResponse.json({
    username,
    dashboardUrl: dashboardUrl(username),
  });
}
