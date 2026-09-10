import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateInquiryWorkflow, deleteInquiry } from "./actions";
import type { InquiryWithDetails } from "@/lib/types";
import {
  Inbox,
  Search,
  Phone,
  MessageCircle,
  Car,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Save,
  Tag,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface AdminInquiriesPageProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
    id?: string;
    saved?: string;
    error?: string;
  }>;
}

export default async function AdminInquiriesPage({ searchParams }: AdminInquiriesPageProps) {
  const { status, q, id, saved, error } = await searchParams;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  let query = supabase
    .from("inquiries")
    .select("*, customer:profiles(*), vehicle:vehicles(*), part:parts(*)")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data: rawInquiries } = await query;
  let inquiries = (rawInquiries as InquiryWithDetails[]) || [];

  if (q) {
    const term = q.toLowerCase();
    inquiries = inquiries.filter(
      (inq) =>
        inq.customer?.full_name?.toLowerCase().includes(term) ||
        inq.part?.name.toLowerCase().includes(term) ||
        inq.customer?.phone?.includes(term)
    );
  }

  // Selected inquiry for detail modal
  let selectedInquiry: InquiryWithDetails | null = null;
  if (id) {
    selectedInquiry = inquiries.find((i) => i.id === id) || null;
    if (!selectedInquiry) {
      const { data } = await supabase
        .from("inquiries")
        .select("*, customer:profiles(*), vehicle:vehicles(*), part:parts(*)")
        .eq("id", id)
        .maybeSingle();
      selectedInquiry = data as InquiryWithDetails | null;
    }
  }

  return (
    <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-7xl w-full mx-auto">
      {/* Notifications */}
      {saved && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>
            {saved === "updated" ? "Inquiry status and admin notes updated." : "Inquiry deleted."}
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>Could not process inquiry update. Please try again.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Inbox className="w-7 h-7 text-amber-400" />
            <span>Customer Parts Inquiries</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Turn customer requests into offline sales. Direct access to customer WhatsApp, phone, and vehicle fitment.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="p-4 rounded-2xl bg-glass border border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {[
            { key: "all", label: "All Requests" },
            { key: "new", label: "New Leads", countBadge: "text-amber-300" },
            { key: "contacted", label: "Contacted", countBadge: "text-blue-300" },
            { key: "closed", label: "Closed", countBadge: "text-emerald-300" },
          ].map((tab) => {
            const isActive = (status || "all") === tab.key;
            return (
              <Link
                key={tab.key}
                href={`/admin/inquiries?status=${tab.key}${q ? `&q=${q}` : ""}`}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isActive
                    ? "bg-suzuki-red text-white shadow-md shadow-suzuki-red/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <form method="get" className="w-full sm:w-72 relative">
          <input type="hidden" name="status" value={status || "all"} />
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            name="q"
            defaultValue={q || ""}
            placeholder="Search customer, phone, part..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-suzuki-slate/90 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:border-suzuki-red focus:outline-none"
          />
        </form>
      </div>

      {/* Inquiries Table */}
      <div className="rounded-3xl bg-glass border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-suzuki-slate/80 text-[11px] uppercase font-bold text-slate-400 border-b border-white/10 tracking-wider">
              <tr>
                <th className="py-4 px-6">Customer & Phone</th>
                <th className="py-4 px-4">Vehicle Model</th>
                <th className="py-4 px-4">Part Requested</th>
                <th className="py-4 px-4">Submitted</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {inquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No customer inquiries found for this filter.
                  </td>
                </tr>
              ) : (
                inquiries.map((inq) => (
                  <tr
                    key={inq.id}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-bold text-sm text-white">
                          {inq.customer?.full_name || "Suzuki Customer"}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          {inq.customer?.phone || "No phone listed"}
                        </p>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {inq.vehicle ? (
                        <div>
                          <p className="font-semibold text-white">
                            {inq.vehicle.year} {inq.vehicle.model}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {inq.vehicle.registration_no || "Plate unlisted"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-500">Unspecified Vehicle</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        {inq.part?.photos && inq.part.photos[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={inq.part.photos[0]}
                            alt={inq.part.name}
                            className="w-10 h-8 rounded object-cover bg-suzuki-slate flex-shrink-0"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate max-w-xs">
                            {inq.part?.name || "Part"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            ${Number(inq.part?.price || 0).toFixed(2)} Ref
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-400 text-[11px] font-mono">
                      {new Date(inq.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          inq.status === "new"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : inq.status === "contacted"
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {inq.status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/admin/inquiries?id=${inq.id}${status ? `&status=${status}` : ""}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-suzuki-slate hover:bg-slate-700 text-white text-xs font-bold border border-white/10 transition-colors"
                      >
                        <span>Manage Lead</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inquiry Detail Drawer / Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-suzuki-carbon border border-white/10 rounded-3xl p-6 sm:p-8 max-w-2xl w-full my-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                  Inquiry Reference #{selectedInquiry.id.slice(0, 8)}
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  Customer Request & Status Workflow
                </h2>
              </div>
              <Link href="/admin/inquiries" className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </Link>
            </div>

            {/* Customer Contact & Quick Actions */}
            <div className="p-4 rounded-2xl bg-suzuki-slate/80 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                  Customer Details
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedInquiry.customer?.full_name || "Customer"}
                </h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  {selectedInquiry.customer?.phone || "No phone provided"}
                </p>
                <p className="text-[11px] text-slate-400">{selectedInquiry.customer?.email}</p>
              </div>

              {/* Click to Call & Click to WhatsApp */}
              <div className="flex gap-2">
                {selectedInquiry.customer?.phone && (
                  <>
                    <a
                      href={`tel:${selectedInquiry.customer.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Customer</span>
                    </a>
                    <a
                      href={`https://wa.me/${selectedInquiry.customer.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Vehicle & Part Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Vehicle */}
              <div className="p-4 rounded-2xl bg-suzuki-slate/50 border border-white/10">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  <Car className="w-4 h-4 text-suzuki-red" />
                  <span>Vehicle Fitment Target</span>
                </div>
                {selectedInquiry.vehicle ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">
                      {selectedInquiry.vehicle.year} {selectedInquiry.vehicle.make}{" "}
                      {selectedInquiry.vehicle.model}
                    </p>
                    <p className="text-xs font-mono text-slate-400">
                      Plate: {selectedInquiry.vehicle.registration_no || "Not registered"}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No specific vehicle attached</p>
                )}
              </div>

              {/* Part */}
              <div className="p-4 rounded-2xl bg-suzuki-slate/50 border border-white/10">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  <span>Requested Component</span>
                </div>
                {selectedInquiry.part ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white truncate">
                      {selectedInquiry.part.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="font-semibold text-emerald-400">
                        ${Number(selectedInquiry.part.price).toFixed(2)} Ref
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {selectedInquiry.part.part_number || "OEM"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Unknown Part</p>
                )}
              </div>
            </div>

            {/* Customer Message */}
            {selectedInquiry.message && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                  Customer Inquiry Message
                </span>
                <p className="text-xs text-slate-200 italic leading-relaxed">
                  &ldquo;{selectedInquiry.message}&rdquo;
                </p>
              </div>
            )}

            {/* Status Workflow & Admin Notes Form */}
            <form action={updateInquiryWorkflow} className="space-y-4 pt-2 border-t border-white/10">
              <input type="hidden" name="id" value={selectedInquiry.id} />

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Workflow Status Stage
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: "new", label: "New Lead", color: "peer-checked:bg-amber-500 peer-checked:text-black" },
                    { val: "contacted", label: "Contacted", color: "peer-checked:bg-blue-600 peer-checked:text-white" },
                    { val: "closed", label: "Closed / Fulfilled", color: "peer-checked:bg-emerald-600 peer-checked:text-white" },
                  ].map((s) => (
                    <label
                      key={s.val}
                      className="relative flex items-center justify-center p-3 rounded-xl bg-suzuki-slate border border-white/15 cursor-pointer hover:border-white/30 text-xs font-bold text-slate-300 transition-colors"
                    >
                      <input
                        type="radio"
                        name="status"
                        value={s.val}
                        defaultChecked={selectedInquiry?.status === s.val}
                        className="sr-only peer"
                      />
                      <span className={`w-full text-center py-1 rounded-lg ${s.color}`}>
                        {s.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Admin Quotation & Communication Notes
                </label>
                <textarea
                  name="admin_notes"
                  rows={3}
                  defaultValue={selectedInquiry.admin_notes || ""}
                  placeholder="e.g. Quoted $340 via WhatsApp. Customer picking up at central warehouse on Friday."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:border-suzuki-red focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <form action={deleteInquiry}>
                  <input type="hidden" name="id" value={selectedInquiry.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Inquiry</span>
                  </button>
                </form>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-suzuki-red hover:bg-suzuki-brightred text-white text-xs font-bold shadow-lg shadow-suzuki-red/30 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Workflow Status</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
