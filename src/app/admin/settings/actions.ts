"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, getCurrentProfile } from "@/lib/supabase/server";

export async function updateDealerSettings(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/login");

  const dealer_name = formData.get("dealer_name")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim();
  const whatsapp = formData.get("whatsapp")?.toString().trim();
  const address = formData.get("address")?.toString().trim();
  const notification_email = formData.get("notification_email")?.toString().trim();
  const operating_hours = formData.get("operating_hours")?.toString().trim();

  if (!dealer_name || !phone || !whatsapp) {
    redirect("/admin/settings?error=missing_fields");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/settings?error=auth");

  const { error } = await supabase
    .from("dealer_settings")
    .upsert({
      id: "default",
      dealer_name,
      phone,
      whatsapp,
      address,
      notification_email,
      operating_hours,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Failed to update dealer settings:", error);
    redirect("/admin/settings?error=update_failed");
  }

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=true");
}
