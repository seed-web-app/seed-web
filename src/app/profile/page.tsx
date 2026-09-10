import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile, getUserVehicles, createSupabaseServerClient } from "@/lib/supabase/server";
import { CustomerNavbar } from "@/components/customer/Navbar";
import { updateProfile, addVehicle, deleteVehicle } from "./actions";
import { SUZUKI_MODELS } from "@/lib/types";
import type { InquiryWithDetails } from "@/lib/types";
import {
  User,
  Car,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  ShieldCheck,
  Tag,
  MessageSquare,
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
    <div className="min-h-screen bg-carbon-pattern flex flex-col selection:bg-suzuki-red selection:text-white">
      <CustomerNavbar profile={profile} vehicleCount={vehicles.length} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Alerts */}
        {saved && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              {saved === "profile"
                ? "Profile information saved successfully."
                : saved === "vehicle_added"
                ? "New Suzuki vehicle registered to your garage."
                : "Vehicle removed from your garage."}
            </span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>Operation failed. Please try again.</span>
          </div>
        )}

        {/* Top Header */}
        <div className="border-b border-white/10 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Customer Garage & Inquiries
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your personal info, registered Suzuki models, and live status of requested parts.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-suzuki-slate border border-white/10 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verified Google Account</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Profile Info & Add Vehicle (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Profile Info Form */}
            <div className="rounded-3xl bg-glass border border-white/10 p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-suzuki-red/15 text-suzuki-brightred flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Owner Contact Info</h2>
                  <p className="text-xs text-slate-400">Used by dealer specialists for lead dispatch</p>
                </div>
              </div>

              <form action={updateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    defaultValue={profile.full_name || ""}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Google Account Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={profile.email || ""}
                      readOnly
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-suzuki-slate/50 border border-white/5 text-slate-400 text-xs sm:text-sm cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Managed via Google OAuth</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone / WhatsApp Contact
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={profile.phone || ""}
                      placeholder="+1 (555) 019-2834"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:border-suzuki-red focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer border border-white/10"
                >
                  Save Contact Info
                </button>
              </form>
            </div>

            {/* Add Another Vehicle Form */}
            <div className="rounded-3xl bg-glass border border-white/10 p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Add Vehicle to Garage</h2>
                  <p className="text-xs text-slate-400">Register secondary Suzuki cars</p>
                </div>
              </div>

              <form action={addVehicle} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Model
                  </label>
                  <select
                    name="model"
                    required
                    defaultValue=""
                    className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none transition-colors"
                  >
                    <option value="" disabled className="bg-suzuki-black text-slate-400">
                      Select model
                    </option>
                    {SUZUKI_MODELS.map((m) => (
                      <option key={m} value={m} className="bg-suzuki-black text-white">
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Year
                    </label>
                    <select
                      name="year"
                      required
                      defaultValue={currentYear}
                      className="w-full px-3 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none transition-colors"
                    >
                      {years.map((y) => (
                        <option key={y} value={y} className="bg-suzuki-black text-white">
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Plate / Reg #
                    </label>
                    <input
                      type="text"
                      name="registration_no"
                      placeholder="Optional"
                      className="w-full px-3 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:border-suzuki-red focus:outline-none transition-colors uppercase"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-suzuki-red hover:bg-suzuki-brightred text-white text-xs font-bold transition-colors shadow-md shadow-suzuki-red/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Vehicle</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Registered Vehicles & Past Inquiries (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Garage Vehicles List */}
            <div className="rounded-3xl bg-glass border border-white/10 p-6 sm:p-7 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Car className="w-5 h-5 text-suzuki-red" />
                  <span>My Registered Vehicles ({vehicles.length})</span>
                </h2>
              </div>

              {vehicles.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white/5 text-center text-xs text-slate-400">
                  No vehicles registered yet. Use the form on the left to add your Suzuki.
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="p-4 rounded-2xl bg-suzuki-slate/80 border border-white/10 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-suzuki-red/10 border border-suzuki-red/20 flex items-center justify-center text-suzuki-red font-bold text-sm">
                          S
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">
                            {v.year} {v.make} {v.model}
                          </h3>
                          <p className="text-xs font-mono text-slate-400">
                            {v.registration_no ? `Reg: ${v.registration_no}` : "Plate unlisted"}
                          </p>
                        </div>
                      </div>

                      <form action={deleteVehicle}>
                        <input type="hidden" name="vehicle_id" value={v.id} />
                        <button
                          type="submit"
                          title="Remove Vehicle"
                          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
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
            <div className="rounded-3xl bg-glass border border-white/10 p-6 sm:p-7 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span>Requested Parts & Inquiries ({inquiries.length})</span>
                </h2>
              </div>

              {inquiries.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/5 text-center space-y-3">
                  <Package className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400">
                    You have not submitted any part inquiries yet.
                  </p>
                  <Link
                    href="/home"
                    className="inline-block px-4 py-2 rounded-xl bg-suzuki-red text-white text-xs font-bold"
                  >
                    Browse Catalog
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {inquiries.map((inq) => {
                    const createdDate = new Date(inq.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });

                    return (
                      <div
                        key={inq.id}
                        className="p-5 rounded-2xl bg-suzuki-slate/80 border border-white/10 space-y-3"
                      >
                        {/* Header status */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                                inq.status === "new"
                                  ? "bg-amber-500/15 border border-amber-500/40 text-amber-300"
                                  : inq.status === "contacted"
                                  ? "bg-blue-500/15 border border-blue-500/40 text-blue-300"
                                  : "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300"
                              }`}
                            >
                              {inq.status === "new"
                                ? "● Pending Dealer Review"
                                : inq.status === "contacted"
                                ? "● Dealer Contacted"
                                : "● Inquiry Closed / Fulfilled"}
                            </span>
                            <span className="text-[11px] text-slate-500">{createdDate}</span>
                          </div>

                          {inq.part && (
                            <Link
                              href={`/parts/${inq.part.id}`}
                              className="text-xs font-bold text-suzuki-brightred hover:underline"
                            >
                              View Part →
                            </Link>
                          )}
                        </div>

                        {/* Part Summary */}
                        <div className="flex items-start gap-3.5 pt-1">
                          {inq.part?.photos && inq.part.photos[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={inq.part.photos[0]}
                              alt={inq.part.name}
                              className="w-14 h-12 rounded-lg object-cover bg-suzuki-black border border-white/10 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-12 rounded-lg bg-suzuki-black flex items-center justify-center text-slate-600 text-xs">
                              OEM
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white truncate">
                              {inq.part?.name || "Requested Part"}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                              {inq.part?.price && (
                                <span className="flex items-center gap-1 font-semibold text-slate-300">
                                  <Tag className="w-3 h-3 text-emerald-400" />
                                  ${Number(inq.part.price).toFixed(2)} Ref
                                </span>
                              )}
                              {inq.vehicle && (
                                <span className="flex items-center gap-1 text-slate-400">
                                  <Car className="w-3 h-3 text-suzuki-red" />
                                  {inq.vehicle.year} {inq.vehicle.model}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Customer note if any */}
                        {inq.message && (
                          <div className="p-3 rounded-xl bg-white/5 text-xs text-slate-300 flex items-start gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                            <p className="italic">{inq.message}</p>
                          </div>
                        )}

                        {/* Dealer update / admin notes if any */}
                        {inq.admin_notes && (
                          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200">
                            <span className="font-bold text-blue-300 block mb-0.5">
                              Dealer Staff Update:
                            </span>
                            <p>{inq.admin_notes}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
