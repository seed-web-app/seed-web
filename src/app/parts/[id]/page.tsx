import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile, getUserVehicles, createSupabaseServerClient } from "@/lib/supabase/server";
import { CustomerNavbar } from "@/components/customer/Navbar";
import { PartGallery } from "@/components/customer/PartGallery";
import { ProductRail } from "@/components/customer/ProductRail";
import { submitPartInquiry } from "./actions";
import { getCachedPartById, getCachedParts } from "@/lib/catalog";
import { getGuestInquiryRecords } from "@/lib/inquiries";
import { STANDING_CONDITION_DISCLAIMER } from "@/lib/types";
import {
  AlertTriangle,
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
  const { id } = await params;
  const { requested, error } = await searchParams;

  // Run cached part lookup, all parts, profile and guest inquiries in parallel
  const [part, allParts, profile, guestRecords] = await Promise.all([
    getCachedPartById(id),
    getCachedParts(),
    getCurrentProfile(),
    getGuestInquiryRecords(),
  ]);

  if (!part) {
    notFound();
  }

  const supabase = profile ? await createSupabaseServerClient() : null;

  const [vehicles, userInquiryCount] = profile
    ? await Promise.all([
        getUserVehicles(profile.id),
        supabase
          ? supabase
              .from("inquiries")
              .select("id", { count: "exact", head: true })
              .eq("customer_id", profile.id)
              .then((res) => res.count || 0)
          : Promise.resolve(0),
      ])
    : [[], 0];

  const inquiryCount = profile ? userInquiryCount : guestRecords.length;

  // Instant in-memory related parts
  const relatedParts = allParts
    .filter((p) => p.category === part.category && p.id !== part.id)
    .slice(0, 8);

  return (
    <div className="app-canvas min-h-screen flex flex-col font-sans text-[#1d1d1f]">
      <CustomerNavbar
        profile={profile}
        vehicleCount={vehicles.length}
        inquiryCount={inquiryCount || 0}
      />

      <main className="flex-1 max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-24 md:pb-8 space-y-6">
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
                Track this request in My Part Requests →
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
        <div className="ios-card grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white p-5 sm:p-7 rounded-[30px]">
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

            <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.06] pb-4 text-[11px] font-semibold">
              <span className="rounded-full bg-[#e8f8ef] px-3 py-1.5 text-[#138a51]">Dealer catalog verified</span>
              <span className="rounded-full bg-[#f2f2f4] px-3 py-1.5 text-[#6e6e73]">Fitment checked on request</span>
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
              {part.description || part.short_description ? (
                <p className="text-sm leading-6 text-[#343536]">
                  {part.description || part.short_description}
                </p>
              ) : null}
              <ul className="list-disc pl-5 text-xs text-[#0f1111] space-y-1.5 leading-relaxed">
                <li>Catalog listing includes the dealer&apos;s latest reference price.</li>
                <li>Compatibility is confirmed against your vehicle before a final quote.</li>
                <li>Condition and primer notes are visible before you send a request.</li>
                <li>No checkout or online payment is collected in this app.</li>
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

              {/* Lead Inquiry Form */}
              <form action={submitPartInquiry} className="space-y-3 pt-2 border-t border-[#e7e7e7]">
                <input type="hidden" name="part_id" value={part.id} />

                <div>
                  <label className="block text-[11px] font-bold text-[#0f1111] mb-1">
                    {profile && vehicles.length > 0 ? "Select Your Registered Vehicle:" : "Your Suzuki Model / Chassis:"}
                  </label>
                  {profile && vehicles.length > 0 ? (
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
                    <input
                      type="text"
                      name="vehicle_model"
                      placeholder="e.g. 2023 Jimny JB74, Swift 1.2L, Grand Vitara"
                      className="w-full text-xs p-2 rounded border border-[#888c8c] bg-white focus:ring-1 focus:ring-[#e77600]"
                    />
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
                  className={`w-full min-h-[44px] py-2.5 px-4 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow transition-all ${
                    part.status === "sold"
                      ? "bg-[#e7e7e7] text-[#565959] cursor-not-allowed"
                      : "btn-amazon-primary text-[#0f1111]"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enquire This Part</span>
                </button>

                <a
                  href={`https://wa.me/2305550199?text=${encodeURIComponent(
                    `Hello Suzuki Mauritius, inquiring about ${part.name} (OEM #${part.part_number || "OEM"})`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full min-h-[44px] py-2 px-4 rounded-full bg-white border border-[#d5d9d9] hover:bg-[#f3f3f3] text-[11px] font-semibold text-[#0f1111] flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-[#2b8a3e]" />
                  <span>WhatsApp Parts Advisor</span>
                </a>
              </form>

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

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="ios-card rounded-[28px] p-6 sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#e30613]">Part information</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.035em]">What we know</h2>
            <div className="mt-5 divide-y divide-black/[0.06] text-xs">
              <div className="grid grid-cols-[120px_1fr] gap-4 py-3"><span className="font-semibold text-[#8e8e93]">Category</span><span className="font-bold">{part.category}</span></div>
              <div className="grid grid-cols-[120px_1fr] gap-4 py-3"><span className="font-semibold text-[#8e8e93]">Part number</span><span className="font-mono font-bold">{part.part_number || "Confirmed on request"}</span></div>
              <div className="grid grid-cols-[120px_1fr] gap-4 py-3"><span className="font-semibold text-[#8e8e93]">Models</span><span className="font-bold">{part.compatible_models?.length ? part.compatible_models.join(", ") : "Fitment checked by the dealer"}</span></div>
              <div className="grid grid-cols-[120px_1fr] gap-4 py-3"><span className="font-semibold text-[#8e8e93]">Condition</span><span className="font-bold">{part.condition_note || "Dealer condition note provided before confirmation"}</span></div>
              {part.primer_note ? <div className="grid grid-cols-[120px_1fr] gap-4 py-3"><span className="font-semibold text-[#8e8e93]">Primer</span><span className="font-bold">{part.primer_note}</span></div> : null}
            </div>
          </div>

          <div className="rounded-[28px] bg-[#1d1d1f] p-6 text-white shadow-[0_20px_50px_rgba(17,17,19,0.12)] sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#ff6b75]">Simple request flow</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.035em]">What happens next</h2>
            <div className="mt-6 space-y-4">
              <div className="flex gap-3"><span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-white/10 text-xs font-black">1</span><div><p className="text-sm font-bold">Send your request</p><p className="mt-1 text-xs leading-5 text-white/55">Choose a registered vehicle and add any useful chassis notes.</p></div></div>
              <div className="flex gap-3"><span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-white/10 text-xs font-black">2</span><div><p className="text-sm font-bold">Dealer checks the fitment</p><p className="mt-1 text-xs leading-5 text-white/55">A parts advisor reviews compatibility, condition, and availability.</p></div></div>
              <div className="flex gap-3"><span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-white/10 text-xs font-black">3</span><div><p className="text-sm font-bold">Confirm directly</p><p className="mt-1 text-xs leading-5 text-white/55">You receive the final information by phone or WhatsApp. No online payment.</p></div></div>
            </div>
            <a href={`https://wa.me/2305550199?text=${encodeURIComponent(`Hello Suzuki Mauritius, I would like fitment help for ${part.name}`)}`} target="_blank" rel="noreferrer" className="mt-7 flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-bold text-[#1d1d1f]"><Phone className="h-4 w-4" /> Ask the fitment desk</a>
          </div>
        </section>

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
