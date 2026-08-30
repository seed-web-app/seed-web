import "server-only";
import type { DeploymentProvider } from "@/lib/providers/contracts";

export class VercelDeploymentProvider implements DeploymentProvider {
  constructor(private token: string, private projectName: string, private teamId?: string) {}
  private async request<T>(path: string, init?: RequestInit): Promise<T> { const separator = path.includes("?") ? "&" : "?"; const url = `https://api.vercel.com${path}${this.teamId ? `${separator}teamId=${encodeURIComponent(this.teamId)}` : ""}`; const response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json", ...init?.headers } }); if (!response.ok) throw new Error(`Hosting operation failed (${response.status}).`); return response.json() as Promise<T>; }
  async getProject() { return this.request<{ id: string; name: string }>(`/v9/projects/${this.projectName}`).catch(() => null); }
  async createProject(name: string) { return this.request<{ id: string; name: string }>("/v11/projects", { method: "POST", body: JSON.stringify({ name, framework: "nextjs" }) }); }
  async setEnvironmentVariable(name: string, value: string) { await this.request(`/v10/projects/${this.projectName}/env`, { method: "POST", body: JSON.stringify({ key: name, value, type: "encrypted", target: ["production", "preview"] }) }); }
  async deploy() { const result = await this.request<{ id: string; url: string }>("/v13/deployments", { method: "POST", body: JSON.stringify({ name: this.projectName, target: null }) }); return { id: result.id, url: `https://${result.url}` }; }
  async getDeploymentStatus(id: string) { const result = await this.request<{ readyState: string }>(`/v13/deployments/${id}`); return ({ QUEUED: "queued", BUILDING: "building", READY: "ready", ERROR: "error" } as const)[result.readyState as "QUEUED"|"BUILDING"|"READY"|"ERROR"] ?? "error"; }
  async getLogs(id: string) { const events = await this.request<Array<{ text?: string }>>(`/v3/deployments/${id}/events`); return events.flatMap(event => event.text ? [event.text] : []); }
}
