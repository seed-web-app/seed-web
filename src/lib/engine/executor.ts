import "server-only";

import { decryptCredential, encryptCredential } from "@/lib/security/crypto";
import { setRunStep, finishSeedRun } from "@/lib/jobs/queue";
import { generateInstallationToken, GitHubSourceProvider } from "@/lib/providers/github";
import {
  SupabaseDatabaseProvider,
  createSupabaseProject,
  getProjectApiKeys,
  listOrgProjects,
  listSupabaseOrgs,
  waitForProjectReady,
} from "@/lib/providers/supabase-management";
import { VercelDeploymentProvider } from "@/lib/providers/vercel";
import { validateProposal } from "@/lib/seed-guard";
import {
  bookingMigrationSql,
  expectedBookingTables,
  generateBookingApp,
} from "@/lib/engine/booking-app-template";
import { seedLog } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// ── Step names (must match what enqueueSeedRun inserts) ───────────────────────

export const EXECUTOR_STEPS = [
  "inspect",
  "generate_files",
  "guard",
  "github_repo",
  "github_push",
  "supabase_project",
  "supabase_migrate",
  "vercel_project",
  "vercel_env",
  "vercel_deploy",
  "verify_preview",
  "record_snapshot",
] as const;

export type ExecutorStep = (typeof EXECUTOR_STEPS)[number];

// ── Context for one run ───────────────────────────────────────────────────────

export interface ExecutorContext {
  runId: string;
  projectId: string;
  workspaceId: string;
  profileId: string;
  projectName: string;
  projectSlug: string;
}

// ── Step status persistence ───────────────────────────────────────────────────

type StepStatus = "pending" | "running" | "completed" | "failed";

async function getStepStatuses(
  runId: string,
): Promise<Record<string, StepStatus>> {
  const admin = createSupabaseAdminClient();
  if (!admin) return {};
  const { data } = await admin
    .from("seed_run_steps")
    .select("step_type,status")
    .eq("seed_run_id", runId);
  const result: Record<string, StepStatus> = {};
  for (const row of data ?? []) {
    result[row.step_type] = row.status as StepStatus;
  }
  return result;
}

/** Run a step only if it hasn't already completed. Persists status. */
async function runStep<T>(
  runId: string,
  stepName: string,
  statuses: Record<string, StepStatus>,
  fn: () => Promise<T>,
): Promise<T | null> {
  if (statuses[stepName] === "completed") {
    seedLog("info", "seed_step_skipped", { runId, stepName });
    return null;
  }

  await setRunStep(runId, stepName, "running");
  try {
    const result = await fn();
    await setRunStep(runId, stepName, "completed", undefined);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    seedLog("error", "seed_step_failed", { runId, stepName, message });
    await setRunStep(runId, stepName, "failed", undefined, message);
    throw error;
  }
}

// ── Credential helpers ────────────────────────────────────────────────────────

interface GitHubCreds {
  installationId: string;
  accountLogin: string;
  accountType: string;
}

interface SupabaseCreds {
  access_token: string;
  refresh_token?: string;
}

interface VercelCreds {
  access_token: string;
  team_id?: string | null;
}

async function getProviderCredentials(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  workspaceId: string,
  provider: string,
): Promise<string> {
  const { data, error } = await admin
    .from("provider_connections")
    .select("encrypted_access_data,status")
    .eq("workspace_id", workspaceId)
    .eq("provider", provider)
    .eq("status", "connected")
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      `Provider '${provider}' is not connected. Please reconnect in Settings.`,
    );
  }
  return data.encrypted_access_data;
}

