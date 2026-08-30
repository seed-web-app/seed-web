/** Core depends only on these contracts; provider adapters live at the edge. */
export type ProviderName = "github" | "supabase" | "vercel" | "openai";
export type ConnectionStatus = "not_connected" | "connecting" | "connected" | "needs_attention";
export interface RepositoryState { commitSha: string; files: Array<{ path: string; sha: string }>; }
export interface SourceProvider { getRepositoryState(): Promise<RepositoryState>; createRepository(name: string): Promise<{ id: string; url: string }>; readFiles(paths?: string[]): Promise<Array<{ path: string; content: string }>>; createBranch(name: string): Promise<void>; writeFiles(files: Array<{ path: string; content: string }>): Promise<void>; commitChanges(message?: string): Promise<{ sha: string }>; }
export interface DatabaseProvider { getCurrentSchema(): Promise<{ hash: string; tables: string[] }>; runMigration(migration: { name: string; sql: string }): Promise<void>; verifyMigration(expectedTables: string[]): Promise<void>; }
export interface DeploymentProvider { getProject(): Promise<{ id: string; name: string } | null>; createProject(name: string): Promise<{ id: string; name: string }>; setEnvironmentVariable(name: string, value: string): Promise<void>; deploy(): Promise<{ id: string; url: string }>; getDeploymentStatus(id: string): Promise<"queued" | "building" | "ready" | "error">; getLogs(id: string): Promise<string[]>; }
export interface AIProvider {
  plan(input: { request: string; skills: string[] }): Promise<SeedPlan>;
  generate(): Promise<never>;
  review(): Promise<never>;
  repair(input: {
    violations: Array<{ file?: string; rule: string; severity: string; reason: string; suggested_fix?: string }>;
    files: Array<{ path: string; content: string }>;
  }): Promise<Array<{ path: string; content: string }>>;
}
export interface SeedPlan { summary: string; skills: string[]; steps: Array<{ title: string; kind: "inspect" | "generate" | "validate" | "deploy" }>; }
