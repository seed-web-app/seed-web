import "server-only";
import { createHash, randomBytes } from "crypto";
import type { DatabaseProvider } from "@/lib/providers/contracts";
import { validateProposal } from "@/lib/seed-guard";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SupabaseProject {
  id: string; // project ref
  name: string;
  region: string;
  status: string;
  organization_id: string;
  database: { host: string } | null;
}

interface SupabaseOrg {
  id: string;
  name: string;
}

// ── Management API helpers ────────────────────────────────────────────────────

async function managementRequest<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`https://api.supabase.com${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => response.status.toString());
    throw new Error(
      `Supabase Management ${init?.method ?? "GET"} ${path} failed (${response.status}): ${text}`,
    );
  }
  if (response.status === 204) return {} as T;
  return response.json() as Promise<T>;
}

/** List the organizations the token has access to. */
export async function listSupabaseOrgs(accessToken: string): Promise<SupabaseOrg[]> {
  return managementRequest<SupabaseOrg[]>("/v1/organizations", accessToken);
}

/** List projects within an organization. */
export async function listOrgProjects(
  accessToken: string,
  orgId: string,
): Promise<SupabaseProject[]> {
  const all = await managementRequest<SupabaseProject[]>("/v1/projects", accessToken);
  return all.filter((p) => p.organization_id === orgId);
}

/**
 * Create a new Supabase project inside an org.
 * Generates a strong random DB password and returns it (caller must encrypt + store).
 */
export async function createSupabaseProject(
  accessToken: string,
  orgId: string,
  name: string,
  region = "us-east-1",
): Promise<{ projectRef: string; dbPassword: string }> {
  const dbPassword = randomBytes(24).toString("base64url");
  const project = await managementRequest<{ id: string; ref: string }>(
    "/v1/projects",
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ organization_id: orgId, name, db_pass: dbPassword, region }),
    },
  );
  return { projectRef: project.ref ?? project.id, dbPassword };
}

/**
 * Wait until a Supabase project status is "ACTIVE_HEALTHY".
 * Polls up to maxAttempts times with delayMs between each.
 */
export async function waitForProjectReady(
  accessToken: string,
  projectRef: string,
  maxAttempts = 30,
  delayMs = 10_000,
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const project = await managementRequest<SupabaseProject>(
      `/v1/projects/${projectRef}`,
      accessToken,
    ).catch(() => null);
    if (project?.status === "ACTIVE_HEALTHY") return;
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error(`Supabase project ${projectRef} did not become ready in time.`);
}

/** Get project connection details needed for env vars. */
export async function getProjectApiKeys(
  accessToken: string,
  projectRef: string,
): Promise<{ supabaseUrl: string; publishableKey: string }> {
  const keys = await managementRequest<Array<{ name: string; api_key: string }>>(
    `/v1/projects/${projectRef}/api-keys`,
    accessToken,
  );
  const anon = keys.find((k) => k.name === "anon");
  if (!anon) throw new Error("Supabase anon key not found for project.");
  return {
    supabaseUrl: `https://${projectRef}.supabase.co`,
    publishableKey: anon.api_key,
  };
}

// ── Database provider (query + migration) ─────────────────────────────────────

export class SupabaseDatabaseProvider implements DatabaseProvider {
  constructor(
    private accessToken: string,
    private projectRef: string,
  ) {}

  private async query<T>(sql: string): Promise<T[]> {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${this.projectRef}/database/query`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sql }),
      },
    );
    if (!response.ok) {
      const text = await response.text().catch(() => response.status.toString());
      throw new Error(`Supabase query failed (${response.status}): ${text}`);
    }
    return response.json() as Promise<T[]>;
  }

  async getCurrentSchema() {
    const rows = await this.query<{
      table_name: string;
      column_name: string;
      data_type: string;
    }>(
      "select table_name, column_name, data_type " +
        "from information_schema.columns " +
        "where table_schema = 'public' " +
        "order by table_name, ordinal_position",
    );
    const serialized = JSON.stringify(rows);
    return {
      hash: createHash("sha256").update(serialized).digest("hex"),
      tables: [...new Set(rows.map((row) => row.table_name))],
    };
  }

  async runMigration(migration: { name: string; sql: string }) {
    const guard = validateProposal({
      request: `Apply database migration ${migration.name}`,
      proposedFiles: [{ path: `${migration.name}.sql`, content: migration.sql }],
    });
    if (!guard.passed)
      throw new Error(
        "Seed Guard blocked this database migration. The SQL contains unsafe patterns.",
      );
    await this.query(migration.sql);
  }

  async verifyMigration(expectedTables: string[]) {
    const state = await this.getCurrentSchema();
    const missing = expectedTables.filter((table) => !state.tables.includes(table));
    if (missing.length)
      throw new Error(
        `Database verification failed: tables not found: ${missing.join(", ")}`,
      );
  }
}
