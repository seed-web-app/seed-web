import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile, Vehicle, InquiryWithDetails } from "@/lib/types";
import {
  Users,
  Search,
  Car,
  Clock,
  Phone,
  Mail,
  X,
  Tag,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface AdminUsersPageProps {
  searchParams: Promise<{
    q?: string;
    id?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const { q, id } = await searchParams;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  // 1. Fetch all profiles with their vehicles & inquiries
  const { data: rawProfiles } = await supabase
    .from("profiles")
    .select("*, vehicles(*), inquiries(*)")
    .order("created_at", { ascending: false });

  let customers = (rawProfiles as (Profile & { vehicles: Vehicle[]; inquiries: unknown[] })[]) || [];

  if (q) {
    const term = q.toLowerCase();
    customers = customers.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.phone?.includes(term)
    );
  }

  // Selected customer details
  let selectedCustomer:
    | (Profile & {
        vehicles: Vehicle[];
        inquiries: InquiryWithDetails[];
      })
    | null = null;

  if (id) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (profileData) {
      const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("*")
        .eq("owner_id", id)
        .order("created_at", { ascending: false });

      const { data: inquiriesData } = await supabase
        .from("inquiries")
        .select("*, part:parts(*), vehicle:vehicles(*)")
        .eq("customer_id", id)
        .order("created_at", { ascending: false });

      selectedCustomer = {
        ...(profileData as Profile),
        vehicles: (vehiclesData as Vehicle[]) || [],
        inquiries: (inquiriesData as InquiryWithDetails[]) || [],
      };
    }
  }

  return (
    <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 text-blue-400" />
            <span>Registered Suzuki Customers</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Directory of verified Suzuki owners, garage vehicle models, and lifetime inquiries.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-glass border border-white/10">
        <form method="get" className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            name="q"
            defaultValue={q || ""}
            placeholder="Search by customer name, email, or phone number..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-suzuki-slate/90 border border-white/10 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-suzuki-red focus:outline-none"
          />
        </form>
      </div>

      {/* Customers Table */}
      <div className="rounded-3xl bg-glass border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-suzuki-slate/80 text-[11px] uppercase font-bold text-slate-400 border-b border-white/10 tracking-wider">
              <tr>
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-4">Contact Phone</th>
                <th className="py-4 px-4">Role</th>
                <th className="py-4 px-4">Garage Vehicles</th>
                <th className="py-4 px-4">Total Inquiries</th>
                <th className="py-4 px-4">Joined Date</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No customers found matching your query.
                  </td>
                </tr>
              ) : (
                customers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-suzuki-slate border border-white/10 flex items-center justify-center font-bold text-xs text-slate-200 overflow-hidden flex-shrink-0">
                          {cust.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={cust.avatar_url}
                              alt={cust.full_name || "Customer"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            cust.full_name?.charAt(0) || "U"
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-white truncate">
                            {cust.full_name || "Customer"}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{cust.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-xs">
                      {cust.phone || <span className="text-slate-600">Unlisted</span>}
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          cust.role === "admin"
                            ? "bg-suzuki-red/20 text-suzuki-brightred border border-suzuki-red/30"
                            : "bg-slate-700/40 text-slate-300"
                        }`}
                      >
                        {cust.role}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-suzuki-red" />
                        <span>{cust.vehicles?.length || 0}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{cust.inquiries?.length || 0}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-500 text-[11px] font-mono">
                      {new Date(cust.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/admin/users?id=${cust.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-suzuki-slate hover:bg-slate-700 text-white text-xs font-bold border border-white/10 transition-colors"
                      >
                        <span>View Garage</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-suzuki-carbon border border-white/10 rounded-3xl p-6 sm:p-8 max-w-3xl w-full my-8 shadow-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-suzuki-slate border border-white/10 flex items-center justify-center text-sm font-bold text-white overflow-hidden">
                  {selectedCustomer.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedCustomer.avatar_url}
                      alt={selectedCustomer.full_name || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    selectedCustomer.full_name?.charAt(0) || "U"
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {selectedCustomer.full_name || "Customer Details"}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1 font-mono">
                      <Mail className="w-3.5 h-3.5" />
                      {selectedCustomer.email}
                    </span>
                    {selectedCustomer.phone && (
                      <span className="flex items-center gap-1 font-mono text-emerald-400">
                        <Phone className="w-3.5 h-3.5" />
                        {selectedCustomer.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Link href="/admin/users" className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </Link>
            </div>

            {/* Garage Vehicles Section */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <Car className="w-4 h-4 text-suzuki-red" />
                <span>Registered Vehicles in Garage ({selectedCustomer.vehicles.length})</span>
              </h3>

              {selectedCustomer.vehicles.length === 0 ? (
                <div className="p-4 rounded-xl bg-white/5 text-xs text-slate-500 text-center">
                  No vehicles registered in garage.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedCustomer.vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="p-3.5 rounded-2xl bg-suzuki-slate/70 border border-white/10"
                    >
                      <p className="font-bold text-sm text-white">
                        {v.year} {v.make} {v.model}
                      </p>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">
                        Plate: {v.registration_no || "Unregistered plate"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Full Inquiry History */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Customer Inquiry History ({selectedCustomer.inquiries.length})</span>
              </h3>

              {selectedCustomer.inquiries.length === 0 ? (
                <div className="p-4 rounded-xl bg-white/5 text-xs text-slate-500 text-center">
                  Customer has not submitted any part inquiries.
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {selectedCustomer.inquiries.map((inq) => (
                    <div
                      key={inq.id}
                      className="p-4 rounded-2xl bg-suzuki-slate/60 border border-white/10 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              inq.status === "new"
                                ? "bg-amber-500/20 text-amber-300"
                                : inq.status === "contacted"
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            {inq.status}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(inq.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {inq.part && (
                          <span className="text-xs font-bold text-white flex items-center gap-1">
                            <Tag className="w-3 h-3 text-emerald-400" />
                            ${Number(inq.part.price).toFixed(2)} Ref
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-bold text-white">
                        {inq.part?.name || "Requested Part"}
                      </p>

                      {inq.message && (
                        <p className="text-xs text-slate-300 italic pl-2 border-l border-white/10">
                          &ldquo;{inq.message}&rdquo;
                        </p>
                      )}

                      {inq.admin_notes && (
                        <p className="text-xs text-blue-300 bg-blue-500/10 p-2 rounded-lg">
                          <span className="font-semibold">Dealer note:</span> {inq.admin_notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <Link
                href="/admin/users"
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors"
              >
                Close Customer Profile
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
