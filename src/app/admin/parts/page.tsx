import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createPart, updatePart, deletePart } from "./actions";
import { PART_CATEGORIES, STANDING_CONDITION_DISCLAIMER } from "@/lib/types";
import type { Part } from "@/lib/types";
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trash2,
  Edit3,
  X,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface AdminPartsPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    category?: string;
    edit?: string;
    add?: string;
    saved?: string;
    error?: string;
  }>;
}

export default async function AdminPartsPage({ searchParams }: AdminPartsPageProps) {
  const { q, status, category, edit, add, saved, error } = await searchParams;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  let query = supabase.from("parts").select("*").order("updated_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data: rawParts } = await query;
  const parts = (rawParts as Part[]) || [];

  // If editing a part, fetch it
  let partToEdit: Part | null = null;
  if (edit) {
    const { data } = await supabase.from("parts").select("*").eq("id", edit).maybeSingle();
    partToEdit = data as Part | null;
  }

  return (
    <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-7xl w-full mx-auto">
      {/* Notifications */}
      {saved && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>
            {saved === "created"
              ? "New part successfully added to catalog."
              : saved === "updated"
              ? "Part successfully updated."
              : "Part deleted from catalog."}
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>Operation failed. Please check required fields and try again.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Package className="w-7 h-7 text-suzuki-red" />
            <span>Parts Inventory Management</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Maintain OEM replacement catalog, reference prices, primer conditions, and promotional offers.
          </p>
        </div>

        <Link
          href="/admin/parts?add=true"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-suzuki-red hover:bg-suzuki-brightred text-white text-xs font-bold shadow-lg shadow-suzuki-red/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Part</span>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-glass border border-white/10">
        <form method="get" className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              name="q"
              defaultValue={q || ""}
              placeholder="Search by part name or keyword..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-suzuki-slate/90 border border-white/10 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-suzuki-red focus:outline-none transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <select
              name="status"
              defaultValue={status || "all"}
              className="px-3 py-2 rounded-xl bg-suzuki-slate/90 border border-white/10 text-xs text-white focus:border-suzuki-red focus:outline-none transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>

            <select
              name="category"
              defaultValue={category || "all"}
              className="px-3 py-2 rounded-xl bg-suzuki-slate/90 border border-white/10 text-xs text-white focus:border-suzuki-red focus:outline-none transition-colors"
            >
              <option value="all">All Categories</option>
              {PART_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-suzuki-slate hover:bg-slate-700 text-white text-xs font-bold border border-white/10 transition-colors cursor-pointer"
            >
              Filter
            </button>

            {(q || status || category) && (
              <Link
                href="/admin/parts"
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center transition-colors"
              >
                Reset
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Parts Table */}
      <div className="rounded-3xl bg-glass border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-suzuki-slate/80 text-[11px] uppercase font-bold text-slate-400 border-b border-white/10 tracking-wider">
              <tr>
                <th className="py-4 px-6">Part Info</th>
                <th className="py-4 px-4">Category</th>
                <th className="py-4 px-4">Ref Price</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Offer</th>
                <th className="py-4 px-4">Updated</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {parts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No parts match the selected query.
                  </td>
                </tr>
              ) : (
                parts.map((part) => (
                  <tr key={part.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-10 rounded-lg overflow-hidden bg-suzuki-slate border border-white/10 flex-shrink-0">
                          {part.photos && part.photos[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={part.photos[0]}
                              alt={part.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 font-mono">
                              OEM
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-white truncate max-w-xs sm:max-w-sm">
                            {part.name}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400">
                            {part.part_number ? `#${part.part_number}` : "No part code"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded bg-suzuki-slate text-[11px] text-slate-200 border border-white/5">
                        {part.category}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-bold text-white text-sm">
                        ${Number(part.price).toFixed(2)}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          part.status === "available"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : part.status === "reserved"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-slate-600/30 text-slate-400 border border-slate-500/30"
                        }`}
                      >
                        {part.status}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      {part.is_offer ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-suzuki-red/20 text-suzuki-brightred text-[10px] font-bold border border-suzuki-red/30">
                          <Sparkles className="w-3 h-3" />
                          <span>Promo</span>
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-slate-400 text-[11px] font-mono">
                      {new Date(part.updated_at).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/parts/${part.id}`}
                          target="_blank"
                          title="View on Customer Feed"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        <Link
                          href={`/admin/parts?edit=${part.id}`}
                          title="Edit Part"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-white/5 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>

                        <form action={deletePart}>
                          <input type="hidden" name="id" value={part.id} />
                          <button
                            type="submit"
                            title="Delete Part"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Part Modal */}
      {add === "true" && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-suzuki-carbon border border-white/10 rounded-3xl p-6 sm:p-8 max-w-2xl w-full my-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-suzuki-red" />
                <span>Add Part to Catalog</span>
              </h2>
              <Link href="/admin/parts" className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </Link>
            </div>

            <form action={createPart} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Part Name <span className="text-suzuki-red">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Swift Sport Front Bumper Fascia"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category <span className="text-suzuki-red">*</span>
                  </label>
                  <select
                    name="category"
                    required
                    defaultValue="Body Panels"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none transition-colors"
                  >
                    {PART_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reference Price ($ USD) <span className="text-suzuki-red">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    min="0"
                    required
                    placeholder="250.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    OEM Part Code / Suffix
                  </label>
                  <input
                    type="text"
                    name="part_number"
                    placeholder="e.g. SZ-71711-52R20"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none transition-colors uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Inventory Status
                  </label>
                  <select
                    name="status"
                    defaultValue="available"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none transition-colors"
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Compatible Suzuki Models (comma-separated)
                </label>
                <input
                  type="text"
                  name="compatible_models"
                  placeholder="Swift (2018-2024), Jimny (JB74), Baleno"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none transition-colors"
                />
              </div>

              {/* Pre-filled Standing Condition Disclaimer */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Condition Disclaimer Note
                  </label>
                  <span className="text-[10px] text-amber-400">Pre-filled with dealer standard</span>
                </div>
                <textarea
                  name="condition_note"
                  rows={2}
                  defaultValue={STANDING_CONDITION_DISCLAIMER}
                  className="w-full px-3.5 py-2 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs focus:border-suzuki-red focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Primer Finish Note
                </label>
                <input
                  type="text"
                  name="primer_note"
                  defaultValue="Factory electro-deposit gray primer coat. Requires finish color matching."
                  className="w-full px-3.5 py-2 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs focus:border-suzuki-red focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Photo URLs (one per line or comma-separated)
                </label>
                <textarea
                  name="photos"
                  rows={2}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs focus:border-suzuki-red focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_offer"
                  name="is_offer"
                  className="w-4 h-4 rounded text-suzuki-red focus:ring-suzuki-red bg-suzuki-slate border-white/20"
                />
                <label htmlFor="is_offer" className="text-xs font-bold text-slate-200">
                  Mark as Promotional Offer / Badge
                </label>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <Link
                  href="/admin/parts"
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-suzuki-red hover:bg-suzuki-brightred text-white text-xs font-bold shadow-lg shadow-suzuki-red/30 cursor-pointer"
                >
                  Save Part to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Part Modal */}
      {partToEdit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-suzuki-carbon border border-white/10 rounded-3xl p-6 sm:p-8 max-w-2xl w-full my-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <span>Edit Part: {partToEdit.name}</span>
              </h2>
              <Link href="/admin/parts" className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </Link>
            </div>

            <form action={updatePart} className="space-y-4">
              <input type="hidden" name="id" value={partToEdit.id} />

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Part Name <span className="text-suzuki-red">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={partToEdit.name}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category <span className="text-suzuki-red">*</span>
                  </label>
                  <select
                    name="category"
                    required
                    defaultValue={partToEdit.category}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none transition-colors"
                  >
                    {PART_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reference Price ($ USD) <span className="text-suzuki-red">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    min="0"
                    required
                    defaultValue={Number(partToEdit.price)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    OEM Part Code / Suffix
                  </label>
                  <input
                    type="text"
                    name="part_number"
                    defaultValue={partToEdit.part_number || ""}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none transition-colors uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Inventory Status
                  </label>
                  <select
                    name="status"
                    defaultValue={partToEdit.status}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none transition-colors"
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Compatible Suzuki Models (comma-separated)
                </label>
                <input
                  type="text"
                  name="compatible_models"
                  defaultValue={partToEdit.compatible_models?.join(", ") || ""}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Condition Note
                </label>
                <textarea
                  name="condition_note"
                  rows={2}
                  defaultValue={partToEdit.condition_note}
                  className="w-full px-3.5 py-2 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs focus:border-suzuki-red focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Primer Finish Note
                </label>
                <input
                  type="text"
                  name="primer_note"
                  defaultValue={partToEdit.primer_note || ""}
                  className="w-full px-3.5 py-2 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs focus:border-suzuki-red focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Photo URLs (one per line)
                </label>
                <textarea
                  name="photos"
                  rows={2}
                  defaultValue={partToEdit.photos?.join("\n") || ""}
                  className="w-full px-3.5 py-2 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs focus:border-suzuki-red focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_offer_edit"
                  name="is_offer"
                  defaultChecked={partToEdit.is_offer}
                  className="w-4 h-4 rounded text-suzuki-red focus:ring-suzuki-red bg-suzuki-slate border-white/20"
                />
                <label htmlFor="is_offer_edit" className="text-xs font-bold text-slate-200">
                  Mark as Promotional Offer / Badge
                </label>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <Link
                  href="/admin/parts"
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-suzuki-red hover:bg-suzuki-brightred text-white text-xs font-bold shadow-lg shadow-suzuki-red/30 cursor-pointer"
                >
                  Update Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
