import { NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { decryptCredential } from "@/lib/security/crypto";
import { VercelDeploymentProvider } from "@/lib/providers/vercel";
import { seedLog } from "@/lib/logger";

const publishSchema = z.object({
  runId: z.string().uuid(),
  projectId: z.string().uuid(),
});

interface VercelCreds {
  access_token: string;
  team_id?: string | null;
}

export async function POST(request: Request) {
  const parsed = publishSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid publish request." }, { status: 400 });
  }

  const { runId, projectId } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) {
    return NextResponse.json({ message: "Database not configured." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Sign in again to continue." }, { status: 401 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!profile) {
    return NextResponse.json({ message: "Profile not found." }, { status: 409 });
  }

  const { data: project } = await admin
    .from("projects")
    .select("id,name,slug,workspace_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) {
    return NextResponse.json({ message: "Project not found." }, { status: 404 });
  }

  // Ownership check
  const { data: workspace } = await admin
    .from("workspaces")
    .select("id")
    .eq("id", project.workspace_id)
    .eq("owner_user_id", profile.id)
    .maybeSingle();
  if (!workspace) {
    return NextResponse.json({ message: "Access denied." }, { status: 403 });
  }

  // Verify run is in waiting_for_user (preview verified, awaiting publish)
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
      { message: `Publish requires preview to be ready. Current status: ${run.status}.` },
      { status: 409 },
    );
  }

  // Fetch Vercel resource
  const { data: resources } = await admin
    .from("project_resources")
    .select("external_id,metadata_json")
    .eq("project_id", projectId)
    .eq("provider", "vercel")
    .maybeSingle();

  const meta = (resources?.metadata_json ?? {}) as Record<string, unknown>;
  const deploymentId = meta.deploymentId as string | undefined;
  const vercelProjectId = (meta.vercelProjectId as string) || resources?.external_id;
  const projectName = (meta.projectName as string) || project.slug;
  const storedTeamId = (meta.teamId as string) || undefined;
  const accountId = (meta.accountId as string) || storedTeamId;

  if (!deploymentId || !vercelProjectId) {
    return NextResponse.json(
      { message: "No preview deployment found. Run a preview build first." },
      { status: 409 },
    );
  }

  // Get Vercel credentials
  const { data: vcConn } = await admin
    .from("provider_connections")
    .select("encrypted_access_data")
    .eq("workspace_id", project.workspace_id)
    .eq("provider", "vercel")
    .eq("status", "connected")
    .maybeSingle();

  if (!vcConn) {
    return NextResponse.json({ message: "Vercel is not connected." }, { status: 409 });
  }

  let vcCreds: VercelCreds;
  try {
    vcCreds = JSON.parse(decryptCredential(vcConn.encrypted_access_data)) as VercelCreds;
  } catch {
    return NextResponse.json(
      { message: "Vercel credentials are corrupted. Please reconnect." },
      { status: 409 },
    );
  }

  // Mark run as running for publish phase
  await admin
    .from("seed_runs")
    .update({ status: "running" })
    .eq("id", runId);

  await admin.from("audit_events").insert({
    actor_user_id: profile.id,
    workspace_id: project.workspace_id,
    project_id: projectId,
    seed_run_id: runId,
    tool_name: "publish_production",
    metadata: { deploymentId },
  });

  seedLog("info", "seed_publish_approved", { runId, projectId, deploymentId });

  // Run promotion in background
  after(async () => {
    try {
      const vercel = new VercelDeploymentProvider(
        vcCreds.access_token,
        vercelProjectId,
        storedTeamId ?? vcCreds.team_id ?? undefined,
      );

      await vercel.requireProject(vercelProjectId, accountId);

      await vercel.promoteToProduction(deploymentId);

      // Wait for production deployment to be ready
      const result = await vercel.waitForDeployment(deploymentId, 30, 10_000);

      const productionUrl = result.url ?? `https://${projectName}.vercel.app`;

      // Update project_resources with production URL
      await admin
        .from("project_resources")
        .update({
          metadata_json: {
            ...meta,
            productionUrl,
            publishedAt: new Date().toISOString(),
          },
          last_synced_at: new Date().toISOString(),
        })
        .eq("project_id", projectId)
        .eq("provider", "vercel");

      // Set project status to live
      await admin
        .from("projects")
        .update({ status: "live", updated_at: new Date().toISOString() })
        .eq("id", projectId);

      // Mark run as completed
      await admin
        .from("seed_runs")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", runId);

      await admin.from("audit_events").insert({
        actor_user_id: profile.id,
        workspace_id: project.workspace_id,
        project_id: projectId,
        seed_run_id: runId,
        tool_name: "production_published",
        metadata: { productionUrl },
      });

      seedLog("info", "seed_production_published", { runId, projectId, productionUrl });
    } catch (err) {
      seedLog("error", "seed_publish_failed", {
        runId,
        error: err instanceof Error ? err.message : String(err),
      });
      await admin
        .from("seed_runs")
        .update({ status: "failed", completed_at: new Date().toISOString() })
        .eq("id", runId);
    }
  });

  return NextResponse.json({
    status: "publishing",
    runId,
    message: "Publishing to production. This takes a moment.",
  });
}
