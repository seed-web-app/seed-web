import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { z } from "zod";
import { storeProviderConnection } from "@/lib/connections/store";
import { seedLog } from "@/lib/logger";
import { rootUrl, dashboardUrl, sharedAuthCookieOptions } from "@/lib/tenancy";

const providerSchema=z.enum(["github","supabase","vercel"]);
const oauthCookieSchema = z.object({
  state: z.string().min(20),
  workspaceId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  installationId: z.string().optional(),
  codeVerifier: z.string().min(20).optional(),
});

type TokenPayload = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  token_type?: string;
  team_id?: string | null;
  user_id?: string;
  installation_id?: string;
};

async function getRedirectUrl(
  workspaceId: string,
  result: string,
  projectId?: string,
): Promise<string> {
  const { createSupabaseAdminClient } = await import("@/lib/supabase/server");
  const admin = createSupabaseAdminClient();
  let username: string | null = null;

  if (admin) {
    const { data: ws } = await admin
      .from("workspaces")
      .select("owner_user_id,profiles!inner(username)")
      .eq("id", workspaceId)
      .maybeSingle();

    const profileData = ws?.profiles as unknown as { username?: string } | undefined;
    username = profileData?.username ?? null;
  }

  const query = new URLSearchParams({ connection: result });
  if (projectId) query.set("project", projectId);

  if (username) {
    return dashboardUrl(username, `/dashboard?${query.toString()}`);
  }
  return rootUrl(`/dashboard?${query.toString()}`);
}
function formBody(values:Record<string,string>){return new URLSearchParams(values).toString();}
async function exchange(url:string,values:Record<string,string>){const response=await fetch(url,{method:"POST",headers:{Accept:"application/json","Content-Type":"application/x-www-form-urlencoded"},body:formBody(values),cache:"no-store"});if(!response.ok)throw new Error(`OAuth token exchange failed (${response.status}).`);return response.json()as Promise<TokenPayload>;}
async function exchangeSupabase(values:Record<string,string>,clientId:string,clientSecret:string){const authorization=Buffer.from(`${clientId}:${clientSecret}`).toString("base64");const response=await fetch("https://api.supabase.com/v1/oauth/token",{method:"POST",headers:{Accept:"application/json","Content-Type":"application/x-www-form-urlencoded",Authorization:`Basic ${authorization}`},body:formBody(values),cache:"no-store"});if(!response.ok)throw new Error(`Supabase OAuth token exchange failed (${response.status}).`);return response.json()as Promise<TokenPayload>;}
function clearOAuthCookie(cookieStore:Awaited<ReturnType<typeof cookies>>,provider:string){cookieStore.set(`seed_oauth_${provider}`,"",sharedAuthCookieOptions({httpOnly:true,sameSite:"lax" as const,secure:process.env.NODE_ENV==="production",maxAge:0,path:"/"}));}

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const parsedProvider = providerSchema.safeParse((await params).provider);
  const url = new URL(request.url);
  if (!parsedProvider.success) return NextResponse.redirect(rootUrl("/dashboard?connection=invalid"));
  const provider = parsedProvider.data;
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(`seed_oauth_${provider}`)?.value;
  let oauth: z.infer<typeof oauthCookieSchema> | null = null;
  try {
    oauth = oauthCookieSchema.parse(JSON.parse(rawCookie ?? ""));
  } catch {
    return NextResponse.redirect(rootUrl("/dashboard?connection=expired"));
  }

  const state = url.searchParams.get("state");
  if (!state || state !== oauth.state) {
    const dest = await getRedirectUrl(oauth.workspaceId, "csrf", oauth.projectId);
    return NextResponse.redirect(dest);
  }

  const code = url.searchParams.get("code");

  try {
    if (provider === "github") {
      const installationId = url.searchParams.get("installation_id") ?? oauth.installationId;
      if (!installationId) {
        const dest = await getRedirectUrl(oauth.workspaceId, "github-cancelled", oauth.projectId);
        return NextResponse.redirect(dest);
      }
      if (!code) {
        const clientId = process.env.GITHUB_APP_CLIENT_ID;
        if (!clientId) throw new Error("GitHub user authorization is not configured.");
        const nextState = randomBytes(24).toString("hex");
        cookieStore.set(
          "seed_oauth_github",
          JSON.stringify({
            state: nextState,
            workspaceId: oauth.workspaceId,
            projectId: oauth.projectId,
            installationId,
          }),
          sharedAuthCookieOptions({
            httpOnly: true,
            sameSite: "lax" as const,
            secure: process.env.NODE_ENV === "production",
            maxAge: 600,
            path: "/",
          }),
        );
        const authorize = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(rootUrl("/api/connections/github/callback"))}&state=${nextState}`;
        return NextResponse.redirect(authorize);
      }

      const clientId = process.env.GITHUB_APP_CLIENT_ID;
      const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;
      if (!clientId || !clientSecret) throw new Error("GitHub OAuth credentials are missing.");
      const token = await exchange("https://github.com/login/oauth/access_token", {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: rootUrl("/api/connections/github/callback"),
      });

      const installationsResponse = await fetch("https://api.github.com/user/installations", {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token.access_token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      });

      if (!installationsResponse.ok) throw new Error("GitHub installation validation failed.");
      const installations = (await installationsResponse.json()) as {
        installations: Array<{ id: number; account: { login: string; type: string } }>;
      };
      const installation = installations.installations.find((item) => String(item.id) === installationId);
      if (!installation) throw new Error("This GitHub installation does not belong to the authorized user.");

      await storeProviderConnection(
        oauth.workspaceId,
        "github",
        {
          installationId,
          accountLogin: installation.account.login,
          accountType: installation.account.type,
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          expires_in: token.expires_in,
          refresh_token_expires_in: token.refresh_token_expires_in,
          token_type: token.token_type,
          obtained_at: new Date().toISOString(),
        },
        ["contents:write", "metadata:read", "administration:write"],
      );
    }

    if (provider === "supabase") {
      if (!code) throw new Error("Supabase authorization was cancelled.");
      const clientId = process.env.SUPABASE_OAUTH_CLIENT_ID;
      const clientSecret = process.env.SUPABASE_OAUTH_CLIENT_SECRET;
      if (!clientId || !clientSecret || !oauth.codeVerifier) {
        throw new Error("Supabase OAuth credentials or PKCE verifier are missing.");
      }
      const token = await exchangeSupabase(
        {
          grant_type: "authorization_code",
          code,
          redirect_uri: rootUrl("/api/connections/supabase/callback"),
          code_verifier: oauth.codeVerifier,
        },
        clientId,
        clientSecret,
      );
      await storeProviderConnection(
        oauth.workspaceId,
        "supabase",
        token,
        (process.env.SUPABASE_OAUTH_SCOPES ?? "").split(" ").filter(Boolean),
      );
    }

    if (provider === "vercel") {
      if (!code) throw new Error("Vercel authorization was cancelled.");
      const clientId = process.env.VERCEL_CLIENT_ID;
      const clientSecret = process.env.VERCEL_CLIENT_SECRET;
      if (!clientId || !clientSecret) throw new Error("Vercel OAuth credentials are missing.");
      const token = await exchange("https://api.vercel.com/v2/oauth/access_token", {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: rootUrl("/api/connections/vercel/callback"),
      });
      await storeProviderConnection(oauth.workspaceId, "vercel", token, [
        "project:read-write",
        "deployment:read-write",
      ]);
    }

    clearOAuthCookie(cookieStore, provider);
    const dest = await getRedirectUrl(oauth.workspaceId, `${provider}-connected`, oauth.projectId);
    return NextResponse.redirect(dest);
  } catch (error) {
    seedLog("error", "provider_connection_failed", {
      provider,
      error: error instanceof Error ? error.message : "unknown",
    });
    clearOAuthCookie(cookieStore, provider);
    const dest = await getRedirectUrl(oauth.workspaceId, `${provider}-failed`, oauth.projectId);
    return NextResponse.redirect(dest);
  }
}
