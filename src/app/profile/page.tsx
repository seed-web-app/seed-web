import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile, getUserVehicles, createSupabaseServerClient } from "@/lib/supabase/server";
import { CustomerNavbar } from "@/components/customer/Navbar";
import { updateProfile, addVehicle, deleteVehicle } from "./actions";
import { SUZUKI_MODELS } from "@/lib/types";
import type { InquiryWithDetails, Part, Vehicle } from "@/lib/types";
import { syncGuestInquiriesToUser } from "@/lib/inquiries";
import { InquiryRowActions } from "@/components/customer/InquiryRowActions";
import {
  Car,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Check,
  Phone,
  MessageSquare,
  ArrowRight,
  Send,
  User,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
  searchParams: Promise<{
    saved?: string;
    error?: string;
    added?: string;
  }>;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createSupabaseServerClient();
  const { saved, error, added } = await searchParams;

  // Preserve any requests made before guest access was removed.
  await syncGuestInquiriesToUser(profile.id);

  const vehicles: Vehicle[] = await getUserVehicles(profile.id);
  const { data: rawInquiries } = supabase
    ? await supabase
        .from("inquiries")
        .select("*, part:parts(*), vehicle:vehicles(*)")
        .eq("customer_id", profile.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const inquiries = (rawInquiries as InquiryWithDetails[]) || [];

  // If a part was just added, fetch its details to display the confirmation card
  let addedPart: Part | null = null;
  if (added) {
    const inList = inquiries.find((i) => i.part?.id === added || i.part_id === added);
    if (inList?.part) {
      addedPart = inList.part;
    } else if (supabase) {
      const { data: p } = await supabase.from("parts").select("*").eq("id", added).maybeSingle();
      if (p) addedPart = p as Part;
    }
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-[#f5f6f7] flex flex-col font-sans">
      <CustomerNavbar
        profile={profile}
        vehicleCount={vehicles.length}
        inquiryCount={inquiries.length}
      />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8 space-y-6">
        {/* Added to Enquiry Portal Success Banner */}
        {addedPart && (
          <div className="p-4 sm:p-5 rounded-lg bg-[#e7f4e4] border-2 border-[#2b8a3e] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#2b8a3e] text-white flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#0f1111]">
                  Part Added to Your Dealership Enquiry Portal!
                </h3>
                <p className="text-xs sm:text-sm text-[#2b8a3e] font-bold">
                  {addedPart.name} • Reference Quote: Rs {Number(addedPart.price).toLocaleString()} MUR
                </p>
                <p className="text-[11px] text-[#565959] mt-0.5">
                  OEM #{addedPart.part_number || "EPC-Verified"} — Logged in your inquiry portal. Our Phoenix depot team is cross-referencing VIN fitment.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
              <Link
                href="/home#all-parts"
                className="flex-1 sm:flex-none text-center px-4 py-2 rounded-full bg-white border border-[#d5d9d9] hover:bg-[#f3f3f3] text-xs font-bold text-[#0f1111] transition-colors"
              >
                ← Browse More Parts
              </Link>
              <a
                href={`https://wa.me/2305550199?text=${encodeURIComponent(
                  `Hello Suzuki Mauritius, following up on my enquiry for ${addedPart.name} (Ref Quote: Rs ${addedPart.price} MUR)`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-none text-center px-4 py-2 rounded-full btn-amazon-primary text-xs font-bold text-[#0f1111] flex items-center justify-center gap-1.5 shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Advisor</span>
              </a>
            </div>
          </div>
        )}

        {/* Notifications */}
        {saved && (
          <div className="p-3.5 rounded-md bg-[#e7f4e4] border border-[#2b8a3e] text-xs text-[#2b8a3e] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {saved === "profile"
                ? "Contact information updated successfully."
                : saved === "vehicle_added"
                ? "Vehicle added to your Mauritius garage."
                : "Vehicle removed from your garage."}
            </span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-md bg-[#fdf3f2] border border-[#d9381e] text-xs text-[#d9381e] flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>Operation failed. Please try again.</span>
          </div>
        )}

        {/* Amazon Account Banner */}
        <div className="amazon-card p-6 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#f3f3f3] border border-[#d5d9d9] flex items-center justify-center text-base font-bold text-[#0f1111]">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || "Avatar"}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : profile ? (
                profile.full_name?.charAt(0) || "S"
              ) : (
                <User className="w-6 h-6 text-[#565959]" />
              )}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0f1111]">
                {profile ? "Your Account & Mauritius Garage" : "Customer Dealership Enquiry Portal"}
              </h1>
              <p className="text-xs text-[#565959]">
                {profile
                  ? `${profile.email} • Verified Google Driver`
                  : "Active Session • Official Quotations & Inquiries Tracker"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {profile ? (
              <span className="px-3 py-1 rounded-full bg-[#e7f4e4] text-[#2b8a3e] text-xs font-bold flex items-center gap-1 border border-[#b2d8b8]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Mauritius Network Member</span>
              </span>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-full btn-amazon-primary text-xs font-bold text-[#0f1111] flex items-center gap-1.5 shadow-xs"
              >
                <span>Sign In with Google</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Contact Form & Add Vehicle (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {profile ? (
              <>
                {/* Contact Details */}
                <div className="amazon-card p-5 bg-white space-y-4 rounded-lg">
                  <div className="border-b border-[#f0f0f0] pb-3">
                    <h2 className="text-base font-bold text-[#0f1111]">Dealership Contact Details</h2>
                    <p className="text-xs text-[#565959]">Used by parts specialists to follow up on your requests</p>
                  </div>

                  <form action={updateProfile} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0f1111] mb-1">
                        Full Name:
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        defaultValue={profile.full_name || ""}
                        required
                        className="w-full text-xs p-2 rounded border border-[#888c8c] focus:ring-1 focus:ring-[#e77600]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0f1111] mb-1">
                        Phone / WhatsApp (+230 Mauritius):
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        defaultValue={profile.phone || ""}
                        placeholder="5555 0199"
                        className="w-full text-xs p-2 rounded border border-[#888c8c] focus:ring-1 focus:ring-[#e77600]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 px-4 rounded-full btn-amazon-secondary text-xs font-semibold cursor-pointer"
                    >
                      Update Details
                    </button>
                  </form>
                </div>

                {/* Add Vehicle to Garage */}
                <div className="amazon-card p-5 bg-white space-y-4 rounded-lg" id="garage">
                  <div className="border-b border-[#f0f0f0] pb-3">
                    <h2 className="text-base font-bold text-[#0f1111]">Register Vehicle in Garage</h2>
                    <p className="text-xs text-[#565959]">Required for automated parts fitment checks</p>
                  </div>

                  <form action={addVehicle} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0f1111] mb-1">
                        Suzuki Model:
                      </label>
                      <select
                        name="model"
                        required
                        className="w-full text-xs p-2 rounded border border-[#888c8c] bg-white focus:ring-1 focus:ring-[#e77600]"
                      >
                        {SUZUKI_MODELS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-[#0f1111] mb-1">
                          Year:
                        </label>
                        <select
                          name="year"
                          required
                          defaultValue={currentYear}
                          className="w-full text-xs p-2 rounded border border-[#888c8c] bg-white focus:ring-1 focus:ring-[#e77600]"
                        >
                          {years.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#0f1111] mb-1">
                          Plate / Reg #:
                        </label>
                        <input
                          type="text"
                          name="registration_no"
                          placeholder="Optional"
                          className="w-full text-xs p-2 rounded border border-[#888c8c] focus:ring-1 focus:ring-[#e77600] uppercase"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 px-4 rounded-full btn-amazon-secondary text-xs font-semibold cursor-pointer"
                    >
                      Register Vehicle in Garage
                    </button>
                  </form>
                </div>

                {/* My Garage */}
                <div className="amazon-card p-5 bg-white space-y-4 rounded-lg">
                  <div className="border-b border-[#f0f0f0] pb-3 flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#0f1111] flex items-center gap-2">
                      <Car className="w-5 h-5 text-[#c7511f]" />
                      <span>My Registered Vehicles ({vehicles.length})</span>
                    </h2>
                  </div>

                  {vehicles.length === 0 ? (
                    <p className="text-xs text-[#565959] italic">No vehicles in garage yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {vehicles.map((v) => (
                        <div
                          key={v.id}
                          className="p-3.5 rounded-lg border border-[#e7e7e7] bg-[#f7fafa] flex items-center justify-between"
                        >
                          <div>
                            <h3 className="font-bold text-sm text-[#0f1111]">
                              {v.year} {v.make} {v.model}
                            </h3>
                            <p className="text-xs text-[#565959] font-mono mt-0.5">
                              {v.registration_no ? `Registration: ${v.registration_no}` : "Plate unlisted"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/home?model=${encodeURIComponent(v.model)}`}
                              className="text-xs text-[#007185] hover:text-[#c7511f] font-semibold"
                            >
                              Find Parts →
                            </Link>
                            <form action={deleteVehicle}>
                              <input type="hidden" name="vehicle_id" value={v.id} />
                              <button
                                type="submit"
                                className="p-1.5 text-[#565959] hover:text-[#d9381e] transition-colors cursor-pointer"
                                title="Remove vehicle"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </form>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-6">
                {/* Guest Session Card */}
                <div className="amazon-card p-5 bg-white space-y-3.5 rounded-lg">
                  <div className="border-b border-[#f0f0f0] pb-3">
                    <h2 className="text-base font-bold text-[#0f1111]">Guest Quotation Session</h2>
                    <p className="text-xs text-[#565959]">Parts inquiries are saved in this browser</p>
                  </div>
                  <p className="text-xs text-[#565959] leading-relaxed">
                    You can add any genuine parts into your quotation portal. Sign in with Google to sync inquiries across your phone and laptop, and receive direct WhatsApp fitment confirmations from the Phoenix parts desk.
                  </p>
                  <Link
                    href="/login"
                    className="w-full py-2.5 px-4 rounded-full btn-amazon-primary text-xs font-bold text-[#0f1111] flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Sign In with Google</span>
                  </Link>
                </div>

                {/* Dealership Depots Reassurance */}
                <div className="amazon-card p-5 bg-white space-y-3 rounded-lg text-xs">
                  <h3 className="font-bold text-[#0f1111] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#2b8a3e]" />
                    <span>Authorized Phoenix & Port Louis Depots</span>
                  </h3>
                  <p className="text-[#565959] leading-relaxed">
                    Counter pickup or islandwide courier dispatch. All parts verified against official Suzuki electronic parts catalogues (EPC).
                  </p>
                  <div className="pt-2 border-t border-[#f0f0f0] space-y-2">
                    <a
                      href="https://wa.me/2305550199"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 px-3 rounded-full bg-[#25d366]/10 text-[#075e54] hover:bg-[#25d366]/20 font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#25d366]" />
                      <span>WhatsApp Parts Desk (+230 555-0199)</span>
                    </a>
                    <a
                      href="tel:+2305550199"
                      className="w-full py-2 px-3 rounded-full bg-[#f3f3f3] hover:bg-[#e7e7e7] text-[#0f1111] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#565959]" />
                      <span>Call Phoenix Parts Counter</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Part request details (7 cols) */}
          <div className="lg:col-span-7 space-y-6" id="inquiries">
            <div className="amazon-card p-5 bg-white space-y-4 rounded-lg">
              <div className="border-b border-[#f0f0f0] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#0f1111] flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#f08804]" />
                    <span>Part Requests & Dealer Follow-up</span>
                  </h2>
                  <p className="text-xs text-[#565959]">
                    Official parts quotations, VIN verification & Phoenix warehouse collection
                  </p>
                </div>
                <Link
                  href="/home#all-parts"
                  className="text-xs font-semibold text-[#007185] hover:text-[#c7511f] hover:underline"
                >
                  + Enquire More Parts
                </Link>
              </div>

              {/* Inquiries List (Database or Guest Cookie) */}
              {inquiries.length > 0 && (
                <div className="space-y-4">
                  {inquiries.map((inq) => {
                    const isNew = inq.status === "new";
                    const isContacted = inq.status === "contacted";
                    const isClosed = inq.status === "closed";
                    const txnCode = `REQ-MU-${inq.id.replace("guest-inq-", "").substring(0, 6).toUpperCase()}`;

                    return (
                      <div
                        key={inq.id}
                        className="p-5 rounded-lg border border-[#d5d9d9] bg-white space-y-4 shadow-xs hover:border-[#b8ddf8] transition-all"
                      >
                        {/* Transaction Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0f0f0] pb-3 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#0f1111] text-sm">
                              {txnCode}
                            </span>
                            <span className="text-[#565959] text-[11px]">
                              Logged on {new Date(inq.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-full font-bold text-[11px] uppercase tracking-wider ${
                                isNew
                                  ? "bg-[#fff8e7] text-[#b12704] border border-[#fbd88e]"
                                  : isContacted
                                  ? "bg-[#e8f4fd] text-[#007185] border border-[#b8ddf8]"
                                  : "bg-[#e7f4e4] text-[#2b8a3e] border border-[#b2d8b8]"
                              }`}
                            >
                              {isNew
                                ? "● Inquiry Logged (Review Pending)"
                                : isContacted
                                ? "● Dealer Quotation Dispatched"
                                : "● Request Closed"}
                            </span>

                            <InquiryRowActions inquiryId={inq.id} partId={inq.part_id} />
                          </div>
                        </div>

                        {/* Stepper Status Bar */}
                        <div className="py-2">
                          <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                            <div className="flex flex-col items-center">
                              <div className="w-5 h-5 rounded-full bg-[#2b8a3e] text-white flex items-center justify-center font-bold mb-1">
                                <Check className="w-3 h-3" />
                              </div>
                              <span className="font-bold text-[#0f1111]">Inquiry Logged</span>
                            </div>

                            <div className="flex flex-col items-center">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold mb-1 ${
                                  !isNew ? "bg-[#2b8a3e] text-white" : "bg-[#f08804] text-white"
                                }`}
                              >
                                {!isNew ? <Check className="w-3 h-3" /> : "2"}
                              </div>
                              <span className="font-bold text-[#0f1111]">Fitment Check</span>
                            </div>

                            <div className="flex flex-col items-center">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold mb-1 ${
                                  isContacted || isClosed
                                    ? "bg-[#2b8a3e] text-white"
                                    : "bg-[#e7e7e7] text-[#565959]"
                                }`}
                              >
                                {isContacted || isClosed ? <Check className="w-3 h-3" /> : "3"}
                              </div>
                              <span className="font-bold text-[#0f1111]">Official Quote</span>
                            </div>

                            <div className="flex flex-col items-center">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold mb-1 ${
                                  isClosed ? "bg-[#2b8a3e] text-white" : "bg-[#e7e7e7] text-[#565959]"
                                }`}
                              >
                                {isClosed ? <Check className="w-3 h-3" /> : "4"}
                              </div>
                              <span className="font-bold text-[#0f1111]">Request Closed</span>
                            </div>
                          </div>
                        </div>

                        {/* Part Details & Reference Quote */}
                        <div className="flex items-start gap-4 p-3 bg-[#f7fafa] rounded-lg border border-[#e7e7e7]">
                          {inq.part?.photos && inq.part.photos[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={inq.part.photos[0]}
                              alt={inq.part.name}
                              className="w-16 h-14 object-contain bg-white border rounded p-1 flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-[#0f1111] leading-tight">
                              {inq.part?.name}
                            </h4>
                            <p className="text-[11px] text-[#565959] mt-0.5">
                              OEM #{inq.part?.part_number || "EPC-Verified"} • Fitment: {inq.vehicle ? `${inq.vehicle.year} ${inq.vehicle.model}` : "Suzuki Models"}
                            </p>
                            <div className="mt-2 flex items-baseline gap-1.5">
                              <span className="text-xs text-[#565959]">Dealership Reference:</span>
                              <span className="text-base font-extrabold text-[#b12704]">
                                Rs {Number(inq.part?.price || 0).toLocaleString()}
                              </span>
                              <span className="text-[10px] text-[#565959]">MUR</span>
                            </div>
                          </div>
                        </div>

                        {/* Customer note */}
                        {inq.message && (
                          <p className="text-[11px] text-[#565959] italic bg-white p-2.5 rounded border border-[#e7e7e7]">
                            <strong>Your note:</strong> &ldquo;{inq.message}&rdquo;
                          </p>
                        )}

                        {/* Dealership Advisor Note & Contact Action */}
                        <div className="p-3 bg-[#e8f4fd] rounded border border-[#b8ddf8] text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#007185]">
                              Advisor: Arnaud L. (Phoenix Main Depot)
                            </span>
                            <span className="text-[11px] text-[#565959]">
                              Desk: +230 555-0199
                            </span>
                          </div>
                          <p className="text-[#0f1111] text-[11px] leading-relaxed">
                            {inq.admin_notes ||
                              "Inquiry registered in EPC inventory. Dealership parts advisor is cross-referencing right-hand-drive fitment. Official quote dispatched via WhatsApp shortly."}
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <a
                              href={`https://wa.me/2305550199?text=${encodeURIComponent(
                                `Hello Suzuki Mauritius, following up on inquiry ${txnCode} for ${inq.part?.name} (OEM #${inq.part?.part_number || "OEM"})`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-full btn-amazon-primary text-[11px] font-bold text-[#0f1111] inline-flex items-center gap-1.5 shadow-xs"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp Parts Desk</span>
                            </a>
                            <a
                              href="tel:+2305550199"
                              className="px-3 py-1.5 rounded-full bg-white border border-[#d5d9d9] hover:bg-[#f3f3f3] text-[11px] font-semibold text-[#0f1111] inline-flex items-center gap-1.5"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Call Depot</span>
                            </a>
                            <Link
                              href={`/parts/${inq.part_id}`}
                              className="px-3 py-1.5 rounded-full bg-white border border-[#d5d9d9] hover:bg-[#f3f3f3] text-[11px] font-semibold text-[#007185] inline-flex items-center gap-1.5 ml-auto"
                            >
                              <span>View Item Specs →</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Honest empty state: never show made-up customer activity. */}
              {inquiries.length === 0 && (
                <div className="rounded-2xl border border-[#e3e6e8] bg-[#f7f8f9] px-5 py-10 text-center">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#e30613]/10 text-[#c90010]">
                    <Send className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-[#17191d]">No part requests yet</h3>
                  <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#626870]">
                    Browse the dealer catalog and send a request when you find a part you need. No payment is taken online.
                  </p>
                  <Link
                    href="/home#all-parts"
                    className="btn-amazon-primary mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 text-xs"
                  >
                    <span>Browse available parts</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
