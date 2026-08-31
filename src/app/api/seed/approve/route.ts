import { NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { executeSeedRun, EXECUTOR_STEPS, CHANGE_STEPS } from "@/lib/engine/executor";
import type { ExecutorContext } from "@/lib/engine/executor";
import { seedLog } from "@/lib/logger";

const approveSchema = z.object({
  runId: z.string().uuid(),
  projectId: z.string().uuid(),
});

export async function POST(request: Request) {
  const parsed = approveSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid approval request." }, { status: 400 });
  }

  const { runId, projectId } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) {
    return NextResponse.json(
      { message: "Seed's database is not configured." },
      { status: 503 },
    );
  }

  // Authenticate
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Sign in again to continue." }, { status: 401 });
  }

  // Resolve profile
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!profile) {
    return NextResponse.json({ message: "Seed profile not found." }, { status: 409 });
  }

  // Verify the user owns the project and get workspace + project metadata
  const { data: project } = await admin
    .from("projects")
    .select("id,name,slug,workspace_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) {
    return NextResponse.json({ message: "Project not found." }, { status: 404 });
  }

  const { data: workspace } = await admin
    .from("workspaces")
    .select("id")
    .eq("id", project.workspace_id)
    .eq("owner_user_id", profile.id)
    .maybeSingle();
  if (!workspace) {
    return NextResponse.json({ message: "Access denied." }, { status: 403 });
  }

  // Verify the run belongs to this project and is in waiting_for_user state
  const { data: run } = await admin
    .from("seed_runs")
    .select("id,status")
    .eq("id", runId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (!run) {
    return NextResponse.json({ message: "Run not found." }, { status: 404 });
  }
  if (run.status !== "waiting_for_user") {
    return NextResponse.json(
      {
        message:
          run.status === "running"
            ? "This run is already executing."
            : `Run cannot be approved in status: ${run.status}.`,
      },
      { status: 409 },
    );
  }

  // Mark run as running
  const { error: updateError } = await admin
    .from("seed_runs")
    .update({ status: "running" })
    .eq("id", runId);
  if (updateError) {
    return NextResponse.json({ message: "Could not start the run." }, { status: 500 });
  }

  // Ensure step records exist for all executor steps (idempotent insert)
  const { data: runData } = await admin
    .from("seed_runs")
    .select("run_type")
    .eq("id", runId)
    .single();
  const isChangeRun = runData?.run_type === "change";
  const targetSteps = isChangeRun ? CHANGE_STEPS : EXECUTOR_STEPS;

  const { data: existingSteps } = await admin
    .from("seed_run_steps")
    .select("step_type")
    .eq("seed_run_id", runId);
  const existingStepTypes = new Set((existingSteps ?? []).map((s) => s.step_type));
  const missingSteps = targetSteps.filter((s) => !existingStepTypes.has(s));
  if (missingSteps.length) {
    await admin.from("seed_run_steps").insert(
      missingSteps.map((step_type) => ({
        seed_run_id: runId,
        step_type,
        status: "pending",
      })),
    );
  }

  // Audit
  await admin.from("audit_events").insert({
    actor_user_id: profile.id,
    workspace_id: project.workspace_id,
    project_id: projectId,
    seed_run_id: runId,
    tool_name: "approve_seed_run",
    metadata: { runId },
  });

  const ctx: ExecutorContext = {
    runId,
    projectId,
    workspaceId: project.workspace_id,
    profileId: profile.id,
    projectName: project.name,
    projectSlug: project.slug,
  };

  seedLog("info", "seed_run_approved", { runId, projectId });

  // Schedule background execution — response returns immediately.
  // next/server after() keeps the lambda alive on Vercel via waitUntil.
  after(async () => {
    try {
      await executeSeedRun(ctx);
    } catch (err) {
      seedLog("error", "seed_executor_unhandled", {
        runId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  return NextResponse.json({
    status: "running",
    runId,
    message:
      "Seed is creating your preview. Check progress below — this takes a few minutes.",
    steps: EXECUTOR_STEPS,
  });
}
