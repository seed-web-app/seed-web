import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile, getUserVehicles, createSupabaseServerClient } from "@/lib/supabase/server";
import { CustomerNavbar } from "@/components/customer/Navbar";
import { PartGallery } from "@/components/customer/PartGallery";
import { ProductRail } from "@/components/customer/ProductRail";
import { submitPartInquiry } from "./actions";
import type { Part } from "@/lib/types";
import { STANDING_CONDITION_DISCLAIMER } from "@/lib/types";
import {
  AlertTriangle,
  Star,
  MapPin,
  ShieldCheck,
  Send,
  CheckCircle2,
  ChevronRight,
  Car,
  Lock,
  Phone,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PartDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    requested?: string;
    error?: string;
  }>;
}

export default async function PartDetailPage({
  params,
  searchParams,
}: PartDetailPageProps) {
  const profile = await getCurrentProfile();
  const vehicles = profile ? await getUserVehicles(profile.id) : [];
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    notFound();
  }

  const { id } = await params;
  const { requested, error } = await searchParams;

  const { data: partData, error: partError } = await supabase
    .from("parts")
    .select("*")
    .eq("id", id)
    .single();

  if (partError || !partData) {
    notFound();
  }

  const part = partData as Part;

  // Fetch related parts in the same category
  const { data: rawRelated } = await supabase
    .from("parts")
    .select("*")
    .eq("category", part.category)
    .neq("id", part.id)
    .limit(8);
  const relatedParts = (rawRelated as Part[]) || [];

  const { count: inquiryCount } = (supabase && profile)
    ? await supabase
        .from("inquiries")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", profile.id)
    : { count: 0 };

  return (
    <div className="min-h-screen bg-[#eaeded] flex flex-col font-sans selection:bg-[#ffd814] selection:text-black">
      <CustomerNavbar
        profile={profile}
        vehicleCount={vehicles.length}
        inquiryCount={inquiryCount || 0}
      />

      <main className="flex-1 max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        {/* Amazon Breadcrumbs */}
        <nav className="text-xs text-[#565959] flex items-center gap-1.5 flex-wrap">
          <Link href="/home" className="hover:text-[#c7511f] hover:underline">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-[#999999]" />
          <Link
            href={`/home?category=${encodeURIComponent(part.category)}`}
            className="hover:text-[#c7511f] hover:underline"
          >
            {part.category}
          </Link>
          <ChevronRight className="w-3 h-3 text-[#999999]" />
          <span className="text-[#0f1111] font-semibold truncate max-w-xs">
            {part.name}
          </span>
        </nav>

        {/* Success Feedback Alert */}
        {requested && (
          <div className="p-4 rounded-lg bg-[#e7f4e4] border border-[#2b8a3e] flex items-start gap-3 text-xs">
            <CheckCircle2 className="w-5 h-5 text-[#2b8a3e] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-[#2b8a3e]">
                Inquiry Dispatched to Dealership Parts Desk!
              </h3>
              <p className="text-[#0f1111] mt-1 leading-relaxed">
                Thank you! Our Suzuki parts team in Phoenix & Port Louis has received your enquiry for{" "}
                <strong>{part.name}</strong>. We will contact you via WhatsApp or phone at{" "}
                <span className="font-bold">{profile?.phone || "your registered number"}</span> to verify chassis fitment and provide a finalized quote.
              </p>
              <Link
                href="/profile#inquiries"
                className="mt-2 inline-block font-bold text-[#007185] hover:text-[#c7511f] hover:underline"
              >
                Track this request in My Inquiries & Transactions →
              </Link>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-md bg-[#fdf3f2] border border-[#d9381e] text-xs text-[#d9381e]">
            Could not submit inquiry. Please try again or verify your connection.
          </div>
        )}

        {/* Amazon 3-Column Product Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white p-6 rounded-lg border border-[#e7e7e7] shadow-xs">
          {/* Column 1: Interactive Image Gallery (4 cols) */}
          <div className="lg:col-span-4">
            <PartGallery photos={part.photos || []} name={part.name} />
          </div>

          {/* Column 2: Product Info & Disclaimers (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <Link
                href={`/home?category=${encodeURIComponent(part.category)}`}
                className="text-xs font-semibold text-[#007185] hover:text-[#c7511f] hover:underline"
              >
                Official Suzuki Genuine Parts • Mauritius Depot
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0f1111] mt-1 leading-snug">
                {part.name}
              </h1>
              {part.part_number && (
                <p className="text-xs font-mono text-[#565959] mt-1">
                  OEM Part Code: <span className="font-bold text-[#0f1111]">{part.part_number}</span>
                </p>
              )}
            </div>

            {/* Star Rating & Reviews */}
            <div className="flex items-center gap-2 border-b border-[#f0f0f0] pb-3">
              <div className="flex text-[#ffa41c]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-xs font-bold text-[#007185]">4.9 out of 5</span>
              <span className="text-xs text-[#565959]">| 84 owner reviews in Mauritius</span>
            </div>

            {/* Pricing Section in Mauritian Rupees */}
            <div className="border-b border-[#f0f0f0] pb-3 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-[#565959]">Reference Price:</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#b12704]">
                  Rs {Number(part.price || 0).toLocaleString()}
                </span>
                <span className="text-xs font-bold text-[#565959]">MUR</span>
              </div>
              <p className="text-[11px] text-[#565959]">
                Reference dealer quote for Mauritius. No online payment required — offline quote confirmed upon fitment verification.
              </p>
            </div>

            {/* Standing Condition & Gray Primer Notice Box */}
            <div className="p-4 rounded-md bg-[#fff8e7] border border-[#fbd88e] text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#b12704] font-bold">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Standing Condition & Factory Primer Notice</span>
              </div>
              <p className="text-[#0f1111] font-medium leading-relaxed">
                &ldquo;{STANDING_CONDITION_DISCLAIMER}&rdquo;
              </p>
              {part.condition_note && (
                <p className="text-[#565959] italic text-[11px]">
                  <strong>Item note:</strong> {part.condition_note}
                </p>
              )}
              {part.primer_note && (
                <p className="text-[#565959] text-[11px] border-t border-[#fbd88e] pt-1.5 mt-1.5">
                  <strong>Primer Specification:</strong> {part.primer_note}
                </p>
              )}
            </div>

            {/* Compatible Suzuki Models */}
            <div className="border-b border-[#f0f0f0] pb-4">
              <h3 className="text-xs font-bold uppercase text-[#565959] tracking-wider mb-2 flex items-center gap-1.5">
                <Car className="w-4 h-4 text-[#c7511f]" />
                <span>Verified Compatible Suzuki Models</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {part.compatible_models && part.compatible_models.length > 0 ? (
                  part.compatible_models.map((mod) => (
                    <Link
                      key={mod}
                      href={`/cars`}
                      className="px-2.5 py-1 rounded bg-[#f3f3f3] hover:bg-[#e3e6e6] text-xs font-medium text-[#0f1111] border border-[#e7e7e7] transition-colors"
                    >
                      {mod}
                    </Link>
                  ))
                ) : (
                  <span className="text-xs text-[#565959]">Universal Suzuki Fitment</span>
                )}
              </div>
            </div>

            {/* Technical Bullet Points */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-[#565959] tracking-wider">
                About This Item
              </h3>
              <ul className="list-disc pl-5 text-xs text-[#0f1111] space-y-1.5 leading-relaxed">
                <li>Factory genuine OEM specification replacement component.</li>
                <li>Engineered specifically for Suzuki right-hand-drive island vehicles.</li>
                <li>Passes Mauritius National Transport Authority road fitness standards.</li>
                <li>Full fitment guarantee when ordered through authorized dealership parts desks.</li>
              </ul>
            </div>
          </div>

          {/* Column 3: Amazon Buy / Enquire Box (3 cols) */}
          <div className="lg:col-span-3">
            <div className="border border-[#d5d9d9] rounded-lg p-5 bg-[#fafafa] shadow-sm space-y-4 sticky top-20" id="enquire">
              {/* Box Header */}
              <div>
                <span className="text-2xl font-bold text-[#b12704]">
                  Rs {Number(part.price || 0).toLocaleString()}
                </span>
                <span className="text-xs text-[#565959] block">
                  MUR Reference Price
                </span>
              </div>

              {/* Delivery info */}
              <div className="text-xs text-[#565959] space-y-1">
                <p className="text-[#0f1111]">
                  Dispatched to: <strong className="text-[#007185]">Mauritius 🇲🇺</strong>
                </p>
                <div className="flex items-center gap-1 text-[11px] text-[#565959]">
                  <MapPin className="w-3.5 h-3.5 text-[#febd69]" />
                  <span>Phoenix & Port Louis Warehouses</span>
                </div>
              </div>

              {/* Stock Status */}
              <div className="text-xs">
                {part.status === "available" ? (
                  <span className="text-[#007600] font-bold text-sm">In Stock - Available for Enquiry</span>
                ) : part.status === "reserved" ? (
                  <span className="text-[#b12704] font-bold">Limited Allocation / Reserved</span>
                ) : (
                  <span className="text-[#565959] font-bold">Sold Out / Back-order</span>
                )}
              </div>

              {/* Lead Inquiry Form or Guest Sign In */}
              {profile ? (
                <form action={submitPartInquiry} className="space-y-3 pt-2 border-t border-[#e7e7e7]">
                  <input type="hidden" name="part_id" value={part.id} />

                  <div>
                    <label className="block text-[11px] font-bold text-[#0f1111] mb-1">
                      Select Your Registered Vehicle:
                    </label>
                    {vehicles.length > 0 ? (
                      <select
                        name="vehicle_id"
                        defaultValue={vehicles[0].id}
                        className="w-full text-xs p-2 rounded border border-[#888c8c] bg-white focus:ring-1 focus:ring-[#e77600]"
                      >
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.year} {v.make} {v.model}
                          </option>
                        ))}
                        <option value="none">Other Suzuki Model</option>
                      </select>
                    ) : (
                      <p className="text-[11px] text-[#565959]">
                        No vehicle registered in garage yet.{" "}
                        <Link href="/profile" className="text-[#007185] underline">
                          Add one now
                        </Link>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#0f1111] mb-1">
                      Questions / Chassis Notes:
                    </label>
                    <textarea
                      name="message"
                      rows={2}
                      placeholder="e.g. Please verify fitment for my chassis number or confirm primer condition"
                      className="w-full text-xs p-2 rounded border border-[#888c8c] bg-white focus:ring-1 focus:ring-[#e77600] resize-none"
                    />
                  </div>

                  {/* Golden Amazon Enquire Button */}
                  <button
                    type="submit"
                    disabled={part.status === "sold"}
                    className={`w-full py-2.5 px-4 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow transition-all ${
                      part.status === "sold"
                        ? "bg-[#e7e7e7] text-[#565959] cursor-not-allowed"
                        : "btn-amazon-primary text-[#0f1111]"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enquire This Part</span>
                  </button>
                </form>
              ) : (
                <div className="pt-3 border-t border-[#e7e7e7] space-y-2.5 text-xs">
                  <p className="text-[#565959] text-[11px] leading-relaxed">
                    Sign in with your Google account to submit an inquiry and receive a verified dealership quotation.
                  </p>
                  <Link
                    href="/login"
                    className="w-full py-2.5 px-4 rounded-full btn-amazon-primary text-xs font-bold text-[#0f1111] flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Sign In to Enquire Part</span>
                  </Link>
                  <a
                    href={`https://wa.me/2305550199?text=${encodeURIComponent(
                      `Hello Suzuki Mauritius, inquiring about ${part.name} (OEM #${part.part_number || "OEM"})`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-4 rounded-full bg-white border border-[#d5d9d9] hover:bg-[#f3f3f3] text-[11px] font-semibold text-[#0f1111] flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#2b8a3e]" />
                    <span>WhatsApp Parts Advisor</span>
                  </a>
                </div>
              )}

              {/* Trust badges */}
              <div className="pt-2 border-t border-[#e7e7e7] text-[11px] text-[#565959] space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#565959]" />
                  <span>Secure Dealership Direct Follow-Up</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2b8a3e]" />
                  <span>Verified Suzuki Mauritius Genuine Fitment</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Rail */}
        {relatedParts.length > 0 && (
          <ProductRail
            title={`Related Genuine ${part.category}`}
            subtitle="Frequently requested together for Suzuki maintenance and repair"
            parts={relatedParts}
            viewAllLink={`/home?category=${encodeURIComponent(part.category)}`}
          />
        )}
      </main>
    </div>
  );
}
