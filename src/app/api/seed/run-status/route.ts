import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId");
  const projectId = searchParams.get("projectId");

  if (!runId || !projectId) {
    return NextResponse.json({ message: "runId and projectId are required." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) {
    return NextResponse.json({ message: "Database not configured." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  // RLS: user must own the project
  const { data: project } = await supabase
    .from("projects")
    .select("id,workspace_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) {
    return NextResponse.json({ message: "Project not found or access denied." }, { status: 404 });
  }

  // Fetch run (admin — seed_runs has RLS through project ownership)
  const { data: run } = await admin
    .from("seed_runs")
    .select("id,status,created_at,completed_at")
    .eq("id", runId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (!run) {
    return NextResponse.json({ message: "Run not found." }, { status: 404 });
  }

  // Fetch steps
  const { data: steps } = await admin
    .from("seed_run_steps")
    .select("step_type,status,output_summary,error_message,started_at,completed_at")
    .eq("seed_run_id", runId)
    .order("started_at", { ascending: true, nullsFirst: true });

  // Fetch preview URL from project_resources (vercel entry)
  const { data: resources } = await admin
    .from("project_resources")
    .select("provider,external_id,metadata_json")
    .eq("project_id", projectId)
    .eq("provider", "vercel");

  const vercelResource = (resources ?? [])[0];
  const meta = (vercelResource?.metadata_json ?? {}) as Record<string, unknown>;
  const previewUrl = (meta.previewUrl as string) || null;
  const productionUrl = (meta.productionUrl as string) || null;

  return NextResponse.json({
    run: {
      id: run.id,
      status: run.status,
      createdAt: run.created_at,
      completedAt: run.completed_at,
    },
    steps: (steps ?? []).map((s) => ({
      stepType: s.step_type,
      status: s.status,
      outputSummary: s.output_summary,
      errorMessage: s.error_message,
      startedAt: s.started_at,
      completedAt: s.completed_at,
    })),
    previewUrl,
    productionUrl,
  });
}
