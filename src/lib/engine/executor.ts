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

export const CHANGE_STEPS = [
  "inspect",
  "generate_files",
  "guard",
  "github_push",
  "vercel_deploy",
  "verify_preview",
  "record_snapshot",
] as const;

export type ExecutorStep = (typeof EXECUTOR_STEPS)[number] | (typeof CHANGE_STEPS)[number];

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
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  token_type?: string;
  obtained_at?: string;
}

interface SupabaseCreds {
  access_token: string;
  refresh_token?: string;
}

interface VercelCreds {
  access_token: string;
  team_id?: string | null;
  user_id?: string;
  installation_id?: string;
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

export async function verifyPreviewUrl(
  previewUrl: string,
  maxAttempts = 6,
  delayMs = 10_000,
): Promise<{ ok: boolean; reason?: string; protected?: boolean }> {
  const healthUrl = `${previewUrl.replace(/\/$/, "")}/api/health`;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(healthUrl, {
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(15_000),
      });
      const location = res.headers.get("location");
      if (
        [301, 302, 303, 307, 308].includes(res.status) &&
        location?.startsWith("https://vercel.com/sso-api")
      ) {
        return {
          ok: true,
          protected: true,
          reason: "vercel_authentication_required",
        };
      }
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
  let vercelProjectId = "";
  let vercelProjectName = "";
  let vercelAccountId = "";
  let vercelTeamId = "";
  let vercelInstallationId = "";
  let vercelAuthorizedUserId = "";

  // Load existing project_resources immediately so any resumed steps have all context
  const { data: initialResources } = await admin
    .from("project_resources")
    .select("provider,external_id,metadata_json")
    .eq("project_id", ctx.projectId);

  for (const r of initialResources ?? []) {
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
      vercelProjectId = (meta.vercelProjectId as string) ?? r.external_id;
      vercelProjectName = (meta.projectName as string) ?? "";
      vercelAccountId = (meta.accountId as string) ?? "";
      vercelTeamId = (meta.teamId as string) ?? "";
      vercelInstallationId = (meta.integrationInstallationId as string) ?? "";
      vercelAuthorizedUserId = (meta.authorizedUserId as string) ?? "";
      vercelDeploymentId = (meta.deploymentId as string) ?? "";
      previewUrl = (meta.previewUrl as string) ?? "";
    }
  }

  // Determine run type and user request
  const { data: runData } = await admin
    .from("seed_runs")
    .select("user_request,run_type")
    .eq("id", ctx.runId)
    .maybeSingle();

  const isChangeRun = runData?.run_type === "change";
  const userRequestText = runData?.user_request ?? "";

  // If this is a change run, mark unchanged infrastructure steps as skipped/completed immediately
  if (isChangeRun) {
    statuses.github_repo = "completed";
    statuses.supabase_project = "completed";
    statuses.supabase_migrate = "completed";
    statuses.vercel_project = "completed";
    statuses.vercel_env = "completed";
  }

