import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { resolveProjectState } from "@/lib/project-state";

export interface ProjectMemory {
  projectId: string;
  workspaceId: string;
  businessName: string;
  businessType: string;
  summary: string;
  stylePreferences: string;
  pages: string[];
  userDecisions: string[];
  latestState: Record<string, unknown>;
  updatedAt: string;
}

/**
 * Loads project memory, creating a default one initialized from project info if not present.
 */
export async function getProjectMemory(projectId: string, workspaceId: string): Promise<ProjectMemory> {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Database unconfigured");

  const { data: existing } = await admin
    .from("project_memory")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (existing) {
    return {
      projectId: existing.project_id,
      workspaceId: existing.workspace_id,
      businessName: existing.business_name ?? "",
      businessType: existing.business_type ?? "",
      summary: existing.summary ?? "",
      stylePreferences: existing.style_preferences ?? "",
      pages: Array.isArray(existing.pages) ? existing.pages : [],
      userDecisions: Array.isArray(existing.user_decisions) ? existing.user_decisions : [],
      latestState: (existing.latest_state as Record<string, unknown>) ?? {},
      updatedAt: existing.updated_at,
    };
  }

  // If not existing, infer from project state
  const state = await resolveProjectState(projectId, workspaceId);
  const initialMemory: ProjectMemory = {
    projectId,
    workspaceId,
    businessName: state?.projectName ?? "My Project",
    businessType: "Business / Service Website",
    summary: `${state?.projectName ?? "Project"} website built with Seed.`,
    stylePreferences: "Clean, modern, beginner-friendly",
    pages: ["Home", "About", "Projects", "Services", "Contact"],
    userDecisions: ["Simple contact form", "No online payments"],
    latestState: {
      previewUrl: state?.previewUrl,
      productionUrl: state?.productionUrl,
      repoUrl: state?.github.repoUrl,
    },
    updatedAt: new Date().toISOString(),
  };

  await admin.from("project_memory").insert({
    project_id: projectId,
    workspace_id: workspaceId,
    business_name: initialMemory.businessName,
    business_type: initialMemory.businessType,
    summary: initialMemory.summary,
    style_preferences: initialMemory.stylePreferences,
    pages: initialMemory.pages,
    user_decisions: initialMemory.userDecisions,
    latest_state: initialMemory.latestState,
  });

  return initialMemory;
}

/**
 * Updates memory when the user makes a new decision or approves changes.
 */
export async function updateProjectMemory(
  projectId: string,
  updates: Partial<Omit<ProjectMemory, "projectId" | "workspaceId" | "updatedAt">>,
): Promise<void> {
  const admin = createSupabaseAdminClient();
  if (!admin) return;

  await admin
    .from("project_memory")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("project_id", projectId);
}
