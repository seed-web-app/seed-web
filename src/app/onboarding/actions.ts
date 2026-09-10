"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, getCurrentProfile } from "@/lib/supabase/server";

export async function completeOnboarding(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const model = formData.get("model")?.toString().trim();
  const yearStr = formData.get("year")?.toString().trim();
  const registrationNo = formData.get("registration_no")?.toString().trim() || null;
  const phone = formData.get("phone")?.toString().trim() || null;

  if (!model || !yearStr) {
    redirect("/onboarding?error=missing_fields");
  }

  const year = parseInt(yearStr, 10);
  if (isNaN(year) || year < 1980 || year > new Date().getFullYear() + 1) {
    redirect("/onboarding?error=invalid_year");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/login?error=auth");
  }

  // 1. Update phone on profile if provided
  if (phone) {
    await supabase
      .from("profiles")
      .update({ phone, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
  }

  // 2. Insert first vehicle
  const { error: vehicleError } = await supabase.from("vehicles").insert({
    owner_id: profile.id,
    make: "Suzuki",
    model,
    year,
    registration_no: registrationNo,
  });

  if (vehicleError) {
    console.error("Failed to add onboarding vehicle:", vehicleError);
    redirect("/onboarding?error=failed_vehicle");
  }

  revalidatePath("/", "layout");
  redirect("/home");
}
