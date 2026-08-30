import "server-only";

import type { ProviderName } from "@/lib/providers/contracts";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export type ProjectStatus = "draft" | "ready" | "building" | "live" | "needs_attention";

export type DashboardProject = {
  id: string;
  name: string;
  slug: string;
  projectType: string;
  status: ProjectStatus;
  updatedAt: string;
  websiteUrl: string | null;
};

export type DashboardRun = {
  id: string;
  request: string;
  status: string;
  createdAt: string;
};

export type DashboardContext = {
  username: string | null;
  workspaceId: string;
  workspaceName: string;
  projectId: string;
  projectName: string;
  projectType: string;
  projectStatus: ProjectStatus;
  websiteUrl: string | null;
  projects: DashboardProject[];
  recentRuns: DashboardRun[];
  connections: Partial<
    Record<ProviderName, "Connected" | "Connecting" | "Needs attention">
  >;
  counts: {
    bookings: number;
    customers: number;
    media: number;
  };
  demo: boolean;
};

type ResourceRow = {
  project_id: string;
  provider: string;
  external_id: string;
  metadata_json: Record<string, unknown> | null;
};

function websiteUrlFor(projectId: string, resources: ResourceRow[]) {
  const resource = resources.find(
    (row) => row.project_id === projectId && row.provider === "vercel",
  );
  if (!resource) return null;

  const metadata = resource.metadata_json ?? {};
  const candidate =
    metadata.productionUrl ?? metadata.production_url ?? metadata.url ?? resource.external_id;
  if (typeof candidate !== "string" || !candidate) return null;
  return candidate.startsWith("http") ? candidate : `https://${candidate}`;
}

const emptyCounts = { bookings: 0, customers: 0, media: 0 };

export async function getDashboardContext(
  selectedProjectId?: string,
): Promise<DashboardContext> {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) {
    throw new Error("Seed's production database is not configured.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  let { data: profile } = await supabase
    .from("profiles")
    .select("id,username")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile) {
    const { getSeedProfile } = await import("@/lib/supabase/server");
    const ensured = await getSeedProfile();
    if (!ensured) throw new Error("Seed profile not found.");
    profile = { id: ensured.id, username: ensured.username };
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id,name")
    .eq("owner_user_id", profile.id)
    .order("created_at")
    .limit(1)
    .single();
  if (!workspace) throw new Error("Seed workspace not found.");

  const [{ data: projectRows }, { data: connectionRows }] = await Promise.all([
    supabase
      .from("projects")
      .select("id,name,slug,project_type,status,updated_at")
      .eq("workspace_id", workspace.id)
      .order("updated_at", { ascending: false }),
    admin
      .from("provider_connections")
      .select("provider,status,encrypted_access_data")
      .eq("workspace_id", workspace.id),
  ]);

  const rows = projectRows ?? [];
  const selected =
    rows.find((project) => project.id === selectedProjectId) ?? rows[0] ?? null;
  const projectIds = rows.map((project) => project.id);

  const [{ data: resourceRows }, { data: runRows }] = await Promise.all([
    projectIds.length
      ? supabase
          .from("project_resources")
          .select("project_id,provider,external_id,metadata_json")
          .in("project_id", projectIds)
      : Promise.resolve({ data: [] as ResourceRow[] }),
    selected
      ? supabase
          .from("seed_runs")
          .select("id,user_request,status,created_at")
          .eq("project_id", selected.id)
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
  ]);

  const resources = (resourceRows ?? []) as ResourceRow[];
  const projects: DashboardProject[] = rows.map((project) => ({
    id: project.id,
    name: project.name,
    slug: project.slug,
    projectType: project.project_type,
    status: project.status,
    updatedAt: project.updated_at,
    websiteUrl: websiteUrlFor(project.id, resources),
  }));

  const connections: DashboardContext["connections"] = {};
  const { verifyStoredConnection } = await import("@/lib/connections/verification");

  for (const row of connectionRows ?? []) {
    if (row.encrypted_access_data) {
      const verification = await verifyStoredConnection(
        row.provider as ProviderName,
        row.encrypted_access_data,
      );
      if (verification.valid) {
        connections[row.provider as ProviderName] = "Connected";

        // Persist connected status if it was previously needs_attention or not_connected
        const updates: Record<string, unknown> = {};
        if (row.status !== "connected") {
          updates.status = "connected";
          updates.connected_at = new Date().toISOString();
        }

        // If it was refreshed, update stored credential
        if (verification.metadata?.refreshed && verification.metadata.newTokens) {
          const { encryptCredential } = await import("@/lib/security/crypto");
          updates.encrypted_access_data = encryptCredential(
            JSON.stringify(verification.metadata.newTokens),
          );
        }

        if (Object.keys(updates).length > 0) {
          updates.updated_at = new Date().toISOString();
          await admin
            .from("provider_connections")
            .update(updates)
            .eq("workspace_id", workspace.id)
            .eq("provider", row.provider);
        }
      } else {
        connections[row.provider as ProviderName] = "Needs attention";
        if (row.status !== "needs_attention") {
          await admin
            .from("provider_connections")
            .update({ status: "needs_attention", updated_at: new Date().toISOString() })
            .eq("workspace_id", workspace.id)
            .eq("provider", row.provider);
        }
      }
    } else {
      connections[row.provider as ProviderName] =
        row.status === "needs_attention" ? "Needs attention" : "Connecting";
    }
  }

  return {
    username: profile.username as string | null,
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    projectId: selected?.id ?? "",
    projectName: selected?.name ?? "",
    projectType: selected?.project_type ?? "business_website",
    projectStatus: selected?.status ?? "draft",
    websiteUrl: selected ? websiteUrlFor(selected.id, resources) : null,
    projects,
    recentRuns: (runRows ?? []).map((run) => ({
      id: run.id,
      request: run.user_request,
      status: run.status,
      createdAt: run.created_at,
    })),
    connections,
    counts: emptyCounts,
    demo: false,
  };
}
