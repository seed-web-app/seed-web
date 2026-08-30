import "server-only";

import OpenAI from "openai";
import { decryptCredential } from "@/lib/security/crypto";
import { generateInstallationToken } from "@/lib/providers/github";
import { listSupabaseOrgs } from "@/lib/providers/supabase-management";
import type { ProviderName } from "@/lib/providers/contracts";

export interface VerificationResult {
  valid: boolean;
  error?: string;
  accountLogin?: string;
  metadata?: Record<string, unknown>;
}

const VERCEL_ENV_WRITE_SCOPES = new Set([
  "read-write:project-env-vars",
  "read-write:global-project-env-vars",
]);

export function hasVercelEnvironmentWriteScope(scopes: unknown): scopes is string[] {
  return Array.isArray(scopes) && scopes.some(
    (scope) => typeof scope === "string" && VERCEL_ENV_WRITE_SCOPES.has(scope),
  );
}

export async function verifyStoredConnection(
  provider: ProviderName,
  encryptedData: string,
): Promise<VerificationResult> {
  let parsed: Record<string, unknown>;
  try {
    const json = decryptCredential(encryptedData);
    parsed = JSON.parse(json) as Record<string, unknown>;
  } catch (err) {
    return {
      valid: false,
      error: `Could not decrypt stored credentials: ${err instanceof Error ? err.message : "invalid cipher"}`,
    };
  }

  if (provider === "openai") {
    const apiKey = parsed.apiKey as string | undefined;
    if (!apiKey) return { valid: false, error: "No API key found in stored credential." };
    try {
      const client = new OpenAI({ apiKey, maxRetries: 0, timeout: 8_000 });
      await client.models.list();
      return { valid: true };
    } catch (err) {
      return {
        valid: false,
        error: `OpenAI API key validation failed: ${err instanceof Error ? err.message : "Unauthorized"}`,
      };
    }
  }

  if (provider === "github") {
    const installationId = parsed.installationId as string | undefined;
    const accountLogin = parsed.accountLogin as string | undefined;
    if (!installationId) {
      return { valid: false, error: "No GitHub App installation ID stored." };
    }

    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
    if (!appId || !privateKey) {
      // If GitHub App credentials are not on server, check if we at least have valid stored data
      return {
        valid: false,
        error: "GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY is not configured on the server.",
      };
    }

    let refreshedUserToken: { access_token: string; refresh_token?: string; expires_in?: number } | undefined;

    // 1. Verify installation token (for repo/file management)
    try {
      const token = await generateInstallationToken(appId, privateKey, installationId);
      const res = await fetch("https://api.github.com/installation/repositories?per_page=1", {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        return {
          valid: false,
          error: `GitHub App installation token could not access repositories (${res.status}).`,
        };
      }
    } catch (err) {
      return {
        valid: false,
        error: `GitHub verification failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      };
    }

    // 2. If user account, verify and refresh user access token if available
    const isUserAccount = (parsed.accountType as string | undefined ?? "User") === "User";
    const userAccessToken = parsed.access_token as string | undefined;
    const userRefreshToken = parsed.refresh_token as string | undefined;

    if (isUserAccount && userAccessToken) {
      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${userAccessToken}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      });

      if (!userRes.ok && userRefreshToken && process.env.GITHUB_APP_CLIENT_ID && process.env.GITHUB_APP_CLIENT_SECRET) {
        try {
          const { refreshGitHubUserToken } = await import("@/lib/providers/github");
          const refreshed = await refreshGitHubUserToken(
            userRefreshToken,
            process.env.GITHUB_APP_CLIENT_ID,
            process.env.GITHUB_APP_CLIENT_SECRET,
          );
          refreshedUserToken = refreshed;
        } catch {
          return {
            valid: false,
            error: "GitHub user authorization expired. Please reconnect GitHub.",
          };
        }
      } else if (!userRes.ok) {
        return {
          valid: false,
          error: "GitHub user authorization invalid. Please reconnect GitHub.",
        };
      }
    }

    return {
      valid: true,
      accountLogin,
      metadata: refreshedUserToken
        ? {
            refreshed: true,
            newTokens: {
              ...parsed,
              access_token: refreshedUserToken.access_token,
              refresh_token: refreshedUserToken.refresh_token ?? userRefreshToken,
              expires_in: refreshedUserToken.expires_in,
            },
          }
        : undefined,
    };
  }

  if (provider === "supabase") {
    const accessToken = parsed.access_token as string | undefined;
    if (!accessToken) {
      return { valid: false, error: "No Supabase OAuth access token stored." };
    }

    try {
      const orgs = await listSupabaseOrgs(accessToken);
      if (!Array.isArray(orgs)) {
        return { valid: false, error: "Supabase returned invalid organization list." };
      }
      return { valid: true, metadata: { orgCount: orgs.length } };
    } catch (err) {
      // Check if we can refresh the token
      const refreshToken = parsed.refresh_token as string | undefined;
      const clientId = process.env.SUPABASE_OAUTH_CLIENT_ID;
      const clientSecret = process.env.SUPABASE_OAUTH_CLIENT_SECRET;

      if (refreshToken && clientId && clientSecret) {
        try {
          const authorization = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
          const refreshRes = await fetch("https://api.supabase.com/v1/oauth/token", {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${authorization}`,
            },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: refreshToken,
            }).toString(),
            cache: "no-store",
          });

          if (refreshRes.ok) {
            const newTokens = (await refreshRes.json()) as Record<string, unknown>;
            return {
              valid: true,
              metadata: { refreshed: true, newTokens },
            };
          }
        } catch {
          // Fall through
        }
      }

      return {
        valid: false,
        error: `Supabase authorization failed: ${err instanceof Error ? err.message : "Token expired or revoked"}`,
      };
    }
  }

  if (provider === "vercel") {
    const accessToken = parsed.access_token as string | undefined;
    const teamId = parsed.team_id as string | undefined | null;
    const installationId = parsed.installation_id as string | undefined;

    if (!accessToken) {
      return { valid: false, error: "No Vercel OAuth access token stored." };
    }

    if (!installationId) {
      return { valid: false, error: "No Vercel integration configuration ID stored." };
    }

    try {
      const configurationUrl = new URL(
        `https://api.vercel.com/v1/integrations/configuration/${encodeURIComponent(installationId)}`,
      );
      if (teamId) configurationUrl.searchParams.set("teamId", teamId);

      const configurationResponse = await fetch(configurationUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });
      if (!configurationResponse.ok) {
        return {
          valid: false,
          error: `Vercel installation verification failed (${configurationResponse.status}). Reconnect Vercel.`,
        };
      }

      const configuration = (await configurationResponse.json()) as {
        id?: string;
        scopes?: string[];
        projectSelection?: string;
      };
      if (!hasVercelEnvironmentWriteScope(configuration.scopes)) {
        return {
          valid: false,
          error:
            "Vercel permission upgrade is not approved. Reconnect Vercel and approve Project Environment Variables: Read/Write.",
          metadata: {
            configurationId: configuration.id ?? installationId,
            projectSelection: configuration.projectSelection ?? null,
            requiredScope: "read-write:project-env-vars",
          },
        };
      }

      const url = teamId
        ? `https://api.vercel.com/v2/teams/${teamId}`
        : "https://api.vercel.com/v2/user";

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        return {
          valid: false,
          error: `Vercel authorization verification failed (${res.status}).`,
        };
      }

      const info = (await res.json()) as Record<string, unknown>;
      return {
        valid: true,
        accountLogin: (info.user as { username?: string })?.username || (info.name as string),
        metadata: {
          configurationId: configuration.id ?? installationId,
          projectSelection: configuration.projectSelection ?? null,
          scopes: configuration.scopes ?? [],
        },
      };
    } catch (err) {
      return {
        valid: false,
        error: `Vercel authorization failed: ${err instanceof Error ? err.message : "Token expired or revoked"}`,
      };
    }
  }

  return { valid: false, error: "Unsupported provider." };
}