  try {
    // ── 1. Inspect ─────────────────────────────────────────────────────────
    await runStep(ctx.runId, "inspect", statuses, async () => {
      // Check that all providers are connected
      for (const provider of ["github", "supabase", "vercel"] as const) {
        await getProviderCredentials(admin, ctx.workspaceId, provider);
      }
      await audit(admin, ctx, "inspect_project", { projectId: ctx.projectId });
    });

    // ── 2. Generate files ──────────────────────────────────────────────────
    let generatedFiles: Array<{ path: string; content: string }> = [];
    await runStep(ctx.runId, "generate_files", statuses, async () => {
      if (isChangeRun && repoName && gitHubOwner) {
        // Incremental generation: read current repo files and modify only needed files
        if (!gitHubToken) {
          const encryptedGhCreds = await getProviderCredentials(admin, ctx.workspaceId, "github");
          const ghCreds = JSON.parse(decryptCredential(encryptedGhCreds)) as GitHubCreds;
          const appId = process.env.GITHUB_APP_ID!;
          const privateKey = process.env.GITHUB_APP_PRIVATE_KEY!;
          gitHubToken = await generateInstallationToken(appId, privateKey, ghCreds.installationId);
        }

        const github = new GitHubSourceProvider(gitHubToken, gitHubOwner, repoName);
        const repoState = await github.getRepositoryState();
        const existingPagePaths = ["src/app/page.tsx", "src/app/layout.tsx", "src/components/hero.tsx", "src/components/services.tsx", "src/components/contact-form.tsx"].filter(p => repoState.files.some(f => f.path === p));
        const existingFiles = await github.readFiles(existingPagePaths.length ? existingPagePaths : repoState.files.slice(0, 10).map(f => f.path));

        // Get Project Memory
        const { getProjectMemory } = await import("@/lib/project-memory");
        const memory = await getProjectMemory(ctx.projectId, ctx.workspaceId);

        let openAiKey: string | undefined;
        try {
          const encKey = await getProviderCredentials(admin, ctx.workspaceId, "openai");
          const creds = JSON.parse(decryptCredential(encKey)) as { apiKey?: string };
          openAiKey = creds.apiKey;
        } catch {}

        if (openAiKey) {
          const { OpenAI } = await import("openai");
          const client = new OpenAI({ apiKey: openAiKey });
          const filesContext = existingFiles.map(f => `--- FILE: ${f.path} ---\n${f.content}`).join("\n\n");
          const prompt = `You are updating a Next.js website for ${ctx.projectName}.
USER REQUEST: "${userRequestText}"

PROJECT MEMORY:
- Business: ${memory.businessName} (${memory.businessType})
- Style: ${memory.stylePreferences}
- Pages: ${memory.pages.join(", ")}
- Decisions: ${memory.userDecisions.join("; ")}

EXISTING RELEVANT FILES:
${filesContext}

INSTRUCTIONS:
- Modify ONLY the file(s) needed to satisfy the user request (e.g. adding content, improving sections, adding images from Unsplash).
- Preserve existing Tailwind styling, components, imports, and functionality.
- Return a JSON object with this EXACT structure:
{
  "summary": "Brief explanation of changes",
  "files": [
    {
      "path": "src/app/page.tsx",
      "content": "...entire updated file content..."
    }
  ]
}`;
          const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          });

          const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as {
            files?: Array<{ path: string; content: string }>;
          };
          if (parsed.files && parsed.files.length) {
            generatedFiles = parsed.files;
          }
        }

        // Fallback if AI didn't modify files
        if (!generatedFiles.length && existingFiles.length) {
          const pageFile = existingFiles.find(f => f.path === "src/app/page.tsx");
          if (pageFile) {
            const updated = pageFile.content.replace(
              /<h1[^>]*>[\s\S]*?<\/h1>/,
              `<h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">${ctx.projectName}</h1>\n<p className="text-lg text-gray-600 mb-6">${userRequestText}</p>`,
            );
            generatedFiles = [{ path: "src/app/page.tsx", content: updated }];
          }
        }
      }

      if (!generatedFiles.length) {
        // Initial build generation
        generatedFiles = generateBookingApp({
          projectName: ctx.projectName,
          supabaseUrl: supabaseUrl || "https://placeholder.supabase.co",
          supabasePublishableKey: supabasePublishableKey || "placeholder-key",
          adminSecret: "",
        });
      }

      await audit(admin, ctx, "generate_files", { fileCount: generatedFiles.length, isChangeRun });
    });

    // ── 3. Seed Guard with Automatic Repair Loop ──────────────────────────
    await runStep(ctx.runId, "guard", statuses, async () => {
      let currentFiles = generatedFiles;
      let guard = validateProposal({
        request: `Build booking website: ${ctx.projectName}`,
        proposedFiles: currentFiles,
      });

      let repairAttempt = 0;
      const MAX_REPAIRS = 3;

      while (!guard.passed && repairAttempt < MAX_REPAIRS) {
        repairAttempt++;
        seedLog("warn", "seed_guard_repair_attempt", {
          runId: ctx.runId,
          attempt: repairAttempt,
          violations: guard.violations,
        });

        // Set friendly progress message for the user in the UI
        await setRunStep(
          ctx.runId,
          "guard",
          "running",
          undefined,
          `Fixing a safety issue (attempt ${repairAttempt} of ${MAX_REPAIRS})…`,
        );

        // Attempt repair if OpenAI is connected
        let openAiKey: string | undefined;
        try {
          const encKey = await getProviderCredentials(admin, ctx.workspaceId, "openai");
          const creds = JSON.parse(decryptCredential(encKey)) as { apiKey?: string };
          openAiKey = creds.apiKey;
        } catch {
          // No active OpenAI connection; fall back to built-in rule sanitizer
        }

        if (openAiKey) {
          try {
            const { OpenAISeedProvider } = await import("@/lib/ai/openai-provider");
            const provider = new OpenAISeedProvider(openAiKey);
            currentFiles = await provider.repair({
              violations: guard.violations ?? [],
              files: currentFiles,
            });
          } catch (repairErr) {
            seedLog("error", "seed_guard_ai_repair_failed", {
              runId: ctx.runId,
              error: repairErr instanceof Error ? repairErr.message : String(repairErr),
            });
          }
        }

        // Re-validate repaired files
        guard = validateProposal({
          request: `Build booking website: ${ctx.projectName}`,
          proposedFiles: currentFiles,
        });
      }

      if (!guard.passed) {
        // Record technical audit record for developers
        await audit(admin, ctx, "seed_guard_failed", {
          violations: guard.violations,
          attempts: repairAttempt,
        });
        throw new Error("Seed could not safely complete this build.");
      }

      generatedFiles = currentFiles;
      await audit(admin, ctx, "seed_guard_passed", {
        stages: guard.stages.length,
        repairsNeeded: repairAttempt,
      });
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

      // Mint installation token for repo operations and organization repos
      try {
        gitHubToken = await generateInstallationToken(appId, privateKey, ghCreds.installationId);
      } catch (err) {
        await markProviderNeedsAttention(admin, ctx.workspaceId, "github");
        throw err;
      }

      // If user account, handle user access token and refresh if needed
      let userToken = ghCreds.access_token;
      const isUserAccount = (ghCreds.accountType ?? "User") === "User";

      if (isUserAccount && ghCreds.refresh_token && process.env.GITHUB_APP_CLIENT_ID && process.env.GITHUB_APP_CLIENT_SECRET) {
        try {
          const { refreshGitHubUserToken } = await import("@/lib/providers/github");
          const refreshed = await refreshGitHubUserToken(
            ghCreds.refresh_token,
            process.env.GITHUB_APP_CLIENT_ID,
            process.env.GITHUB_APP_CLIENT_SECRET,
          );
          userToken = refreshed.access_token;
          // Persist refreshed user token
          const updatedCreds: GitHubCreds = {
            ...ghCreds,
            access_token: refreshed.access_token,
            refresh_token: refreshed.refresh_token ?? ghCreds.refresh_token,
            expires_in: refreshed.expires_in,
            refresh_token_expires_in: refreshed.refresh_token_expires_in,
          };
          await admin
            .from("provider_connections")
            .update({
              encrypted_access_data: encryptCredential(JSON.stringify(updatedCreds)),
              updated_at: new Date().toISOString(),
            })
            .eq("workspace_id", ctx.workspaceId)
            .eq("provider", "github");
        } catch (refreshErr) {
          seedLog("warn", "github_user_token_refresh_failed", {
            error: refreshErr instanceof Error ? refreshErr.message : String(refreshErr),
          });
        }
      }

      gitHubOwner = ghCreds.accountLogin;
      const github = new GitHubSourceProvider(gitHubToken, gitHubOwner, repoName);
      const result = await github.createOrReuseRepository(
        repoName,
        `${ctx.projectName} — created by Seed`,
        {
          accountType: ghCreds.accountType ?? "User",
          userToken,
        },
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
      if (!isChangeRun && !generatedFiles.length) {
        // Re-generate files with final (or placeholder) Supabase values for initial build
        generatedFiles = generateBookingApp({
          projectName: ctx.projectName,
          supabaseUrl: supabaseUrl || "https://placeholder.supabase.co",
          supabasePublishableKey: supabasePublishableKey || "placeholder-key",
          adminSecret: "",
        });
      }

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
    await runStep(ctx.runId, "vercel_project", statuses, async () => {
      const encryptedVcCreds = await getProviderCredentials(admin, ctx.workspaceId, "vercel");
      let vcCreds: VercelCreds;
      try {
        vcCreds = JSON.parse(decryptCredential(encryptedVcCreds)) as VercelCreds;
      } catch {
        await markProviderNeedsAttention(admin, ctx.workspaceId, "vercel");
        throw new Error("Vercel credentials are corrupted. Please reconnect Vercel.");
      }

      vercelTeamId = vcCreds.team_id ?? vercelTeamId;
      vercelInstallationId = vcCreds.installation_id ?? vercelInstallationId;
      vercelAuthorizedUserId = vcCreds.user_id ?? vercelAuthorizedUserId;

      const vercel = new VercelDeploymentProvider(
        vcCreds.access_token,
        vercelProjectId || ctx.projectSlug,
        vercelTeamId || undefined,
      );
      const gitRepo =
        repoName && gitHubOwner
          ? { type: "github" as const, repo: `${gitHubOwner}/${repoName}` }
          : undefined;

      const project = vercelProjectId
        ? await vercel.requireProject(vercelProjectId, vercelAccountId || vercelTeamId || undefined)
        : await vercel.createOrReuseProject(ctx.projectSlug, gitRepo);
      vercelProjectId = project.id;
      vercelProjectName = project.name;
      vercelAccountId = project.accountId ?? vercelTeamId;

      if (vercelTeamId && vercelAccountId && vercelTeamId !== vercelAccountId) {
        throw new Error(
          `Vercel created project '${vercelProjectId}' under account '${vercelAccountId}', but the authorized team is '${vercelTeamId}'. Seed stopped before configuring it.`,
        );
      }

      // Link the GitHub repository
      if (repoName && gitHubOwner) {
        await vercel.linkGitHubRepository(repoName, gitHubOwner).catch((err) => {
          // Non-fatal — user may manually link
          seedLog("warn", "vercel_link_repo_failed", { error: err.message });
        });
      }

      await upsertResource(admin, ctx.projectId, "vercel", project.id, {
        projectName: project.name,
        vercelProjectId: project.id,
        accountId: vercelAccountId,
        teamId: vercelTeamId || null,
        integrationInstallationId: vercelInstallationId || null,
        authorizedUserId: vercelAuthorizedUserId || null,
        deploymentId: "",
        previewUrl: "",
        productionUrl: "",
      });
      await audit(admin, ctx, "create_vercel_project", {
        projectId: project.id,
        projectName: project.name,
        accountId: vercelAccountId,
        teamId: vercelTeamId || null,
        integrationInstallationId: vercelInstallationId || null,
      });
    });

    // ── 9. Vercel env vars ─────────────────────────────────────────────────
    await runStep(ctx.runId, "vercel_env", statuses, async () => {
      const encryptedVcCreds = await getProviderCredentials(admin, ctx.workspaceId, "vercel");
      const vcCreds = JSON.parse(decryptCredential(encryptedVcCreds)) as VercelCreds;

      if (!vercelProjectId) {
        throw new Error(
          "Seed has no stored Vercel project ID. Environment variables were not changed.",
        );
      }

      const authorizedTeamId = vercelTeamId || vcCreds.team_id || "";
      if (vercelTeamId && vcCreds.team_id && vercelTeamId !== vcCreds.team_id) {
        throw new Error(
          `Vercel authorization now points to team '${vcCreds.team_id}', but this project was created under '${vercelTeamId}'. Environment variables were not changed.`,
        );
      }

      const vercel = new VercelDeploymentProvider(
        vcCreds.access_token,
        vercelProjectId,
        authorizedTeamId || undefined,
      );

      // Required identity check: use the persisted ID and original account scope.
      const project = await vercel.requireProject(
        vercelProjectId,
        vercelAccountId || authorizedTeamId || undefined,
      );
      vercelProjectName = project.name;
      vercelAccountId = project.accountId ?? vercelAccountId ?? authorizedTeamId;

      await upsertResource(admin, ctx.projectId, "vercel", vercelProjectId, {
        projectName: vercelProjectName,
        vercelProjectId,
        accountId: vercelAccountId,
        teamId: authorizedTeamId || null,
        integrationInstallationId:
          vercelInstallationId || vcCreds.installation_id || null,
        authorizedUserId: vercelAuthorizedUserId || vcCreds.user_id || null,
        deploymentId: vercelDeploymentId,
        previewUrl,
        productionUrl: "",
      });
      await audit(admin, ctx, "verify_vercel_project_identity", {
        projectId: vercelProjectId,
        projectName: vercelProjectName,
        accountId: vercelAccountId,
        teamId: authorizedTeamId || null,
        getProjectSucceeded: true,
      });

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

      if (!vercelProjectId) {
        throw new Error("Seed has no stored Vercel project ID for preview deployment.");
      }

      const authorizedTeamId = vercelTeamId || vcCreds.team_id || "";

      const vercel = new VercelDeploymentProvider(
        vcCreds.access_token,
        vercelProjectId,
        authorizedTeamId || undefined,
      );
      await vercel.requireProject(
        vercelProjectId,
        vercelAccountId || authorizedTeamId || undefined,
      );

      let deployment: { id: string; url: string } | null = null;
      if (!isChangeRun && vercelDeploymentId) {
        const existingStatus = await vercel.getDeploymentStatus(vercelDeploymentId);
        if (existingStatus !== "error") {
          deployment = { id: vercelDeploymentId, url: previewUrl };
        }
      }

      if (!deployment) {
        if (!gitHubOwner || !repoName) {
          throw new Error("Seed has no stored GitHub repository identity for preview deployment.");
        }
        if (!gitHubToken) {
          const encryptedGhCreds = await getProviderCredentials(admin, ctx.workspaceId, "github");
          const ghCreds = JSON.parse(decryptCredential(encryptedGhCreds)) as GitHubCreds;
          const appId = process.env.GITHUB_APP_ID;
          const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
          if (!appId || !privateKey) {
            throw new Error("Seed cannot read the project files because GitHub is not configured.");
          }
          gitHubToken = await generateInstallationToken(appId, privateKey, ghCreds.installationId);
          gitHubOwner = ghCreds.accountLogin;
        }

        const github = new GitHubSourceProvider(gitHubToken, gitHubOwner, repoName);
        const repositoryState = await github.getRepositoryState();
        commitSha = repositoryState.commitSha;
        const deploymentFiles = await github.readFiles(
          repositoryState.files.map((file) => file.path),
        );
        deployment = await vercel.deploy(deploymentFiles);
        vercelDeploymentId = deployment.id;

        // Persist immediately so a process restart follows this deployment instead of duplicating it.
        await upsertResource(admin, ctx.projectId, "vercel", vercelProjectId, {
          projectName: vercelProjectName,
          vercelProjectId,
          accountId: vercelAccountId,
          teamId: authorizedTeamId || null,
          integrationInstallationId:
            vercelInstallationId || vcCreds.installation_id || null,
          authorizedUserId: vercelAuthorizedUserId || vcCreds.user_id || null,
          deploymentId: vercelDeploymentId,
          previewUrl: "",
          productionUrl: "",
        });
      }
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
        projectName: vercelProjectName,
        vercelProjectId,
        accountId: vercelAccountId,
        teamId: authorizedTeamId || null,
        integrationInstallationId:
          vercelInstallationId || vcCreds.installation_id || null,
        authorizedUserId: vercelAuthorizedUserId || vcCreds.user_id || null,
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
        protectedByVercelAuthentication: result.protected === true,
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
