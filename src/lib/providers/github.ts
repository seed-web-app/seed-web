import "server-only";
import { createSign } from "crypto";
import type { RepositoryState, SourceProvider } from "@/lib/providers/contracts";

type GitHubFile = { path: string; content: string };

export interface GitHubCreds {
  installationId: string;
  accountLogin: string;
  accountType?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  token_type?: string;
  obtained_at?: string;
}

// ── Installation token ────────────────────────────────────────────────────────

/**
 * Creates a short-lived GitHub App installation token.
 * The token is returned in memory only — never stored.
 * Lifetime: 1 hour maximum (GitHub limit).
 */
export async function generateInstallationToken(
  appId: string,
  privateKeyPem: string,
  installationId: string,
): Promise<string> {
  // Build JWT (RS256) for GitHub App authentication
  const now = Math.floor(Date.now() / 1_000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ iat: now - 60, exp: now + 600, iss: appId }),
  ).toString("base64url");

  // Normalize PEM — Vercel / env vars sometimes strip or double-escape newlines
  let pem = privateKeyPem
    .replace(/\\r/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\r/g, "")
    .trim();

  if (!pem.includes("-----BEGIN RSA PRIVATE KEY-----")) {
    pem = `-----BEGIN RSA PRIVATE KEY-----\n${pem}`;
  }
  if (!pem.includes("-----END RSA PRIVATE KEY-----")) {
    pem = `${pem}\n-----END RSA PRIVATE KEY-----`;
  }

  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(pem, "base64url");
  const jwt = `${header}.${payload}.${signature}`;

  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${jwt}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    },
  );
  if (!response.ok) {
    const text = await response.text().catch(() => response.status.toString());
    throw new Error(`GitHub installation token failed (${response.status}): ${text}`);
  }
  const data = (await response.json()) as { token: string };
  return data.token;
}

/**
 * Refresh an expiring GitHub App User Access Token using its refresh_token.
 */
export async function refreshGitHubUserToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
}> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.status.toString());
    throw new Error(`GitHub user token refresh failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    refresh_token_expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (data.error || !data.access_token) {
    throw new Error(data.error_description || data.error || "GitHub token refresh failed");
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    refresh_token_expires_in: data.refresh_token_expires_in,
  };
}

// ── Provider class ────────────────────────────────────────────────────────────

export class GitHubSourceProvider implements SourceProvider {
  constructor(
    private token: string,
    private owner: string,
    private repo: string,
    private branch = "main",
  ) {}

  private async request<T>(path: string, init?: RequestInit, customToken?: string): Promise<T> {
    const response = await fetch(`https://api.github.com${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${customToken ?? this.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    if (!response.ok) {
      const text = await response.text().catch(() => response.status.toString());
      throw new Error(`GitHub ${init?.method ?? "GET"} ${path} failed (${response.status}): ${text}`);
    }
    // 204 No Content — return empty object
    if (response.status === 204) return {} as T;
    return response.json() as Promise<T>;
  }

  // ── Repository ─────────────────────────────────────────────────────────────

  /**
   * Idempotent: returns existing repo or creates it.
   * If creating for a personal user account, uses the userToken on POST /user/repos.
   * If creating for an organization, uses POST /orgs/{owner}/repos.
   */
  async createOrReuseRepository(
    name: string,
    description = "",
    options?: {
      accountType?: string;
      userToken?: string;
    },
  ): Promise<{ id: string; url: string; defaultBranch: string }> {
    // Check if it already exists under the owner (works with either token)
    const existing = await this.request<{ id: number; html_url: string; default_branch: string }>(
      `/repos/${this.owner}/${name}`,
    ).catch(() => null);

    if (existing) {
      this.repo = name;
      return { id: String(existing.id), url: existing.html_url, defaultBranch: existing.default_branch };
    }

    const isOrg = options?.accountType === "Organization";
    const endpoint = isOrg ? `/orgs/${this.owner}/repos` : "/user/repos";
    const creationToken = isOrg ? this.token : (options?.userToken ?? this.token);

    const created = await this.request<{ id: number; html_url: string; default_branch: string }>(
      endpoint,
      {
        method: "POST",
        body: JSON.stringify({ name, description, private: true, auto_init: true }),
      },
      creationToken,
    );
    this.repo = name;
    return { id: String(created.id), url: created.html_url, defaultBranch: created.default_branch };
  }

  async createRepository(name: string) {
    const result = await this.createOrReuseRepository(name);
    return { id: result.id, url: result.url };
  }

  async getRepositoryState(): Promise<RepositoryState> {
    const ref = await this.request<{ object: { sha: string } }>(
      `/repos/${this.owner}/${this.repo}/git/ref/heads/${this.branch}`,
    );
    const tree = await this.request<{
      tree: Array<{ path: string; sha: string; type: string }>;
    }>(
      `/repos/${this.owner}/${this.repo}/git/trees/${ref.object.sha}?recursive=1`,
    );
    return {
      commitSha: ref.object.sha,
      files: tree.tree
        .filter((item) => item.type === "blob")
        .map((item) => ({ path: item.path, sha: item.sha })),
    };
  }

  async readFiles(paths?: string[]): Promise<GitHubFile[]> {
    const state = await this.getRepositoryState();
    const selected = paths ?? state.files.map((file) => file.path);
    return Promise.all(
      selected.map(async (path) => {
        const file = await this.request<{ content: string; encoding: string }>(
          `/repos/${this.owner}/${this.repo}/contents/${encodeURIComponent(path)}?ref=${this.branch}`,
        );
        return {
          path,
          content:
            file.encoding === "base64"
              ? Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf8")
              : file.content,
        };
      }),
    );
  }

  async createBranch(name: string) {
    const state = await this.getRepositoryState();
    await this.request(`/repos/${this.owner}/${this.repo}/git/refs`, {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${name}`, sha: state.commitSha }),
    });
    this.branch = name;
  }

  /**
   * Pushes files one-by-one (GitHub Contents API).
   * Idempotent: fetches current SHA before each write.
   * Never exposes the token in file content.
   */
  async writeFiles(files: GitHubFile[]) {
    for (const file of files) {
      // Fetch existing blob SHA (needed for updates, absent for new files)
      const current = await this.request<{ sha: string }>(
        `/repos/${this.owner}/${this.repo}/contents/${encodeURIComponent(file.path)}?ref=${this.branch}`,
      ).catch(() => null);

      await this.request(`/repos/${this.owner}/${this.repo}/contents/${encodeURIComponent(file.path)}`, {
        method: "PUT",
        body: JSON.stringify({
          message: `Seed: ${current ? "update" : "add"} ${file.path}`,
          content: Buffer.from(file.content).toString("base64"),
          branch: this.branch,
          ...(current ? { sha: current.sha } : {}),
        }),
      });
    }
  }

  async commitChanges(/* message unused — SHA is read from repo state */) {
    const state = await this.getRepositoryState();
    return { sha: state.commitSha };
  }

  /** Convenience: push generated app files and return commit SHA. */
  async pushGeneratedApp(files: GitHubFile[]): Promise<string> {
    await this.writeFiles(files);
    const state = await this.getRepositoryState();
    return state.commitSha;
  }

  // ── Owner discovery ────────────────────────────────────────────────────────

  /** Returns the authenticated user's login (for use when owner is unknown). */
  async getAuthenticatedUser(): Promise<{ login: string; type: string }> {
    return this.request<{ login: string; type: string }>("/user");
  }
}
