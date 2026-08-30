import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { encryptCredential } from "@/lib/security/crypto";
import { removeProviderConnection } from "@/lib/connections/store";
import { rootUrl, sharedAuthCookieOptions } from "@/lib/tenancy";
import OpenAI from "openai";

const connectionRequest = z.object({
  provider: z.enum(["github", "supabase", "vercel", "openai"]),
  workspaceId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  credential: z.string().min(10).max(500).optional(),
});

const disconnectRequest = z.object({
  provider: z.enum(["github", "supabase", "vercel", "openai"]),
  workspaceId: z.string().uuid(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = connectionRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "That connection request is not valid." }, { status: 400 });
  }

  const { provider, workspaceId, projectId, credential } = parsed.data;
  const label = { github: "GitHub", supabase: "Supabase", vercel: "Vercel", openai: "OpenAI" }[provider];

  if (!workspaceId) {
    return NextResponse.json({ message: "Select a workspace before connecting this account." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) {
    return NextResponse.json({ message: "Seed database is not configured." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Sign in again to continue." }, { status: 401 });

  const { data: owned } = await admin
    .from("workspaces")
    .select("id,profiles!inner(auth_user_id)")
    .eq("id", workspaceId)
    .eq("profiles.auth_user_id", user.id)
    .maybeSingle();

  if (!owned) return NextResponse.json({ message: "You do not have access to this workspace." }, { status: 403 });

  if (provider === "openai") {
    if (!credential) {
      return NextResponse.json({ message: "Enter your OpenAI API key to continue." }, { status: 400 });
    }

    try {
      const client = new OpenAI({ apiKey: credential, maxRetries: 0, timeout: 10_000 });
      await client.models.list();
    } catch (err) {
      return NextResponse.json(
        { message: `OpenAI rejected this API key: ${err instanceof Error ? err.message : "Unauthorized"}` },
        { status: 400 },
      );
    }

    const encrypted = encryptCredential(JSON.stringify({ apiKey: credential }));
    const { error } = await admin.from("provider_connections").upsert(
      {
        workspace_id: workspaceId,
        provider: "openai",
        encrypted_access_data: encrypted,
        status: "connected",
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,provider" },
    );

    if (error) {
      return NextResponse.json({ message: "Seed could not store the key securely." }, { status: 500 });
    }

    await admin.from("audit_events").insert({
      actor_user_id: user.id,
      workspace_id: workspaceId,
      tool_name: "connect_openai",
      metadata: { provider: "openai", status: "connected" },
    });

    return NextResponse.json({
      configured: true,
      message: "Seed AI is active. Your key was verified, encrypted, and stored server-side.",
    });
  }

  // OAuth Providers: GitHub, Supabase, Vercel
  const state = randomBytes(24).toString("hex");
  const codeVerifier = provider === "supabase" ? randomBytes(32).toString("base64url") : undefined;
  const codeChallenge = codeVerifier
    ? createHash("sha256").update(codeVerifier).digest("base64url")
    : undefined;

  const cookieStore = await cookies();
  cookieStore.set(
    `seed_oauth_${provider}`,
    JSON.stringify({ state, workspaceId, projectId, codeVerifier }),
    sharedAuthCookieOptions({
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
      path: "/",
    }),
  );

  const callback = rootUrl(`/api/connections/${provider}/callback`);

  let authorizationUrl: string | null = null;
  if (provider === "github") {
    if (process.env.GITHUB_APP_SLUG) {
      authorizationUrl = `https://github.com/apps/${process.env.GITHUB_APP_SLUG}/installations/new?state=${state}`;
    }
  } else if (provider === "supabase") {
    if (process.env.SUPABASE_OAUTH_CLIENT_ID && codeChallenge) {
      const scopeParam = process.env.SUPABASE_OAUTH_SCOPES
        ? `&scope=${encodeURIComponent(process.env.SUPABASE_OAUTH_SCOPES)}`
        : "";
      authorizationUrl = `https://api.supabase.com/v1/oauth/authorize?client_id=${process.env.SUPABASE_OAUTH_CLIENT_ID}&redirect_uri=${encodeURIComponent(callback)}&response_type=code&state=${state}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256${scopeParam}`;
    }
  } else if (provider === "vercel") {
    if (process.env.VERCEL_INTEGRATION_SLUG) {
      authorizationUrl = `https://vercel.com/integrations/${process.env.VERCEL_INTEGRATION_SLUG}/new?state=${state}`;
    }
  }

  return NextResponse.json({
    configured: false,
    authorizationUrl,
    message: authorizationUrl
      ? `Continue in ${label}'s secure authorization screen.`
      : `${label} OAuth credentials are not configured yet. Add them to .env.local to enable live authorization.`,
  });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const parsed = disconnectRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid disconnect request." }, { status: 400 });
  }

  const { provider, workspaceId } = parsed.data;

  try {
    await removeProviderConnection(workspaceId, provider);
    return NextResponse.json({
      success: true,
      message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} disconnected successfully.`,
    });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Could not disconnect provider." },
      { status: 500 },
    );
  }
}
