import { NextResponse } from "next/server";
import { getCurrentProfile, createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const { count } = supabase
    ? await supabase
        .from("inquiries")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", profile.id)
    : { count: 0 };

  return NextResponse.json({ count: count || 0 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { partId, message, vehicleId } = body;

    if (!partId) {
      return NextResponse.json({ error: "partId is required" }, { status: 400 });
    }

    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
    }

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
        return NextResponse.json({ error: "Could not save the part request" }, { status: 500 });
      }

      inquiryId = inserted?.id;
    }

    return NextResponse.json({
      success: true,
      inquiryId,
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
    if (!profile) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!inquiryId && !partId) {
      return NextResponse.json({ error: "Request identifier is required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
    }

    let query = supabase.from("inquiries").delete().eq("customer_id", profile.id);
    query = inquiryId ? query.eq("id", inquiryId) : query.eq("part_id", partId);
    const { error } = await query;

    if (error) {
      console.error("Failed to delete inquiry:", error);
      return NextResponse.json({ error: "Could not remove the part request" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete";
    console.error("Delete inquiry error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
