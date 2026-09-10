"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, getCurrentProfile } from "@/lib/supabase/server";
import { addGuestInquiryRecord } from "@/lib/inquiries";

export async function submitPartInquiry(formData: FormData) {
  const profile = await getCurrentProfile();
  const partId = formData.get("part_id")?.toString();
  const vehicleId = formData.get("vehicle_id")?.toString() || null;
  const message = formData.get("message")?.toString().trim() || null;

  if (!partId) {
    redirect("/home");
  }

  if (profile) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.from("inquiries").insert({
        customer_id: profile.id,
        part_id: partId,
        vehicle_id: vehicleId && vehicleId !== "none" ? vehicleId : null,
        message,
        status: "new",
      });

      if (error) {
        console.error("Failed to submit inquiry:", error);
      }
    }
  }

  // Always record in cookie/guest store as well
  await addGuestInquiryRecord(partId, message || undefined);

  revalidatePath(`/parts/${partId}`);
  revalidatePath("/profile");
  redirect(`/profile?added=${encodeURIComponent(partId)}#inquiries`);
}
