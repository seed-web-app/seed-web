import { z } from "zod";
import type { DatabaseProvider, DeploymentProvider, RepositoryState, SeedPlan, SourceProvider } from "@/lib/providers/contracts";
import { validateProposal } from "@/lib/seed-guard";

export const runContextSchema = z.object({ userId: z.string().min(1), workspaceId: z.string().min(1), projectId: z.string().min(1), runId: z.string().min(1) });
export type RunContext = z.infer<typeof runContextSchema>;
export type ProjectSnapshot = { gitCommitSha: string | null; schemaHash: string | null; deploymentId: string | null };
export type CurrentProjectState = { repository: RepositoryState; database: { hash: string; tables: string[] }; deployment: { id: string; name: string } | null; driftDetected: boolean };

export async function inspectCurrentProject(source: SourceProvider, database: DatabaseProvider, deployment: DeploymentProvider, snapshot?: ProjectSnapshot): Promise<CurrentProjectState> {
  const [repository, currentDatabase, currentDeployment] = await Promise.all([source.getRepositoryState(), database.getCurrentSchema(), deployment.getProject()]);
  const driftDetected = Boolean(snapshot && (snapshot.gitCommitSha !== repository.commitSha || snapshot.schemaHash !== currentDatabase.hash || snapshot.deploymentId !== currentDeployment?.id));
  return { repository, database: currentDatabase, deployment: currentDeployment, driftDetected };
}

export function prepareGuardedRun(context: RunContext, request: string, plan: SeedPlan) {
  runContextSchema.parse(context);
  const guard = validateProposal({ request });
  if (!guard.passed) throw new Error("Seed Guard blocked this request.");
  return { context, request, plan, status: "waiting_for_user" as const, message: "Plan is ready. Approve it to create a preview.", guard };
}
