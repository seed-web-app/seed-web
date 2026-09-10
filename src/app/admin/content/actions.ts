"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, getCurrentProfile } from "@/lib/supabase/server";

export async function createContentPost(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/login");

  const title = formData.get("title")?.toString().trim();
  const video_url = formData.get("video_url")?.toString().trim();
  const caption = formData.get("caption")?.toString().trim() || null;
  const published_at =
    formData.get("published_at")?.toString() || new Date().toISOString();

  if (!title || !video_url) {
    redirect("/admin/content?error=missing_fields");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/content?error=auth");

  const { error } = await supabase.from("content_posts").insert({
    title,
    video_url,
    caption,
    published_at: new Date(published_at).toISOString(),
    created_by: profile.id,
  });

  if (error) {
    console.error("Failed to create content post:", error);
    redirect("/admin/content?error=insert_failed");
  }

  revalidatePath("/admin/content");
  revalidatePath("/content");
  redirect("/admin/content?saved=created");
}

export async function updateContentPost(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/login");

  const id = formData.get("id")?.toString();
  const title = formData.get("title")?.toString().trim();
  const video_url = formData.get("video_url")?.toString().trim();
  const caption = formData.get("caption")?.toString().trim() || null;
  const published_at = formData.get("published_at")?.toString();

  if (!id || !title || !video_url) {
    redirect("/admin/content?error=missing_fields");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/content?error=auth");

  const { error } = await supabase
    .from("content_posts")
    .update({
      title,
      video_url,
      caption,
      ...(published_at ? { published_at: new Date(published_at).toISOString() } : {}),
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to update content post:", error);
    redirect("/admin/content?error=update_failed");
  }

  revalidatePath("/admin/content");
  revalidatePath("/content");
  redirect("/admin/content?saved=updated");
}

export async function deleteContentPost(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/login");

  const id = formData.get("id")?.toString();
  if (!id) redirect("/admin/content");

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/content?error=auth");

  const { error } = await supabase.from("content_posts").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete content post:", error);
    redirect("/admin/content?error=delete_failed");
  }

  revalidatePath("/admin/content");
  revalidatePath("/content");
  redirect("/admin/content?saved=deleted");
}
