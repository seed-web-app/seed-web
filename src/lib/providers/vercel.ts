import "server-only";
import type { DeploymentProvider } from "@/lib/providers/contracts";

export class VercelDeploymentProvider implements DeploymentProvider {
  constructor(
    private token: string,
    private projectName: string,
    private teamId?: string,
  ) {}

  private qs(extra?: Record<string, string>): string {
    const params: Record<string, string> = {};
    if (this.teamId) params.teamId = this.teamId;
    if (extra) Object.assign(params, extra);
    const str = new URLSearchParams(params).toString();
    return str ? `?${str}` : "";
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `https://api.vercel.com${path}`;
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    if (!response.ok) {
      const text = await response.text().catch(() => response.status.toString());
      throw new Error(
        `Vercel ${init?.method ?? "GET"} ${path} failed (${response.status}): ${text}`,
      );
    }
    if (response.status === 204) return {} as T;
    return response.json() as Promise<T>;
  }

  // ── Project ─────────────────────────────────────────────────────────────────

  async getProject(): Promise<{ id: string; name: string } | null> {
    return this.request<{ id: string; name: string }>(
      `/v9/projects/${encodeURIComponent(this.projectName)}${this.qs()}`,
    ).catch(() => null);
  }

  async createProject(name: string): Promise<{ id: string; name: string }> {
    return this.request<{ id: string; name: string }>(`/v11/projects${this.qs()}`, {
      method: "POST",
      body: JSON.stringify({ name, framework: "nextjs" }),
    });
  }

  /** Idempotent: get existing project or create it. */
  async createOrReuseProject(name: string): Promise<{ id: string; name: string }> {
    const existing = await this.getProject();
    if (existing) return existing;
    const created = await this.createProject(name);
    this.projectName = created.name;
    return created;
  }

  // ── Environment variables ───────────────────────────────────────────────────

  /**
   * Upserts an environment variable on a Vercel project.
   * Checks existing env vars first — updates if present, creates if absent.
   * Never logs the value.
   */
  async setEnvironmentVariable(name: string, value: string): Promise<void> {
    // List existing env vars
    const existing = await this.request<{
      envs: Array<{ id: string; key: string }>;
    }>(`/v10/projects/${encodeURIComponent(this.projectName)}/env${this.qs()}`).catch(
      () => ({ envs: [] }),
    );

    const found = existing.envs.find((e) => e.key === name);
    if (found) {
      // Update existing
      await this.request(
        `/v10/projects/${encodeURIComponent(this.projectName)}/env/${found.id}${this.qs()}`,
        {
          method: "PATCH",
          body: JSON.stringify({ value, type: "encrypted", target: ["production", "preview"] }),
        },
      );
    } else {
      // Create new
      await this.request(
        `/v10/projects/${encodeURIComponent(this.projectName)}/env${this.qs()}`,
        {
          method: "POST",
          body: JSON.stringify({
            key: name,
            value,
            type: "encrypted",
            target: ["production", "preview"],
          }),
        },
      );
    }
  }

  // ── Deployment ──────────────────────────────────────────────────────────────

  /** Trigger a deployment (no git push required — Vercel pulls from linked repo). */
  async deploy(): Promise<{ id: string; url: string }> {
    const result = await this.request<{ id: string; url: string; meta?: { githubCommitSha?: string } }>(
      `/v13/deployments${this.qs()}`,
      {
        method: "POST",
        body: JSON.stringify({ name: this.projectName, target: null }),
      },
    );
    return { id: result.id, url: `https://${result.url}` };
  }

  async getDeploymentStatus(id: string): Promise<"queued" | "building" | "ready" | "error"> {
    const result = await this.request<{ readyState: string }>(
      `/v13/deployments/${id}${this.qs()}`,
    );
    const map: Record<string, "queued" | "building" | "ready" | "error"> = {
      QUEUED: "queued",
      BUILDING: "building",
      READY: "ready",
      ERROR: "error",
      CANCELED: "error",
    };
    return map[result.readyState] ?? "error";
  }

  /**
   * Poll until the deployment is ready or fails.
   * Returns the final status and preview URL.
   */
  async waitForDeployment(
    deploymentId: string,
    maxAttempts = 60,
    delayMs = 10_000,
  ): Promise<{ status: "ready" | "error"; url: string | null }> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getDeploymentStatus(deploymentId);
      if (status === "ready") {
        const info = await this.request<{ url: string }>(`/v13/deployments/${deploymentId}${this.qs()}`);
        return { status: "ready", url: `https://${info.url}` };
      }
      if (status === "error") return { status: "error", url: null };
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    return { status: "error", url: null };
  }

  async getLogs(id: string): Promise<string[]> {
    const events = await this.request<Array<{ text?: string }>>(
      `/v3/deployments/${id}/events${this.qs()}`,
    ).catch(() => [] as Array<{ text?: string }>);
    return events.flatMap((event) => (event.text ? [event.text] : []));
  }

  /** Connect a GitHub repo to this Vercel project. */
  async linkGitHubRepository(
    repo: string,
    owner: string,
    gitHubOrgId?: number,
  ): Promise<void> {
    await this.request(`/v9/projects/${encodeURIComponent(this.projectName)}${this.qs()}`, {
      method: "PATCH",
      body: JSON.stringify({
        link: {
          type: "github",
          repo: `${owner}/${repo}`,
          ...(gitHubOrgId ? { org: gitHubOrgId } : {}),
        },
      }),
    });
  }

  /** Promote a preview deployment to production. */
  async promoteToProduction(deploymentId: string): Promise<void> {
    await this.request(`/v13/deployments/${deploymentId}/promote${this.qs()}`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }
}
