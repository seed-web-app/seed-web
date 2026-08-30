import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const projectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  projectType: z.enum(["business_website", "lead_website", "booking_website"]),
  features: z.array(z.string().max(80)).max(10),
});

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || `project-${randomUUID().slice(0, 8)}`
  );
}

export async function POST(request: Request) {
  const parsed = projectSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Please complete the project details." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { message: "Seed's database is not configured." },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Sign in again to continue." }, { status: 401 });
  }

  const { getSeedProfile } = await import("@/lib/supabase/server");
  const profile = await getSeedProfile();
  if (!profile) {
    return NextResponse.json(
      { message: "Your Seed profile is still being prepared." },
      { status: 409 },
    );
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", profile.id)
    .limit(1)
    .single();
  if (!workspace) {
    return NextResponse.json(
      { message: "Create a workspace before adding a project." },
      { status: 409 },
    );
  }

  const baseSlug = slugify(parsed.data.name);
  const { data: matchingProjects } = await supabase
    .from("projects")
    .select("slug")
    .eq("workspace_id", workspace.id)
    .like("slug", `${baseSlug}%`);
  const usedSlugs = new Set((matchingProjects ?? []).map((project) => project.slug));
  let slug = baseSlug;
  let suffix = 2;
  while (usedSlugs.has(slug)) {
    slug = `${baseSlug.slice(0, 54)}-${suffix}`;
    suffix += 1;
  }

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      workspace_id: workspace.id,
      name: parsed.data.name,
      slug,
      project_type: parsed.data.projectType,
      status: "draft",
    })
    .select("id,name,slug")
    .single();
  if (error) {
    return NextResponse.json(
      {
        message:
          error.code === "23505"
            ? "A project with that name already exists. Try another name."
            : "Seed could not create that project yet.",
      },
      { status: error.code === "23505" ? 409 : 500 },
    );
  }

  await supabase.from("audit_events").insert({
    actor_user_id: profile.id,
    workspace_id: workspace.id,
    project_id: project.id,
    tool_name: "create_project",
    metadata: {
      projectType: parsed.data.projectType,
      requestedFeatures: parsed.data.features,
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
