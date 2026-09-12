"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, getCurrentProfile } from "@/lib/supabase/server";
import { STANDING_CONDITION_DISCLAIMER } from "@/lib/types";

export async function createPart(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/login");

  const name = formData.get("name")?.toString().trim();
  const category = formData.get("category")?.toString().trim();
  const priceStr = formData.get("price")?.toString().trim();
  const condition_note =
    formData.get("condition_note")?.toString().trim() || STANDING_CONDITION_DISCLAIMER;
  const primer_note = formData.get("primer_note")?.toString().trim() || null;
  const part_number = formData.get("part_number")?.toString().trim() || null;
  const short_description = formData.get("short_description")?.toString().trim() || null;
  const description = formData.get("description")?.toString().trim() || null;
  const status = (formData.get("status")?.toString() as "available" | "reserved" | "sold") || "available";
  const is_offer = formData.get("is_offer") === "on";

  // Compatible models parsed from comma-separated string or multiple values
  const modelsRaw = formData.get("compatible_models")?.toString() || "";
  const compatible_models = modelsRaw
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  // Photos: support direct URLs or multi-line URLs
  const photosRaw = formData.get("photos")?.toString() || "";
  const photos = photosRaw
    .split(/[\n,]/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (!name || !category || !priceStr) {
    redirect("/admin/parts?error=missing_fields");
  }

  const price = parseFloat(priceStr);
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/parts?error=auth");

  const { error } = await supabase.from("parts").insert({
    name,
    category,
    price,
    condition_note,
    primer_note,
    part_number,
    short_description,
    description,
    status,
    is_offer,
    compatible_models,
    photos: photos.length > 0 ? photos : ["/brand/parts-studio.jpg"],
  });

  if (error) {
    console.error("Failed to insert part:", error);
    redirect("/admin/parts?error=insert_failed");
  }

  revalidatePath("/admin/parts");
  revalidatePath("/home");
  redirect("/admin/parts?saved=created");
}

export async function updatePart(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/login");

  const id = formData.get("id")?.toString();
  if (!id) redirect("/admin/parts");

  const name = formData.get("name")?.toString().trim();
  const category = formData.get("category")?.toString().trim();
  const priceStr = formData.get("price")?.toString().trim();
  const condition_note = formData.get("condition_note")?.toString().trim();
  const primer_note = formData.get("primer_note")?.toString().trim() || null;
  const part_number = formData.get("part_number")?.toString().trim() || null;
  const short_description = formData.get("short_description")?.toString().trim() || null;
  const description = formData.get("description")?.toString().trim() || null;
  const status = (formData.get("status")?.toString() as "available" | "reserved" | "sold") || "available";
  const is_offer = formData.get("is_offer") === "on";

  const modelsRaw = formData.get("compatible_models")?.toString() || "";
  const compatible_models = modelsRaw
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  const photosRaw = formData.get("photos")?.toString() || "";
  const photos = photosRaw
    .split(/[\n,]/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (!name || !category || !priceStr) {
    redirect("/admin/parts?error=missing_fields");
  }

  const price = parseFloat(priceStr);
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/parts?error=auth");

  const { error } = await supabase
    .from("parts")
    .update({
      name,
      category,
      price,
      condition_note,
      primer_note,
      part_number,
      short_description,
      description,
      status,
      is_offer,
      compatible_models,
      ...(photos.length > 0 ? { photos } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to update part:", error);
    redirect("/admin/parts?error=update_failed");
  }

  revalidatePath("/admin/parts");
  revalidatePath("/home");
  redirect("/admin/parts?saved=updated");
}

export async function deletePart(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/login");

  const id = formData.get("id")?.toString();
  if (!id) redirect("/admin/parts");

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/parts?error=auth");

  const { error } = await supabase.from("parts").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete part:", error);
    redirect("/admin/parts?error=delete_failed");
  }

  revalidatePath("/admin/parts");
  revalidatePath("/home");
  redirect("/admin/parts?saved=deleted");
}
