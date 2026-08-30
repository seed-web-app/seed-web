import "server-only";
import { z } from "zod";
import type { RunContext } from "@/lib/seed-run";

const projectAction = z.object({ projectId: z.string().uuid(), runId: z.string().uuid() });
export const seedTools = {
  read_project_files: projectAction.extend({ paths: z.array(z.string().min(1)).max(100).optional() }),
  write_project_files: projectAction.extend({ files: z.array(z.object({ path: z.string().min(1), content: z.string().max(250_000) })).min(1).max(100) }),
  inspect_database_schema: projectAction,
  apply_database_migration: projectAction.extend({ migrationName: z.string().regex(/^[a-z0-9_]+$/), sql: z.string().max(100_000) }),
  get_deployment_status: projectAction.extend({ deploymentId: z.string().min(1) }),
  set_environment_variable: projectAction.extend({ name: z.string().regex(/^[A-Z][A-Z0-9_]*$/), valueReference: z.string().min(1) }),
  create_preview_deployment: projectAction,
  read_deployment_logs: projectAction.extend({ deploymentId: z.string().min(1) }),
} as const;

export function authorizeTool<T>(schema: z.ZodType<T>, input: unknown, context: RunContext) { const parsed = schema.parse(input); if ((parsed as { projectId: string; runId: string }).projectId !== context.projectId || (parsed as { projectId: string; runId: string }).runId !== context.runId) throw new Error("Tool authorization failed."); return parsed; }
