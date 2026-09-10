"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, getCurrentProfile } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const full_name = formData.get("full_name")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim() || null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/profile?error=auth");

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: full_name || profile.full_name,
      phone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  if (error) {
    console.error("Failed to update profile:", error);
    redirect("/profile?error=update_failed");
  }

  revalidatePath("/profile");
  redirect("/profile?saved=profile");
}

export async function addVehicle(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const model = formData.get("model")?.toString().trim();
  const yearStr = formData.get("year")?.toString().trim();
  const registration_no = formData.get("registration_no")?.toString().trim() || null;

  if (!model || !yearStr) {
    redirect("/profile?error=missing_vehicle_fields");
  }

  const year = parseInt(yearStr, 10);
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/profile?error=auth");

  const { error } = await supabase.from("vehicles").insert({
    owner_id: profile.id,
    make: "Suzuki",
    model,
    year,
    registration_no,
  });

  if (error) {
    console.error("Failed to add vehicle:", error);
    redirect("/profile?error=vehicle_add_failed");
  }

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  redirect("/profile?saved=vehicle_added");
}

export async function deleteVehicle(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const vehicleId = formData.get("vehicle_id")?.toString();
  if (!vehicleId) redirect("/profile");

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/profile?error=auth");

  const { error } = await supabase
    .from("vehicles")
    .delete()
    .eq("id", vehicleId)
    .eq("owner_id", profile.id);

  if (error) {
    console.error("Failed to delete vehicle:", error);
    redirect("/profile?error=vehicle_delete_failed");
  }

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  redirect("/profile?saved=vehicle_deleted");
}
