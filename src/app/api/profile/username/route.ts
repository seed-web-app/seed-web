import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  dashboardUrl,
  isAvailableUsernameFormat,
  normalizeUsername,
} from "@/lib/tenancy";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { message: "Authentication is not configured." },
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

  const requested =
    typeof body === "object" && body !== null && "username" in body
      ? (body as { username?: unknown }).username
      : undefined;
  const username = normalizeUsername(
    typeof requested === "string" ? requested : "",
  );

  if (!isAvailableUsernameFormat(username)) {
    return NextResponse.json(
      {
        message:
          "Use 3–30 lowercase letters, numbers, or hyphens. Start and end with a letter or number.",
      },
      { status: 400 },
    );
  }

  const { data: claimedUsername, error } = await supabase.rpc(
    "claim_username",
    { requested_username: username },
  );

  if (error) {
    const unavailable =
      error.code === "23505" || error.message.includes("username_unavailable");
    return NextResponse.json(
      {
        message: unavailable
          ? "That username is already taken. Try another one."
          : "That address could not be created. Please try again.",
      },
      { status: unavailable ? 409 : 500 },
    );
  }

  await supabase.auth.refreshSession();
  const claimed = String(claimedUsername);
  return NextResponse.json({
    username: claimed,
    dashboardUrl: dashboardUrl(claimed),
  });
}
