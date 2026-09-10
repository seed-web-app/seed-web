import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile, getUserVehicles, createSupabaseServerClient } from "@/lib/supabase/server";
import { CustomerNavbar } from "@/components/customer/Navbar";
import { submitPartInquiry } from "./actions";
import type { Part } from "@/lib/types";
import { STANDING_CONDITION_DISCLAIMER } from "@/lib/types";
import {
  ArrowLeft,
  AlertTriangle,
  Car,
  Send,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PartDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    requested?: string;
    error?: string;
  }>;
}

export default async function PartDetailPage({ params, searchParams }: PartDetailPageProps) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const { id } = await params;
  const { requested, error } = await searchParams;

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    notFound();
  }

  const { data: rawPart } = await supabase
    .from("parts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!rawPart) {
    notFound();
  }

  const part = rawPart as Part;
  const vehicles = await getUserVehicles(profile.id);

  return (
    <div className="min-h-screen bg-carbon-pattern flex flex-col selection:bg-suzuki-red selection:text-white">
      <CustomerNavbar profile={profile} vehicleCount={vehicles.length} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Parts Catalog</span>
          </Link>
        </div>

        {/* Success Alert if just requested */}
        {requested === "true" && (
          <div className="mb-8 p-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 shadow-xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Part Request Submitted Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Your inquiry has been dispatched to our dealership parts desk. Our specialists will
                review fitment against your vehicle and contact you directly via phone or WhatsApp
                at <span className="font-semibold text-emerald-300">{profile.phone || "your account phone"}</span> to confirm offline availability.
              </p>
              <div className="mt-3">
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:underline"
                >
                  <span>Track status in My Garage & Inquiries →</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            Failed to submit request. Please try again or verify your connection.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Photos & Details (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Main Photo Gallery */}
            <div className="rounded-3xl bg-glass border border-white/10 overflow-hidden">
              <div className="relative aspect-[16/10] bg-suzuki-slate overflow-hidden">
                {part.photos && part.photos.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={part.photos[0]}
                    alt={part.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    No image provided
                  </div>
                )}

                {/* Badges on image */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {part.is_offer && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-suzuki-red text-white text-xs font-black uppercase tracking-wider shadow-lg">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Promotional Offer</span>
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-md bg-suzuki-black/80 backdrop-blur-md text-white text-xs font-semibold border border-white/10">
                    {part.category}
                  </span>
                </div>

                <div className="absolute top-4 right-4">
                  <span
                    className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                      part.status === "available"
                        ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                        : part.status === "reserved"
                        ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                        : "bg-slate-500/20 border border-slate-500/40 text-slate-400"
                    }`}
                  >
                    {part.status}
                  </span>
                </div>
              </div>

              {/* Multi-Photo Thumbnails */}
              {part.photos && part.photos.length > 1 && (
                <div className="p-4 bg-suzuki-black/40 border-t border-white/10 flex gap-3 overflow-x-auto">
                  {part.photos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="w-20 h-16 rounded-lg overflow-hidden border border-white/20 flex-shrink-0 cursor-pointer hover:border-suzuki-red transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt={`Angle ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Standing Condition Disclaimer Box */}
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-5">
              <div className="flex items-start gap-3.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                    Standing Condition & Primer Disclaimer
                  </h4>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    &ldquo;{STANDING_CONDITION_DISCLAIMER}&rdquo;
                  </p>
                  {part.condition_note && (
                    <p className="text-xs text-slate-300 mt-2 italic">
                      Item note: {part.condition_note}
                    </p>
                  )}
                  {part.primer_note && (
                    <div className="mt-2.5 pt-2.5 border-t border-amber-500/20 text-xs text-slate-300">
                      <span className="font-semibold text-amber-300">Primer spec: </span>
                      {part.primer_note}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Compatible Suzuki Models */}
            <div className="rounded-2xl bg-glass p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-3 text-white font-bold text-sm">
                <Car className="w-4 h-4 text-suzuki-red" />
                <span>Verified Compatible Suzuki Models</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {part.compatible_models && part.compatible_models.length > 0 ? (
                  part.compatible_models.map((mod) => (
                    <span
                      key={mod}
                      className="px-3 py-1.5 rounded-lg bg-suzuki-slate/80 text-xs font-semibold text-slate-200 border border-white/10"
                    >
                      {mod}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">Universal Suzuki Component</span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Title, Reference Price & Request CTA (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-glass border border-white/10 p-6 sm:p-8 shadow-2xl">
              <div>
                <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">
                  Category: {part.category}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 leading-tight">
                  {part.name}
                </h1>
                {part.part_number && (
                  <p className="text-xs font-mono text-slate-400 mt-2">
                    Part Number: <span className="text-slate-200">{part.part_number}</span>
                  </p>
                )}
              </div>

              {/* Reference Price Banner */}
              <div className="my-6 p-4 rounded-2xl bg-suzuki-slate/80 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Dealer Reference Price
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-3xl font-black text-white">
                      ${Number(part.price).toFixed(2)}
                    </span>
                    <span className="text-[11px] text-slate-400">USD</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded block font-medium">
                    Offline Quote
                  </span>
                </div>
              </div>

              {/* Request Lead Form */}
              <div className="pt-2 border-t border-white/10">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-white">Request This Part</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Submit your request to our dealer desk. No online payment required.
                  </p>
                </div>

                <form action={submitPartInquiry} className="space-y-4">
                  <input type="hidden" name="part_id" value={part.id} />

                  {/* Vehicle selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Apply to Your Registered Vehicle
                    </label>
                    {vehicles.length > 0 ? (
                      <select
                        name="vehicle_id"
                        defaultValue={vehicles[0].id}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none transition-colors"
                      >
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.year} {v.make} {v.model} {v.registration_no ? `(${v.registration_no})` : ""}
                          </option>
                        ))}
                        <option value="none">Other / Unlisted Vehicle</option>
                      </select>
                    ) : (
                      <div className="p-3 rounded-xl bg-suzuki-slate/60 border border-white/10 text-xs text-slate-400">
                        No vehicle registered yet.{" "}
                        <Link href="/profile" className="text-suzuki-brightred underline">
                          Add to Garage
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Customer inquiry message */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Inquiry Notes / Questions (Optional)
                    </label>
                    <textarea
                      name="message"
                      rows={3}
                      placeholder="e.g. Can you confirm if this matches my color code or if you offer local warehouse pickup?"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:border-suzuki-red focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  {/* Customer contact reminder */}
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Contact Phone: {profile.phone || "Not set"}</span>
                    </div>
                    <p>
                      Dealer staff will call or message your phone to verify stock and arrange offline fulfillment.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={part.status === "sold"}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-sm shadow-xl transition-all duration-200 cursor-pointer ${
                      part.status === "sold"
                        ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                        : "bg-suzuki-red hover:bg-suzuki-brightred text-white shadow-suzuki-red/30 hover:shadow-suzuki-red/50"
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span>{part.status === "sold" ? "Part Sold Out" : "Request This Part"}</span>
                  </button>
                </form>

                <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Authorized Suzuki Dealer Network Lead System</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
