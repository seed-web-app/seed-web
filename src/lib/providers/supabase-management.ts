import "server-only";
import { createHash } from "crypto";
import type { DatabaseProvider } from "@/lib/providers/contracts";
import { validateProposal } from "@/lib/seed-guard";

export class SupabaseDatabaseProvider implements DatabaseProvider {
  constructor(private accessToken: string, private projectRef: string) {}
  private async query<T>(query: string): Promise<T[]> { const response = await fetch(`https://api.supabase.com/v1/projects/${this.projectRef}/database/query`, { method: "POST", headers: { Authorization: `Bearer ${this.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ query }) }); if (!response.ok) throw new Error(`Database operation failed (${response.status}).`); return response.json() as Promise<T[]>; }
  async getCurrentSchema() { const rows = await this.query<{ table_name: string; column_name: string; data_type: string }>("select table_name, column_name, data_type from information_schema.columns where table_schema = 'public' order by table_name, ordinal_position"); const serialized = JSON.stringify(rows); return { hash: createHash("sha256").update(serialized).digest("hex"), tables: [...new Set(rows.map(row => row.table_name))] }; }
  async runMigration(migration: { name: string; sql: string }) { const guard = validateProposal({ request: `Apply database migration ${migration.name}`, proposedFiles: [{ path: `${migration.name}.sql`, content: migration.sql }] }); if (!guard.passed) throw new Error("Seed Guard blocked this database migration."); await this.query(migration.sql); }
  async verifyMigration(expectedTables: string[]) { const state = await this.getCurrentSchema(); const missing = expectedTables.filter(table => !state.tables.includes(table)); if (missing.length) throw new Error(`Database verification failed for ${missing.length} table(s).`); }
}
