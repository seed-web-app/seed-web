import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Part, InquiryWithDetails } from "@/lib/types";

export const GUEST_INQUIRIES_COOKIE = "suzuki_guest_inquiries";

export interface GuestInquiryRecord {
  id: string;
  partId: string;
  createdAt: string;
  txnCode: string;
  message?: string;
  vehicleName?: string;
}

export function generateTxnCode(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `TXN-MU-2026-${randomNum}`;
}

export async function getGuestInquiryRecords(): Promise<GuestInquiryRecord[]> {
  try {
    const cookieStore = await cookies();
    const cookieVal = cookieStore.get(GUEST_INQUIRIES_COOKIE)?.value;
    if (!cookieVal) return [];
    const parsed = JSON.parse(decodeURIComponent(cookieVal));
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

export async function addGuestInquiryRecord(
  partId: string,
  message?: string,
  vehicleName?: string
): Promise<GuestInquiryRecord> {
  const existing = await getGuestInquiryRecords();
  // Check if already in list
  const existingItem = existing.find((item) => item.partId === partId);
  if (existingItem) {
    return existingItem;
  }

  const newItem: GuestInquiryRecord = {
    id: `guest-inq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    partId,
    createdAt: new Date().toISOString(),
    txnCode: generateTxnCode(),
    message: message || undefined,
    vehicleName: vehicleName || undefined,
  };

  const updated = [newItem, ...existing];
  const cookieStore = await cookies();
  cookieStore.set(GUEST_INQUIRIES_COOKIE, encodeURIComponent(JSON.stringify(updated)), {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: "lax",
  });

  return newItem;
}

export async function removeGuestInquiryRecord(idOrPartId: string): Promise<void> {
  const existing = await getGuestInquiryRecords();
  const updated = existing.filter(
    (item) => item.id !== idOrPartId && item.partId !== idOrPartId
  );
  const cookieStore = await cookies();
  cookieStore.set(GUEST_INQUIRIES_COOKIE, encodeURIComponent(JSON.stringify(updated)), {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
}

/**
 * If user logs in, seamlessly transfer their guest inquiries to the Supabase database.
 */
export async function syncGuestInquiriesToUser(userId: string): Promise<void> {
  const guestRecords = await getGuestInquiryRecords();
  if (guestRecords.length === 0) return;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  // Fetch existing user inquiries to avoid duplicates
  const { data: existingUserInquiries } = await supabase
    .from("inquiries")
    .select("part_id")
    .eq("customer_id", userId);

  const existingPartIds = new Set(
    (existingUserInquiries || []).map((inq) => inq.part_id)
  );

  const inserts = guestRecords
    .filter((g) => !existingPartIds.has(g.partId))
    .map((g) => ({
      customer_id: userId,
      part_id: g.partId,
      message: g.message || null,
      status: "new",
      created_at: g.createdAt,
    }));

  if (inserts.length > 0) {
    await supabase.from("inquiries").insert(inserts);
  }

  // Clear guest cookie after sync
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_INQUIRIES_COOKIE);
}

/**
 * Hydrate guest records with full part details for rendering on /profile
 */
export async function getGuestInquiriesWithDetails(): Promise<InquiryWithDetails[]> {
  const records = await getGuestInquiryRecords();
  if (records.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const partIds = records.map((r) => r.partId);
  const { data: partsData } = await supabase
    .from("parts")
    .select("*")
    .in("id", partIds);

  const partsMap = new Map<string, Part>();
  (partsData || []).forEach((p) => partsMap.set(p.id, p as Part));

  return records
    .map((rec) => {
      const part = partsMap.get(rec.partId);
      if (!part) return null;

      const inqWithDetails: InquiryWithDetails = {
        id: rec.id,
        customer_id: "guest",
        part_id: rec.partId,
        vehicle_id: null,
        message: rec.message || null,
        status: "new",
        admin_notes:
          "Guest inquiry recorded in Phoenix EPC system. Dealership specialist will verify Mauritius RHD fitment upon WhatsApp quote confirmation.",
        created_at: rec.createdAt,
        updated_at: rec.createdAt,
        part,
        vehicle: rec.vehicleName
          ? {
              id: "guest-vehicle",
              owner_id: "guest",
              make: "Suzuki",
              model: rec.vehicleName,
              year: 2024,
              created_at: rec.createdAt,
            }
          : null,
      };
      return inqWithDetails;
    })
    .filter((i): i is InquiryWithDetails => i !== null);
}
