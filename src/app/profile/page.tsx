import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile, getUserVehicles, createSupabaseServerClient } from "@/lib/supabase/server";
import { CustomerNavbar } from "@/components/customer/Navbar";
import { updateProfile, addVehicle, deleteVehicle } from "./actions";
import { SUZUKI_MODELS } from "@/lib/types";
import type { InquiryWithDetails } from "@/lib/types";
import {
  Car,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Check,
  Phone,
  MessageSquare,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
}

// Sample demonstration transactions if user has 0 inquiries
const DEMO_TRANSACTIONS = [
  {
    id: "demo-1",
    txnCode: "TXN-MU-2026-8812",
    date: "Sep 09, 2026",
    partName: "Front Bumper Assembly (Factory Gray Primer)",
    partNumber: "71711-53R00-799",
    photo: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80",
    vehicleName: "2024 Suzuki Swift Sport 1.4L Boosterjet",
    status: "quoted",
    priceMur: 18500,
    advisorName: "Arnaud L. (Phoenix Parts Desk)",
    depot: "Phoenix Main Hub (Pickup Ready)",
    message: "Need replacement front bumper for Swift Sport. Please confirm if it includes fog lamp bezels.",
    adminNotes: "Unboxed and verified for surface trueness in gray electro-primer. Fog lamp bezels included. Ready for pickup or transfer to Phoenix AutoPaint.",
  },
  {
    id: "demo-2",
    txnCode: "TXN-MU-2026-6490",
    date: "Sep 05, 2026",
    partName: "Jimny JB74 Heavy-Duty Snorkel & Breather Kit",
    partNumber: "99000-990YB-SNK",
    photo: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80",
    vehicleName: "2023 Suzuki Jimny 1.5L AllGrip Pro",
    status: "closed",
    priceMur: 14200,
    advisorName: "Dev K. (Port Louis Branch)",
    depot: "Port Louis Harbour Branch",
    message: "Preparing for Chamarel and Black River trail season. Confirm A-pillar template included.",
    adminNotes: "Customer collected at Port Louis counter. Complete stainless hardware & cut template verified.",
  },
];

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const { saved, error } = await searchParams;
  const vehicles = await getUserVehicles(profile.id);
  const supabase = await createSupabaseServerClient();

  // Fetch inquiries joined with parts and vehicles
  const { data: rawInquiries } = supabase
    ? await supabase
        .from("inquiries")
        .select("*, part:parts(*), vehicle:vehicles(*)")
        .eq("customer_id", profile.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const inquiries = (rawInquiries as InquiryWithDetails[]) || [];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-[#eaeded] flex flex-col font-sans selection:bg-[#ffd814] selection:text-black">
      <CustomerNavbar
        profile={profile}
        vehicleCount={vehicles.length}
        inquiryCount={inquiries.length}
      />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || "Avatar"}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                profile.full_name?.charAt(0) || "S"
              )}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0f1111]">
                Your Account & Mauritius Garage
              </h1>
              <p className="text-xs text-[#565959]">{profile.email} • Verified Google Driver</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#e7f4e4] text-[#2b8a3e] text-xs font-bold flex items-center gap-1 border border-[#b2d8b8]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Mauritius Network Member</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Contact Form & Add Vehicle (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Contact Details */}
            <div className="amazon-card p-5 bg-white space-y-4 rounded-lg">
              <div className="border-b border-[#f0f0f0] pb-3">
                <h2 className="text-base font-bold text-[#0f1111]">Dealership Contact Details</h2>
                <p className="text-xs text-[#565959]">Used by parts specialists to confirm offline orders</p>
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
                    placeholder="+230 5..."
                    className="w-full text-xs p-2 rounded border border-[#888c8c] focus:ring-1 focus:ring-[#e77600]"
                  />
                  <p className="text-[11px] text-[#565959] mt-1">
                    Dealership advisors message this number directly with parts quotes and availability.
                  </p>
                </div>

                <button
                  type="submit"
                  className="py-2 px-4 rounded-full btn-amazon-primary text-xs font-semibold cursor-pointer"
                >
                  Save Changes
                </button>
              </form>
            </div>

            {/* Add Vehicle Form */}
            <div className="amazon-card p-5 bg-white space-y-4 rounded-lg" id="garage">
              <div className="border-b border-[#f0f0f0] pb-3">
                <h2 className="text-base font-bold text-[#0f1111] flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-[#c7511f]" />
                  <span>Add Vehicle to Garage</span>
                </h2>
                <p className="text-xs text-[#565959]">Register your Suzuki car for fast fitment matching</p>
              </div>

              <form action={addVehicle} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#0f1111] mb-1">
                    Model:
                  </label>
                  <select
                    name="model"
                    required
                    defaultValue=""
                    className="w-full text-xs p-2 rounded border border-[#888c8c] bg-white focus:ring-1 focus:ring-[#e77600]"
                  >
                    <option value="" disabled>Select your Suzuki</option>
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
          </div>

          {/* Right Column: Inquiries & Transaction Details (7 cols) */}
          <div className="lg:col-span-7 space-y-6" id="inquiries">
            <div className="amazon-card p-5 bg-white space-y-4 rounded-lg">
              <div className="border-b border-[#f0f0f0] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#0f1111] flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#f08804]" />
                    <span>My Inquiries & Transaction Tracking</span>
                  </h2>
                  <p className="text-xs text-[#565959]">
                    Official quotation logs, chassis fitment verification & pickup depot readiness
                  </p>
                </div>
                <Link
                  href="/home"
                  className="text-xs font-semibold text-[#007185] hover:text-[#c7511f] hover:underline"
                >
                  + New Part Enquiry
                </Link>
              </div>

              {/* Real User Inquiries (if any) */}
              {inquiries.length > 0 && (
                <div className="space-y-4">
                  {inquiries.map((inq) => {
                    const isNew = inq.status === "new";
                    const isContacted = inq.status === "contacted";
                    const isClosed = inq.status === "closed";
                    const txnCode = `TXN-MU-2026-${inq.id.substring(0, 6).toUpperCase()}`;

                    return (
                      <div
                        key={inq.id}
                        className="p-5 rounded-lg border border-[#d5d9d9] bg-white space-y-4 shadow-xs"
                      >
                        {/* Transaction Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0f0f0] pb-3 text-xs">
                          <div>
                            <span className="font-mono font-bold text-[#0f1111] text-sm">
                              {txnCode}
                            </span>
                            <span className="text-[#565959] ml-2 text-[11px]">
                              Logged on {new Date(inq.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </div>

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
                              ? "● Pending Dealership Review"
                              : isContacted
                              ? "● Dealer Quotation Dispatched"
                              : "● Fulfilled & Collected"}
                          </span>
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
                              <span className="font-bold text-[#0f1111]">Pickup Ready</span>
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
                              OEM #{inq.part?.part_number || "EPC-Verified"} • Fitment: {inq.vehicle ? `${inq.vehicle.year} ${inq.vehicle.model}` : "Universal"}
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
                          <div className="flex gap-2 pt-1">
                            <a
                              href={`https://wa.me/2305550199?text=${encodeURIComponent(
                                `Hello Suzuki Mauritius, following up on inquiry ${txnCode} for ${inq.part?.name}`
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
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Demonstration Transaction Records Section (Shows authentic sample logs if user has 0 inquiries or as reference) */}
              {inquiries.length === 0 && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded bg-[#fff8e7] border border-[#fbd88e] text-xs text-[#855b00]">
                    <strong>No active customer inquiries yet.</strong> Below is an example of your official transaction quotation logs once you enquire about any genuine parts:
                  </div>

                  {DEMO_TRANSACTIONS.map((txn) => (
                    <div
                      key={txn.id}
                      className="p-5 rounded-lg border border-[#d5d9d9] bg-white space-y-4 shadow-xs"
                    >
                      {/* Transaction Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0f0f0] pb-3 text-xs">
                        <div>
                          <span className="font-mono font-bold text-[#0f1111] text-sm">
                            {txn.txnCode}
                          </span>
                          <span className="text-[#565959] ml-2 text-[11px]">
                            Logged on {txn.date}
                          </span>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[11px] uppercase tracking-wider ${
                            txn.status === "quoted"
                              ? "bg-[#e8f4fd] text-[#007185] border border-[#b8ddf8]"
                              : "bg-[#e7f4e4] text-[#2b8a3e] border border-[#b2d8b8]"
                          }`}
                        >
                          {txn.status === "quoted"
                            ? "● Official Quotation Dispatched"
                            : "● Fulfilled & Collected at Depot"}
                        </span>
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
                            <div className="w-5 h-5 rounded-full bg-[#2b8a3e] text-white flex items-center justify-center font-bold mb-1">
                              <Check className="w-3 h-3" />
                            </div>
                            <span className="font-bold text-[#0f1111]">Fitment Checked</span>
                          </div>

                          <div className="flex flex-col items-center">
                            <div className="w-5 h-5 rounded-full bg-[#2b8a3e] text-white flex items-center justify-center font-bold mb-1">
                              <Check className="w-3 h-3" />
                            </div>
                            <span className="font-bold text-[#0f1111]">Quote Issued</span>
                          </div>

                          <div className="flex flex-col items-center">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold mb-1 ${
                                txn.status === "closed" ? "bg-[#2b8a3e] text-white" : "bg-[#f08804] text-white"
                              }`}
                            >
                              {txn.status === "closed" ? <Check className="w-3 h-3" /> : "4"}
                            </div>
                            <span className="font-bold text-[#0f1111]">
                              {txn.status === "closed" ? "Collected" : "Ready at Phoenix"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Part Details & Reference Quote */}
                      <div className="flex items-start gap-4 p-3 bg-[#f7fafa] rounded-lg border border-[#e7e7e7]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={txn.photo}
                          alt={txn.partName}
                          className="w-16 h-14 object-cover bg-white border rounded p-1 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-[#0f1111] leading-tight">
                            {txn.partName}
                          </h4>
                          <p className="text-[11px] text-[#565959] mt-0.5">
                            OEM #{txn.partNumber} • Fitment: {txn.vehicleName}
                          </p>
                          <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-xs text-[#565959]">Dealership Quoted Price:</span>
                            <span className="text-base font-extrabold text-[#b12704]">
                              Rs {txn.priceMur.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-[#565959]">MUR (VAT incl.)</span>
                          </div>
                        </div>
                      </div>

                      {/* Customer Note */}
                      <p className="text-[11px] text-[#565959] italic bg-white p-2.5 rounded border border-[#e7e7e7]">
                        <strong>Customer inquiry note:</strong> &ldquo;{txn.message}&rdquo;
                      </p>

                      {/* Dealership Advisor Note & Contact Action */}
                      <div className="p-3 bg-[#e8f4fd] rounded border border-[#b8ddf8] text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#007185]">
                            Advisor: {txn.advisorName}
                          </span>
                          <span className="text-[11px] text-[#565959]">
                            Depot: {txn.depot}
                          </span>
                        </div>
                        <p className="text-[#0f1111] text-[11px] leading-relaxed">
                          <strong>Official Advisor Note:</strong> {txn.adminNotes}
                        </p>
                        <div className="flex gap-2 pt-1">
                          <a
                            href={`https://wa.me/2305550199?text=${encodeURIComponent(
                              `Hello Suzuki Mauritius, following up on inquiry ${txn.txnCode}`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-full btn-amazon-primary text-[11px] font-bold text-[#0f1111] inline-flex items-center gap-1.5 shadow-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp Parts Desk (+230 555-0199)</span>
                          </a>
                          <Link
                            href="/home"
                            className="px-3 py-1.5 rounded-full bg-white border border-[#d5d9d9] hover:bg-[#f3f3f3] text-[11px] font-semibold text-[#0f1111]"
                          >
                            Enquire Another Part →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
