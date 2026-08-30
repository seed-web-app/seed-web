import "server-only";
import type { DeploymentProvider } from "@/lib/providers/contracts";

export interface VercelProjectIdentity {
  id: string;
  name: string;
  accountId?: string;
}

class VercelApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "VercelApiError";
  }
}

export class VercelDeploymentProvider implements DeploymentProvider {
  private resolvedProject: VercelProjectIdentity | null = null;

  constructor(
    private token: string,
    private projectIdentifier: string,
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
      throw new VercelApiError(
        response.status,
        `Vercel ${init?.method ?? "GET"} ${path} failed (${response.status}): ${text}`,
      );
    }
    if (response.status === 204) return {} as T;
    return response.json() as Promise<T>;
  }

  // ── Project ─────────────────────────────────────────────────────────────────

  private targetProjectId(): string {
    return this.resolvedProject?.id ?? this.projectIdentifier;
  }

  async getProject(identifier = this.projectIdentifier): Promise<VercelProjectIdentity | null> {
    try {
      return await this.request<VercelProjectIdentity>(
        `/v9/projects/${encodeURIComponent(identifier)}${this.qs()}`,
      );
    } catch (error) {
      if (error instanceof VercelApiError && error.status === 404) return null;
      throw error;
    }
  }

  /**
   * Resolve the exact persisted project ID before any project-scoped write.
   * A team/account mismatch is treated as an identity error, not as a missing project.
   */
  async requireProject(
    projectId: string,
    expectedAccountId?: string,
  ): Promise<VercelProjectIdentity> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error(
        `Stored Vercel project '${projectId}' could not be found in authorized account/team '${this.teamId ?? "personal"}'. Reconnect Vercel or restore access to that project.`,
      );
    }
    if (expectedAccountId && project.accountId && project.accountId !== expectedAccountId) {
      throw new Error(
        `Stored Vercel project '${projectId}' belongs to account '${project.accountId}', but Seed expected '${expectedAccountId}'. Environment changes were not attempted.`,
      );
    }
    this.resolvedProject = project;
    this.projectIdentifier = project.id;
    return project;
  }

  async createProject(name: string): Promise<VercelProjectIdentity> {
    const project = await this.request<VercelProjectIdentity>(`/v11/projects${this.qs()}`, {
      method: "POST",
      body: JSON.stringify({ name, framework: "nextjs" }),
    });
    this.resolvedProject = project;
    this.projectIdentifier = project.id;
    return project;
  }

  /** Idempotent: get existing project or create it. */
  async createOrReuseProject(name: string): Promise<VercelProjectIdentity> {
    const existing = await this.getProject(name);
    if (existing) {
      this.resolvedProject = existing;
      this.projectIdentifier = existing.id;
      return existing;
    }
    return this.createProject(name);
  }

  // ── Environment variables ───────────────────────────────────────────────────

  /**
   * Idempotently upserts an environment variable on the resolved Vercel project.
   * The caller must resolve the persisted project ID with requireProject first.
   * Never logs the value.
   */
  async setEnvironmentVariable(name: string, value: string): Promise<void> {
    if (!this.resolvedProject) {
      throw new Error(
        "Vercel project identity must be verified before configuring environment variables.",
      );
    }

    try {
      await this.request(
        `/v10/projects/${encodeURIComponent(this.targetProjectId())}/env${this.qs({ upsert: "true" })}`,
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
    } catch (error) {
      if (error instanceof VercelApiError && error.status === 404) {
        throw new Error(
          `Vercel project '${this.targetProjectId()}' was verified in account/team '${this.teamId ?? "personal"}', but this integration cannot access its environment variables. Confirm the installed integration has Project Environment Variables read/write access.`,
        );
      }
      throw error;
    }
  }

  // ── Deployment ──────────────────────────────────────────────────────────────

  /** Trigger a deployment (no git push required — Vercel pulls from linked repo). */
  async deploy(): Promise<{ id: string; url: string }> {
    const result = await this.request<{ id: string; url: string; meta?: { githubCommitSha?: string } }>(
      `/v13/deployments${this.qs()}`,
      {
        method: "POST",
        body: JSON.stringify({
          name: this.resolvedProject?.name ?? this.projectIdentifier,
          project: this.targetProjectId(),
          target: null,
        }),
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
    await this.request(`/v9/projects/${encodeURIComponent(this.targetProjectId())}${this.qs()}`, {
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
