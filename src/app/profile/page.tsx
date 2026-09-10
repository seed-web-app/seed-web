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
  Package,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
}

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

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
        <div className="amazon-card p-6 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              <span>Mauritius Member</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Contact Form & Add Vehicle (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Contact Details */}
            <div className="amazon-card p-5 bg-white space-y-4">
              <div className="border-b border-[#f0f0f0] pb-3">
                <h2 className="text-base font-bold text-[#0f1111]">Dealership Contact Details</h2>
                <p className="text-xs text-[#565959]">Used by parts specialists to confirm orders</p>
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
                    placeholder="e.g. +230 555-0199"
                    className="w-full text-xs p-2 rounded border border-[#888c8c] focus:ring-1 focus:ring-[#e77600]"
                  />
                  <p className="text-[11px] text-[#565959] mt-1">
                    Dealer reps will WhatsApp quotes to this phone.
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
            <div className="amazon-card p-5 bg-white space-y-4">
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
          </div>

          {/* Right Column: Registered Garage & Inquiries List (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* My Garage */}
            <div className="amazon-card p-5 bg-white space-y-4">
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
                  ))}
                </div>
              )}
            </div>

            {/* Inquiries Tracker */}
            <div className="amazon-card p-5 bg-white space-y-4">
              <div className="border-b border-[#f0f0f0] pb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-[#0f1111] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#f08804]" />
                  <span>Your Enquiries & Request Tracker ({inquiries.length})</span>
                </h2>
              </div>

              {inquiries.length === 0 ? (
                <div className="text-center py-8 space-y-2 text-xs text-[#565959]">
                  <Package className="w-8 h-8 text-[#999999] mx-auto" />
                  <p>You have not enquired about any parts yet.</p>
                  <Link
                    href="/home"
                    className="inline-block font-bold text-[#007185] hover:text-[#c7511f] hover:underline"
                  >
                    Browse Parts Catalog →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {inquiries.map((inq) => (
                    <div
                      key={inq.id}
                      className="p-4 rounded-lg border border-[#e7e7e7] bg-white space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                            inq.status === "new"
                              ? "bg-[#fff8e7] text-[#b12704] border border-[#fbd88e]"
                              : inq.status === "contacted"
                              ? "bg-[#e8f4fd] text-[#007185] border border-[#b8ddf8]"
                              : "bg-[#e7f4e4] text-[#2b8a3e] border border-[#b2d8b8]"
                          }`}
                        >
                          {inq.status === "new"
                            ? "● Pending Review"
                            : inq.status === "contacted"
                            ? "● Dealer Contacted You"
                            : "● Fulfilled / Closed"}
                        </span>
                        <span className="text-[#565959] text-[11px]">
                          {new Date(inq.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {inq.part?.photos && inq.part.photos[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={inq.part.photos[0]}
                            alt={inq.part.name}
                            className="w-12 h-10 object-contain bg-[#f7f7f7] border rounded"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-[#0f1111] truncate">
                            {inq.part?.name}
                          </h4>
                          <p className="text-[11px] text-[#565959]">
                            Ref: ${Number(inq.part?.price || 0).toFixed(2)} USD • Fits: {inq.vehicle ? `${inq.vehicle.year} ${inq.vehicle.model}` : "General"}
                          </p>
                        </div>
                      </div>

                      {inq.message && (
                        <p className="text-[11px] text-[#565959] italic bg-[#f7f7f7] p-2 rounded">
                          &ldquo;{inq.message}&rdquo;
                        </p>
                      )}

                      {inq.admin_notes && (
                        <div className="text-[11px] text-[#007185] bg-[#e8f4fd] p-2 rounded border border-[#b8ddf8]">
                          <strong>Dealership Note:</strong> {inq.admin_notes}
                        </div>
                      )}
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
