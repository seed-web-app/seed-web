"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, getCurrentProfile } from "@/lib/supabase/server";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/categories?error=auth");
  return supabase;
}

export async function createCategory(formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  const shortDescription = formData.get("short_description")?.toString().trim() || null;
  if (!name) redirect("/admin/categories?error=missing_name");

  const supabase = await requireAdmin();
  const { error } = await supabase.from("part_categories").insert({ name, short_description: shortDescription });
  if (error) redirect(`/admin/categories?error=${error.code === "23505" ? "duplicate" : "create_failed"}`);

  revalidatePath("/admin/categories");
  revalidatePath("/admin/parts");
  redirect("/admin/categories?saved=created");
}

export async function updateCategory(formData: FormData) {
  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString().trim();
  const shortDescription = formData.get("short_description")?.toString().trim() || null;
  const isActive = formData.get("is_active") === "on";
  if (!id || !name) redirect("/admin/categories?error=missing_name");

  const supabase = await requireAdmin();
  const { error } = await supabase.from("part_categories").update({ name, short_description: shortDescription, is_active: isActive, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect(`/admin/categories?error=${error.code === "23505" ? "duplicate" : "update_failed"}`);

  revalidatePath("/admin/categories");
  revalidatePath("/admin/parts");
  redirect("/admin/categories?saved=updated");
}
