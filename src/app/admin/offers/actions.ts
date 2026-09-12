"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, getCurrentProfile } from "@/lib/supabase/server";
import type { OfferChannel } from "@/lib/types";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/offers?error=auth");
  return { profile, supabase };
}

export async function prepareCustomerOffer(formData: FormData) {
  const customerId = formData.get("customer_id")?.toString();
  const partId = formData.get("part_id")?.toString() || null;
  const title = formData.get("title")?.toString().trim();
  const message = formData.get("message")?.toString().trim();
  const channel = (formData.get("channel")?.toString() || "whatsapp") as OfferChannel;
  const priceRaw = formData.get("reference_price")?.toString().trim();
  const referencePrice = priceRaw ? Number(priceRaw) : null;
  if (!customerId || !title || !message || !["whatsapp", "email", "phone"].includes(channel)) redirect("/admin/offers?error=missing_fields");
  if (referencePrice !== null && (!Number.isFinite(referencePrice) || referencePrice < 0)) redirect(`/admin/offers?customer=${customerId}&error=invalid_price`);

  const { profile, supabase } = await requireAdmin();
  const { data: customer } = await supabase.from("profiles").select("id, full_name, phone, email").eq("id", customerId).eq("role", "customer").maybeSingle();
  if (!customer) redirect("/admin/offers?error=customer_not_found");

  const { error } = await supabase.from("customer_offers").insert({ customer_id: customerId, part_id: partId || null, title, message, reference_price: referencePrice, channel, status: "prepared", created_by: profile.id });
  if (error) redirect(`/admin/offers?customer=${customerId}&error=save_failed`);

  revalidatePath("/admin/offers");
  revalidatePath("/admin/users");

  if (channel === "whatsapp") {
    const number = (customer.phone || "").replace(/[^0-9]/g, "");
    if (!number) redirect(`/admin/offers?customer=${customerId}&saved=prepared&error=no_phone`);
    redirect(`https://wa.me/${number}?text=${encodeURIComponent(`${title}\n\n${message}`)}`);
  }
  if (channel === "email") {
    if (!customer.email) redirect(`/admin/offers?customer=${customerId}&saved=prepared&error=no_email`);
    redirect(`mailto:${customer.email}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`);
  }

  if (!customer.phone) redirect(`/admin/offers?customer=${customerId}&saved=prepared&error=no_phone`);
  redirect(`tel:${customer.phone}`);
}

export async function markOfferSent(formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) redirect("/admin/offers");
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("customer_offers").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect("/admin/offers?error=update_failed");
  revalidatePath("/admin/offers");
  redirect("/admin/offers?saved=sent");
}

export async function cancelOffer(formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) redirect("/admin/offers");
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("customer_offers").update({ status: "cancelled" }).eq("id", id);
  if (error) redirect("/admin/offers?error=update_failed");
  revalidatePath("/admin/offers");
  redirect("/admin/offers?saved=cancelled");
}
