"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, getCurrentProfile } from "@/lib/supabase/server";

export async function updateInquiryWorkflow(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/login");

  const id = formData.get("id")?.toString();
  const status = formData.get("status")?.toString() as "new" | "contacted" | "closed";
  const admin_notes = formData.get("admin_notes")?.toString().trim() || null;

  if (!id || !status) {
    redirect("/admin/inquiries?error=invalid_status");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/inquiries?error=auth");

  const { error } = await supabase
    .from("inquiries")
    .update({
      status,
      admin_notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to update inquiry status:", error);
    redirect("/admin/inquiries?error=update_failed");
  }

  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
  revalidatePath("/profile");
  redirect(`/admin/inquiries?id=${id}&saved=updated`);
}

export async function deleteInquiry(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/login");

  const id = formData.get("id")?.toString();
  if (!id) redirect("/admin/inquiries");

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/inquiries?error=auth");

  const { error } = await supabase.from("inquiries").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete inquiry:", error);
    redirect("/admin/inquiries?error=delete_failed");
  }

  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
  redirect("/admin/inquiries?saved=deleted");
}
