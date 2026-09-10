import { NextResponse } from "next/server";
import { getCurrentProfile, createSupabaseServerClient } from "@/lib/supabase/server";
import {
  addGuestInquiryRecord,
  removeGuestInquiryRecord,
  getGuestInquiryRecords,
} from "@/lib/inquiries";

export async function GET() {
  const profile = await getCurrentProfile();
  if (profile) {
    const supabase = await createSupabaseServerClient();
    const { count } = supabase
      ? await supabase
          .from("inquiries")
          .select("id", { count: "exact", head: true })
          .eq("customer_id", profile.id)
      : { count: 0 };
    return NextResponse.json({ count: count || 0, isGuest: false });
  }

  const guestRecords = await getGuestInquiryRecords();
  return NextResponse.json({ count: guestRecords.length, isGuest: true });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { partId, message, vehicleName, vehicleId } = body;

    if (!partId) {
      return NextResponse.json({ error: "partId is required" }, { status: 400 });
    }

    const profile = await getCurrentProfile();

    if (profile) {
      const supabase = await createSupabaseServerClient();
      if (!supabase) {
        return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
      }

      // Check if already in inquiries
      const { data: existing } = await supabase
        .from("inquiries")
        .select("id")
        .eq("customer_id", profile.id)
        .eq("part_id", partId)
        .maybeSingle();

      let inquiryId = existing?.id;

      if (!inquiryId) {
        const { data: inserted, error: insertError } = await supabase
          .from("inquiries")
          .insert({
            customer_id: profile.id,
            part_id: partId,
            vehicle_id: vehicleId && vehicleId !== "none" ? vehicleId : null,
            message: message || null,
            status: "new",
          })
          .select("id")
          .single();

        if (insertError) {
          console.error("Failed to insert inquiry:", insertError);
          // Fall back to guest cookie
          await addGuestInquiryRecord(partId, message, vehicleName);
        } else {
          inquiryId = inserted?.id;
        }
      }

      // Also ensure it's recorded in cookie as backup
      await addGuestInquiryRecord(partId, message, vehicleName);

      return NextResponse.json({
        success: true,
        inquiryId,
        isGuest: false,
      });
    }

    // Guest inquiry
    const guestRecord = await addGuestInquiryRecord(partId, message, vehicleName);
    return NextResponse.json({
      success: true,
      inquiryId: guestRecord.id,
      txnCode: guestRecord.txnCode,
      isGuest: true,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to process inquiry";
    console.error("Inquiry API error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { inquiryId, partId } = body;

    const profile = await getCurrentProfile();
    if (profile && inquiryId && !inquiryId.startsWith("guest-inq-")) {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        await supabase
          .from("inquiries")
          .delete()
          .eq("id", inquiryId)
          .eq("customer_id", profile.id);
      }
    }

    // Always clear from guest cookie as well
    if (inquiryId || partId) {
      await removeGuestInquiryRecord(inquiryId || partId);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete";
    console.error("Delete inquiry error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