async function markProviderNeedsAttention(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  workspaceId: string,
  provider: string,
) {
  await admin
    .from("provider_connections")
    .update({ status: "needs_attention", updated_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("provider", provider);
}

// ── Audit helper ──────────────────────────────────────────────────────────────

async function audit(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  ctx: ExecutorContext,
  toolName: string,
  metadata: Record<string, unknown>,
) {
  await admin.from("audit_events").insert({
    actor_user_id: ctx.profileId,
    workspace_id: ctx.workspaceId,
    project_id: ctx.projectId,
    seed_run_id: ctx.runId,
    tool_name: toolName,
    metadata,
  });
}

// ── Resource persistence ──────────────────────────────────────────────────────

async function upsertResource(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  projectId: string,
  provider: string,
  externalId: string,
  metadata: Record<string, unknown>,
) {
  await admin.from("project_resources").upsert(
    {
      project_id: projectId,
      provider,
      external_id: externalId,
      metadata_json: metadata,
      status: "active",
      last_synced_at: new Date().toISOString(),
    },
    { onConflict: "project_id,provider,external_id" },
  );
}

// ── Preview verification ──────────────────────────────────────────────────────

async function verifyPreviewUrl(
  previewUrl: string,
  maxAttempts = 6,
  delayMs = 10_000,
): Promise<{ ok: boolean; reason?: string }> {
  const healthUrl = `${previewUrl.replace(/\/$/, "")}/api/health`;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(healthUrl, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
      if (res.ok) {
        const body = (await res.json()) as { ok?: boolean; reason?: string };
        if (body.ok) return { ok: true };
        return { ok: false, reason: body.reason };
      }
    } catch {
      // Network error — retry
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return { ok: false, reason: "preview_did_not_respond" };
}

// ── Main executor ─────────────────────────────────────────────────────────────

/**
 * The durable Seed run executor.
 * Called inside next/server `after()` — runs completely after the HTTP response.
 * Each step is idempotent: if already completed, it is skipped.
 * On failure, records the error and marks the run as failed with the exact step.
 */
export async function executeSeedRun(ctx: ExecutorContext): Promise<void> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    seedLog("error", "seed_executor_no_admin", { runId: ctx.runId });
    await finishSeedRun(ctx.runId, "failed");
    return;
  }

  // Load step completion state for partial-failure resume
  const statuses = await getStepStatuses(ctx.runId);

  // Shared state accumulated across steps
  let gitHubToken = "";
  let gitHubOwner = "";
  let repoName = ctx.projectSlug;
  let repoUrl = "";
  let commitSha = "";
  let supabaseUrl = "";
  let supabasePublishableKey = "";
  let supabaseProjectRef = "";
  let supabaseAccessToken = "";
  let vercelDeploymentId = "";
  let previewUrl = "";

  try {
    // ── 1. Inspect ─────────────────────────────────────────────────────────
    await runStep(ctx.runId, "inspect", statuses, async () => {
      // Check that all providers are connected
      for (const provider of ["github", "supabase", "vercel"] as const) {
        await getProviderCredentials(admin, ctx.workspaceId, provider);
      }
      // Load any existing project_resources to resume correctly
      const { data: resources } = await admin
        .from("project_resources")
        .select("provider,external_id,metadata_json")
        .eq("project_id", ctx.projectId);

      for (const r of resources ?? []) {
        const meta = (r.metadata_json ?? {}) as Record<string, unknown>;
        if (r.provider === "github") {
          repoName = (meta.repoName as string) ?? repoName;
          repoUrl = (meta.repoUrl as string) ?? "";
          commitSha = (meta.commitSha as string) ?? "";
          gitHubOwner = (meta.owner as string) ?? "";
        }
        if (r.provider === "supabase") {
          supabaseProjectRef = r.external_id;
          supabaseUrl = (meta.supabaseUrl as string) ?? "";
          supabasePublishableKey = (meta.publishableKey as string) ?? "";
        }
        if (r.provider === "vercel") {
          vercelDeploymentId = (meta.deploymentId as string) ?? "";
          previewUrl = (meta.previewUrl as string) ?? "";
        }
      }

      await audit(admin, ctx, "inspect_project", { projectId: ctx.projectId });
    });

    // ── 2. Generate files ──────────────────────────────────────────────────
    let generatedFiles: Array<{ path: string; content: string }> = [];
    await runStep(ctx.runId, "generate_files", statuses, async () => {
      generatedFiles = generateBookingApp({
        projectName: ctx.projectName,
        supabaseUrl: supabaseUrl || "https://placeholder.supabase.co",
        supabasePublishableKey: supabasePublishableKey || "placeholder-key",
        adminSecret: "",
      });
      await audit(admin, ctx, "generate_files", { fileCount: generatedFiles.length });
    });

    // ── 3. Seed Guard ──────────────────────────────────────────────────────
    await runStep(ctx.runId, "guard", statuses, async () => {
      const guard = validateProposal({
        request: `Build booking website: ${ctx.projectName}`,
        proposedFiles: generatedFiles,
      });
      if (!guard.passed) {
        throw new Error("Seed Guard blocked generated files. Manual review required.");
      }
      await audit(admin, ctx, "seed_guard_passed", { stages: guard.stages.length });
    });

    // ── 4. GitHub repo ─────────────────────────────────────────────────────
    await runStep(ctx.runId, "github_repo", statuses, async () => {
      const encryptedGhCreds = await getProviderCredentials(admin, ctx.workspaceId, "github");
      let ghCreds: GitHubCreds;
      try {
        ghCreds = JSON.parse(decryptCredential(encryptedGhCreds)) as GitHubCreds;
      } catch {
        await markProviderNeedsAttention(admin, ctx.workspaceId, "github");
        throw new Error("GitHub credentials are corrupted. Please reconnect GitHub.");
      }

      const appId = process.env.GITHUB_APP_ID;
      const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
      if (!appId || !privateKey) {
        throw new Error(
          "GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY are required for repository creation.",
        );
      }

      try {
        gitHubToken = await generateInstallationToken(appId, privateKey, ghCreds.installationId);
      } catch (err) {
        await markProviderNeedsAttention(admin, ctx.workspaceId, "github");
        throw err;
      }

      gitHubOwner = ghCreds.accountLogin;
      const github = new GitHubSourceProvider(gitHubToken, gitHubOwner, repoName);
      const result = await github.createOrReuseRepository(
        repoName,
        `${ctx.projectName} — created by Seed`,
      );
      repoName = repoName;
      repoUrl = result.url;

      await upsertResource(admin, ctx.projectId, "github", result.id, {
        repoName,
        repoUrl,
        owner: gitHubOwner,
        defaultBranch: result.defaultBranch,
        commitSha: "",
      });
      await audit(admin, ctx, "create_repository", { repoUrl, owner: gitHubOwner });
    });

    // ── 5. GitHub push ─────────────────────────────────────────────────────
    await runStep(ctx.runId, "github_push", statuses, async () => {
      // Re-generate files with final (or placeholder) Supabase values
      generatedFiles = generateBookingApp({
        projectName: ctx.projectName,
        supabaseUrl: supabaseUrl || "https://placeholder.supabase.co",
        supabasePublishableKey: supabasePublishableKey || "placeholder-key",
        adminSecret: "",
      });

      if (!gitHubToken) {
        // Regenerate token (step may be resuming after partial failure)
        const encryptedGhCreds = await getProviderCredentials(admin, ctx.workspaceId, "github");
        const ghCreds = JSON.parse(decryptCredential(encryptedGhCreds)) as GitHubCreds;
        const appId = process.env.GITHUB_APP_ID!;
        const privateKey = process.env.GITHUB_APP_PRIVATE_KEY!;
        gitHubToken = await generateInstallationToken(appId, privateKey, ghCreds.installationId);
        gitHubOwner = ghCreds.accountLogin;
      }

      const github = new GitHubSourceProvider(gitHubToken, gitHubOwner, repoName);
      commitSha = await github.pushGeneratedApp(generatedFiles);

      // Update resource record with commit SHA
      await upsertResource(admin, ctx.projectId, "github", repoUrl || repoName, {
        repoName,
        repoUrl,
        owner: gitHubOwner,
        commitSha,
      });
      await audit(admin, ctx, "write_project_files", {
        fileCount: generatedFiles.length,
        commitSha,
      });
    });

    // ── 6. Supabase project ────────────────────────────────────────────────
    await runStep(ctx.runId, "supabase_project", statuses, async () => {
      const encryptedSbCreds = await getProviderCredentials(admin, ctx.workspaceId, "supabase");
      let sbCreds: SupabaseCreds;
      try {
        sbCreds = JSON.parse(decryptCredential(encryptedSbCreds)) as SupabaseCreds;
      } catch {
        await markProviderNeedsAttention(admin, ctx.workspaceId, "supabase");
        throw new Error("Supabase credentials are corrupted. Please reconnect Supabase.");
      }

      supabaseAccessToken = sbCreds.access_token;

      if (supabaseProjectRef) {
        // Already created — just fetch keys
        const keys = await getProjectApiKeys(supabaseAccessToken, supabaseProjectRef);
        supabaseUrl = keys.supabaseUrl;
        supabasePublishableKey = keys.publishableKey;
        return;
      }

      // Find the user's organization
      let orgs: Awaited<ReturnType<typeof listSupabaseOrgs>>;
      try {
        orgs = await listSupabaseOrgs(supabaseAccessToken);
      } catch {
        await markProviderNeedsAttention(admin, ctx.workspaceId, "supabase");
        throw new Error("Could not list Supabase organizations. Please reconnect Supabase.");
      }

      if (!orgs.length) {
        throw new Error(
          "No Supabase organization found. Create one at supabase.com before building.",
        );
      }
      const orgId = orgs[0].id;

      // Check if a project for this slug already exists
      const existing = (await listOrgProjects(supabaseAccessToken, orgId)).find(
        (p) => p.name === ctx.projectSlug || p.name === ctx.projectName,
      );

      if (existing) {
        supabaseProjectRef = existing.id;
      } else {
        const { projectRef, dbPassword } = await createSupabaseProject(
          supabaseAccessToken,
          orgId,
          ctx.projectSlug,
        );
        supabaseProjectRef = projectRef;
        // Encrypt and store the DB password (never returned to browser)
        await admin.from("project_resources").upsert(
          {
            project_id: ctx.projectId,
            provider: "supabase_db_password",
            external_id: projectRef,
            metadata_json: { encrypted_db_password: encryptCredential(dbPassword) },
            status: "active",
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: "project_id,provider,external_id" },
        );
      }

      // Wait for project to be ready
      await waitForProjectReady(supabaseAccessToken, supabaseProjectRef);

      const keys = await getProjectApiKeys(supabaseAccessToken, supabaseProjectRef);
      supabaseUrl = keys.supabaseUrl;
      supabasePublishableKey = keys.publishableKey;

      await upsertResource(admin, ctx.projectId, "supabase", supabaseProjectRef, {
        supabaseUrl,
        publishableKey: supabasePublishableKey,
        orgId,
        projectRef: supabaseProjectRef,
      });
      await audit(admin, ctx, "create_supabase_project", {
        projectRef: supabaseProjectRef,
        orgId,
      });
    });

    // ── 7. Supabase migration ──────────────────────────────────────────────
    await runStep(ctx.runId, "supabase_migrate", statuses, async () => {
      if (!supabaseAccessToken) {
        const encryptedSbCreds = await getProviderCredentials(admin, ctx.workspaceId, "supabase");
        const sbCreds = JSON.parse(decryptCredential(encryptedSbCreds)) as SupabaseCreds;
        supabaseAccessToken = sbCreds.access_token;
      }

      const db = new SupabaseDatabaseProvider(supabaseAccessToken, supabaseProjectRef);
      await db.runMigration({ name: "booking_schema", sql: bookingMigrationSql });
      await db.verifyMigration(expectedBookingTables);

      const { hash } = await db.getCurrentSchema();
      await audit(admin, ctx, "apply_migration", {
        migrationName: "booking_schema",
        schemaHash: hash,
        tables: expectedBookingTables,
      });
    });

    // ── 8. Vercel project ──────────────────────────────────────────────────
    let vercelProjectId = "";
    await runStep(ctx.runId, "vercel_project", statuses, async () => {
      const encryptedVcCreds = await getProviderCredentials(admin, ctx.workspaceId, "vercel");
      let vcCreds: VercelCreds;
      try {
        vcCreds = JSON.parse(decryptCredential(encryptedVcCreds)) as VercelCreds;
      } catch {
        await markProviderNeedsAttention(admin, ctx.workspaceId, "vercel");
        throw new Error("Vercel credentials are corrupted. Please reconnect Vercel.");
      }

      const vercel = new VercelDeploymentProvider(
        vcCreds.access_token,
        ctx.projectSlug,
        vcCreds.team_id ?? undefined,
      );
      const project = await vercel.createOrReuseProject(ctx.projectSlug);
      vercelProjectId = project.id;

      // Link the GitHub repository
      if (repoName && gitHubOwner) {
        await vercel.linkGitHubRepository(repoName, gitHubOwner).catch((err) => {
          // Non-fatal — user may manually link
          seedLog("warn", "vercel_link_repo_failed", { error: err.message });
        });
      }

      await upsertResource(admin, ctx.projectId, "vercel", project.id, {
        projectName: ctx.projectSlug,
        vercelProjectId: project.id,
        deploymentId: "",
        previewUrl: "",
        productionUrl: "",
      });
      await audit(admin, ctx, "create_vercel_project", { projectId: project.id });
    });

    // ── 9. Vercel env vars ─────────────────────────────────────────────────
    await runStep(ctx.runId, "vercel_env", statuses, async () => {
      const encryptedVcCreds = await getProviderCredentials(admin, ctx.workspaceId, "vercel");
      const vcCreds = JSON.parse(decryptCredential(encryptedVcCreds)) as VercelCreds;

      const vercel = new VercelDeploymentProvider(
        vcCreds.access_token,
        ctx.projectSlug,
        vcCreds.team_id ?? undefined,
      );

      // Set public Supabase env vars (safe for client-side)
      await vercel.setEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);
      await vercel.setEnvironmentVariable(
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        supabasePublishableKey,
      );

      // Audit records env var names only — never values
      await audit(admin, ctx, "set_environment_variables", {
        names: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
      });
    });

    // ── 10. Vercel deploy ──────────────────────────────────────────────────
    await runStep(ctx.runId, "vercel_deploy", statuses, async () => {
      const encryptedVcCreds = await getProviderCredentials(admin, ctx.workspaceId, "vercel");
      const vcCreds = JSON.parse(decryptCredential(encryptedVcCreds)) as VercelCreds;

      const vercel = new VercelDeploymentProvider(
        vcCreds.access_token,
        ctx.projectSlug,
        vcCreds.team_id ?? undefined,
      );

      const deployment = await vercel.deploy();
      vercelDeploymentId = deployment.id;

      const result = await vercel.waitForDeployment(deployment.id);
      if (result.status !== "ready" || !result.url) {
        // Collect build logs for diagnosis
        const logs = await vercel.getLogs(deployment.id);
        seedLog("error", "vercel_build_failed", {
          deploymentId: deployment.id,
          logLines: logs.slice(-20),
        });
        throw new Error(
          `Vercel build failed. Deployment ID: ${deployment.id}. Check Vercel dashboard for logs.`,
        );
      }

      previewUrl = result.url;

      await upsertResource(admin, ctx.projectId, "vercel", vercelProjectId || ctx.projectSlug, {
        projectName: ctx.projectSlug,
        vercelProjectId,
        deploymentId: vercelDeploymentId,
        previewUrl,
        productionUrl: "",
      });
      await audit(admin, ctx, "create_preview_deployment", {
        deploymentId: vercelDeploymentId,
        previewUrl,
      });
    });

    // ── 11. Verify preview ─────────────────────────────────────────────────
    await runStep(ctx.runId, "verify_preview", statuses, async () => {
      if (!previewUrl) {
        throw new Error("Preview URL is not available for verification.");
      }
      const result = await verifyPreviewUrl(previewUrl);
      if (!result.ok) {
        throw new Error(
          `Preview verification failed: ${result.reason ?? "unknown"}. URL: ${previewUrl}`,
        );
      }
      await audit(admin, ctx, "inspect_deployment", {
        previewUrl,
        verificationPassed: true,
      });
    });

    // ── 12. Record snapshot ────────────────────────────────────────────────
    await runStep(ctx.runId, "record_snapshot", statuses, async () => {
      // Get current schema hash
      let schemaHash = "";
      if (supabaseAccessToken && supabaseProjectRef) {
        const db = new SupabaseDatabaseProvider(supabaseAccessToken, supabaseProjectRef);
        const schema = await db.getCurrentSchema().catch(() => ({ hash: "", tables: [] }));
        schemaHash = schema.hash;
      }

      await admin.from("project_snapshots").insert({
        project_id: ctx.projectId,
        git_commit_sha: commitSha || null,
        schema_hash: schemaHash || null,
        deployment_id: vercelDeploymentId || null,
      });

      // Update project status to "building" → will be set live after production publish
      await admin
        .from("projects")
        .update({ status: "building", updated_at: new Date().toISOString() })
        .eq("id", ctx.projectId);
    });

    // ── All steps done — mark run waiting_for_user (preview ready) ─────────
    await admin
      .from("seed_runs")
      .update({ status: "waiting_for_user" })
      .eq("id", ctx.runId);

    // Update run step with preview URL for the UI to surface
    await admin
      .from("seed_runs")
      .update({ status: "waiting_for_user" })
      .eq("id", ctx.runId);

    seedLog("info", "seed_run_preview_ready", {
      runId: ctx.runId,
      projectId: ctx.projectId,
      previewUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    seedLog("error", "seed_run_failed", { runId: ctx.runId, message });
    await finishSeedRun(ctx.runId, "failed");
  }
}
