import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InquiryWithDetails, Profile } from "@/lib/types";
import {
  Users,
  Car,
  Package,
  Inbox,
  ArrowRight,
  Clock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

function getOneWeekAgoTimestamp(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  // 1. Fetch counts
  const { count: customerCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "customer");

  const { count: vehicleCount } = await supabase
    .from("vehicles")
    .select("id", { count: "exact", head: true });

  const { count: partCount } = await supabase
    .from("parts")
    .select("id", { count: "exact", head: true });

  // Inquiries this week
  const oneWeekAgo = getOneWeekAgoTimestamp();
  const { count: inquiriesThisWeek } = await supabase
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .gte("created_at", oneWeekAgo);

  // Inquiry breakdown counts
  const { count: newInquiriesCount } = await supabase
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  const { count: contactedInquiriesCount } = await supabase
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("status", "contacted");

  const { count: closedInquiriesCount } = await supabase
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("status", "closed");

  // Recent 10 Inquiries with details
  const { data: rawRecentInquiries } = await supabase
    .from("inquiries")
    .select("*, customer:profiles(*), vehicle:vehicles(*), part:parts(*)")
    .order("created_at", { ascending: false })
    .limit(10);

  const recentInquiries = (rawRecentInquiries as InquiryWithDetails[]) || [];

  // Recent 10 Customers
  const { data: rawRecentCustomers } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "customer")
    .order("created_at", { ascending: false })
    .limit(10);

  const recentCustomers = (rawRecentCustomers as Profile[]) || [];

  return (
    <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Dealership Network Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time overview of Suzuki owners, registered vehicles, inventory catalog, and inquiry leads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/parts"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-suzuki-red hover:bg-suzuki-brightred text-white text-xs font-bold shadow-md shadow-suzuki-red/20 transition-all cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>Manage Parts</span>
          </Link>
          <Link
            href="/admin/inquiries"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-suzuki-slate hover:bg-slate-700 text-white text-xs font-bold border border-white/10 transition-all cursor-pointer"
          >
            <Inbox className="w-4 h-4 text-amber-400" />
            <span>View Inquiries</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-glass-card border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Customers
            </p>
            <h3 className="text-3xl font-black text-white mt-1">
              {customerCount ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Verified Google accounts</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-glass-card border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Registered Vehicles
            </p>
            <h3 className="text-3xl font-black text-white mt-1">
              {vehicleCount ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">In customer garages</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-suzuki-red/10 text-suzuki-red flex items-center justify-center">
            <Car className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-glass-card border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Parts Listed
            </p>
            <h3 className="text-3xl font-black text-white mt-1">
              {partCount ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Active OEM catalog items</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-glass-card border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              New Leads This Week
            </p>
            <h3 className="text-3xl font-black text-amber-400 mt-1">
              {inquiriesThisWeek ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Past 7 days volume</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Inquiry Status Breakdown */}
      <div className="p-6 rounded-3xl bg-glass border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Inbox className="w-5 h-5 text-amber-400" />
            <span>Inquiry Status Breakdown</span>
          </h2>
          <Link
            href="/admin/inquiries"
            className="text-xs font-semibold text-suzuki-brightred hover:underline"
          >
            Manage all inquiries →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                ● New / Pending Review
              </span>
              <p className="text-2xl font-black text-white mt-1">{newInquiriesCount ?? 0}</p>
              <span className="text-[11px] text-slate-400">Requires dealer follow-up</span>
            </div>
            <Clock className="w-8 h-8 text-amber-400/40" />
          </div>

          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                ● Contacted Customer
              </span>
              <p className="text-2xl font-black text-white mt-1">
                {contactedInquiriesCount ?? 0}
              </p>
              <span className="text-[11px] text-slate-400">Offline quote in progress</span>
            </div>
            <Users className="w-8 h-8 text-blue-400/40" />
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                ● Closed / Fulfilled
              </span>
              <p className="text-2xl font-black text-white mt-1">{closedInquiriesCount ?? 0}</p>
              <span className="text-[11px] text-slate-400">Order fulfilled offline</span>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-400/40" />
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent 10 Inquiries & Recent 10 Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Latest 10 Inquiries (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl bg-glass border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-suzuki-red" />
              <span>Latest Customer Inquiries (10)</span>
            </h2>
            <Link
              href="/admin/inquiries"
              className="text-xs font-bold text-slate-400 hover:text-white"
            >
              View all
            </Link>
          </div>

          {recentInquiries.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No inquiries received yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentInquiries.map((inq) => (
                <Link
                  key={inq.id}
                  href={`/admin/inquiries?id=${inq.id}`}
                  className="p-4 rounded-2xl bg-suzuki-slate/60 hover:bg-suzuki-slate border border-white/5 hover:border-white/15 flex items-center justify-between gap-4 transition-colors block"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white truncate">
                        {inq.customer?.full_name || "Customer"}
                      </span>
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
                    </div>
                    <p className="text-xs text-slate-300 truncate mt-0.5">
                      Requested: <span className="font-semibold text-white">{inq.part?.name}</span>
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Vehicle: {inq.vehicle ? `${inq.vehicle.year} ${inq.vehicle.model}` : "Unspecified"} • {new Date(inq.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Latest 10 Customers (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl bg-glass border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span>Recent Customers</span>
            </h2>
            <Link
              href="/admin/users"
              className="text-xs font-bold text-slate-400 hover:text-white"
            >
              View directory
            </Link>
          </div>

          {recentCustomers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No customers signed up yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentCustomers.map((cust) => (
                <Link
                  key={cust.id}
                  href={`/admin/users?id=${cust.id}`}
                  className="p-3 rounded-2xl bg-suzuki-slate/60 hover:bg-suzuki-slate border border-white/5 flex items-center justify-between gap-3 transition-colors block"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-suzuki-slate border border-white/10 flex items-center justify-center font-bold text-xs text-slate-300 flex-shrink-0 overflow-hidden">
                      {cust.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cust.avatar_url}
                          alt={cust.full_name || "User"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        cust.full_name?.charAt(0) || "U"
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {cust.full_name || "New Customer"}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {cust.phone || cust.email || "No phone"}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(cust.created_at).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
