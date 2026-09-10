"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, getCurrentProfile } from "@/lib/supabase/server";

export async function submitPartInquiry(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const partId = formData.get("part_id")?.toString();
  const vehicleId = formData.get("vehicle_id")?.toString() || null;
  const message = formData.get("message")?.toString().trim() || null;

  if (!partId) {
    redirect("/home");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect(`/parts/${partId}?error=auth`);
  }

  const { error } = await supabase.from("inquiries").insert({
    customer_id: profile.id,
    part_id: partId,
    vehicle_id: vehicleId && vehicleId !== "none" ? vehicleId : null,
    message,
    status: "new",
  });

  if (error) {
    console.error("Failed to submit inquiry:", error);
    redirect(`/parts/${partId}?error=failed`);
  }

  revalidatePath(`/parts/${partId}`);
  revalidatePath("/profile");
  redirect(`/parts/${partId}?requested=true`);
}
