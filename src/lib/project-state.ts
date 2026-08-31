import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { decryptCredential } from "@/lib/security/crypto";

export interface ResolvedProjectState {
  projectId: string;
  projectName: string;
  projectSlug: string;
  workspaceId: string;
  status: "draft" | "ready" | "building" | "live" | "needs_attention";
  previewUrl: string | null;
  productionUrl: string | null;
  effectiveUrl: string | null;
  lastPublishedAt: string | null;
  latestCommitSha: string | null;
  github: {
    connected: boolean;
    repoName?: string;
    repoUrl?: string;
    owner?: string;
  };
  supabase: {
    connected: boolean;
    projectRef?: string;
    supabaseUrl?: string;
    publishableKey?: string;
  };
  vercel: {
    connected: boolean;
    vercelProjectId?: string;
    deploymentId?: string;
  };
  openai: {
    connected: boolean;
  };
  latestRun: {
    id: string;
    status: string;
    request: string;
    createdAt: string;
    completedAt: string | null;
  } | null;
  counts: {
    bookings: number;
    customers: number;
    media: number;
  };
}

/**
 * Single source of truth for project state.
 * Reconciles provider_connections, project_resources, seed_runs, and client databases.
 */
export async function resolveProjectState(
  projectId: string,
  workspaceId: string,
): Promise<ResolvedProjectState | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  // 1. Fetch project info
  const { data: project } = await admin
    .from("projects")
    .select("id,name,slug,status,updated_at,workspace_id")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) return null;

  // 2. Fetch connections, resources, and latest runs in parallel
  const [{ data: connections }, { data: resources }, { data: runs }] = await Promise.all([
    admin.from("provider_connections").select("provider,status,encrypted_access_data").eq("workspace_id", workspaceId),
    admin.from("project_resources").select("provider,external_id,metadata_json").eq("project_id", projectId),
    admin.from("seed_runs").select("id,user_request,status,created_at,completed_at").eq("project_id", projectId).order("created_at", { ascending: false }).limit(5),
  ]);

  const connMap = new Map((connections ?? []).map((c) => [c.provider, c.status]));
  const resMap = new Map((resources ?? []).map((r) => [r.provider, r]));

  // Extract resources
  const ghRes = resMap.get("github");
  const sbRes = resMap.get("supabase");
  const vcRes = resMap.get("vercel");

  const ghMeta = (ghRes?.metadata_json ?? {}) as Record<string, unknown>;
  const sbMeta = (sbRes?.metadata_json ?? {}) as Record<string, unknown>;
  const vcMeta = (vcRes?.metadata_json ?? {}) as Record<string, unknown>;

  const previewUrl = (vcMeta.previewUrl as string) || (vcMeta.preview_url as string) || null;
  const productionUrl = (vcMeta.productionUrl as string) || (vcMeta.production_url as string) || null;
  const effectiveUrl = productionUrl || previewUrl;
  const lastPublishedAt = (vcMeta.publishedAt as string) || (vcMeta.published_at as string) || null;
  const latestCommitSha = (ghMeta.commitSha as string) || (ghMeta.commit_sha as string) || null;

  // Reconcile status:
  // If production is published -> live
  // If preview is ready -> building (or ready for review)
  // Else fallback to project.status
  let status: ResolvedProjectState["status"] = project.status as ResolvedProjectState["status"];
  if (productionUrl) {
    status = "live";
  } else if (previewUrl) {
    status = "building";
  }

  // Count live records from user's Supabase project if available
  const counts = { bookings: 0, customers: 0, media: 0 };
  if (sbMeta.projectRef && connMap.get("supabase") === "connected") {
    try {
      const sbConn = connections?.find((c) => c.provider === "supabase");
      if (sbConn?.encrypted_access_data) {
        const creds = JSON.parse(decryptCredential(sbConn.encrypted_access_data)) as { access_token: string };
        const projectRef = sbMeta.projectRef as string;

        const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${creds.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `
              select 
                (select count(*) from public.bookings) as bookings,
                (select count(*) from public.customers) as customers;
            `,
          }),
        });

        if (res.ok) {
          const rows = (await res.json()) as Array<{ bookings: number; customers: number }>;
          if (rows?.[0]) {
            counts.bookings = Number(rows[0].bookings) || 0;
            counts.customers = Number(rows[0].customers) || 0;
          }
        }
      }
    } catch {
      // Non-fatal if client database query fails
    }
  }

  const latestRun = runs?.[0]
    ? {
        id: runs[0].id,
        status: runs[0].status,
        request: runs[0].user_request,
        createdAt: runs[0].created_at,
        completedAt: runs[0].completed_at,
      }
    : null;

  return {
    projectId: project.id,
    projectName: project.name,
    projectSlug: project.slug,
    workspaceId: project.workspace_id,
    status,
    previewUrl,
    productionUrl,
    effectiveUrl,
    lastPublishedAt,
    latestCommitSha,
    github: {
      connected: connMap.get("github") === "connected",
      repoName: ghMeta.repoName as string | undefined,
      repoUrl: ghMeta.repoUrl as string | undefined,
      owner: ghMeta.owner as string | undefined,
    },
    supabase: {
      connected: connMap.get("supabase") === "connected",
      projectRef: sbMeta.projectRef as string | undefined,
      supabaseUrl: sbMeta.supabaseUrl as string | undefined,
      publishableKey: sbMeta.publishableKey as string | undefined,
    },
    vercel: {
      connected: connMap.get("vercel") === "connected",
      vercelProjectId: (vcMeta.vercelProjectId as string) || vcRes?.external_id,
      deploymentId: vcMeta.deploymentId as string | undefined,
    },
    openai: {
      connected: connMap.get("openai") === "connected",
    },
    latestRun,
    counts,
  };
}
