import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile, getUserVehicles, createSupabaseServerClient } from "@/lib/supabase/server";
import { CustomerNavbar } from "@/components/customer/Navbar";
import { PART_CATEGORIES, SUZUKI_MODELS, STANDING_CONDITION_DISCLAIMER } from "@/lib/types";
import type { Part } from "@/lib/types";
import {
  AlertTriangle,
  Search,
  Tag,
  ArrowRight,
  Sparkles,
  Layers,
  Car,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface HomeFeedProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    model?: string;
  }>;
}

export default async function HomeFeedPage({ searchParams }: HomeFeedProps) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const vehicles = await getUserVehicles(profile.id);
  const supabase = await createSupabaseServerClient();

  const { q, category, model } = await searchParams;

  let query = supabase
    ? supabase
        .from("parts")
        .select("*")
        .neq("status", "archived")
        .order("is_offer", { ascending: false })
        .order("created_at", { ascending: false })
    : null;

  if (query && category && category !== "All") {
    query = query.eq("category", category);
  }

  if (query && q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data: rawParts } = query ? await query : { data: [] };

  // Filter in-memory for compatible models array if filter selected
  let parts = (rawParts as Part[]) || [];
  if (model && model !== "All") {
    parts = parts.filter((p) =>
      p.compatible_models.some((m) =>
        m.toLowerCase().includes(model.toLowerCase())
      )
    );
  }

  return (
    <div className="min-h-screen bg-carbon-pattern flex flex-col selection:bg-suzuki-red selection:text-white">
      <CustomerNavbar profile={profile} vehicleCount={vehicles.length} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Standing Condition Disclaimer Banner - Top & Prominent */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-suzuki-slate to-amber-500/10 border border-amber-500/30 p-5 sm:p-6 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Dealer Notice & Standing Condition Disclaimer
                </span>
              </div>
              <p className="text-sm sm:text-base font-semibold text-slate-100 leading-snug">
                &ldquo;{STANDING_CONDITION_DISCLAIMER}&rdquo;
              </p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                All prices listed in this network catalog are for dealer reference only. Inquiries
                are routed directly to certified parts specialists to confirm stock, pricing, and
                offline logistics.
              </p>
            </div>
          </div>
        </div>

        {/* Header & Garage Quick Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Suzuki Parts Catalog
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Browse genuine replacement panels, electrical kits, and performance maintenance units.
            </p>
          </div>

          {vehicles.length > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-suzuki-slate border border-white/10 text-xs">
              <Car className="w-4 h-4 text-suzuki-red" />
              <span className="text-slate-400">Your Vehicle:</span>
              <span className="font-bold text-white">
                {vehicles[0].year} {vehicles[0].make} {vehicles[0].model}
              </span>
            </div>
          )}
        </div>

        {/* Search & Filters */}
        <div className="space-y-4">
          <form method="get" className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                name="q"
                defaultValue={q || ""}
                placeholder="Search by part name, bumper, headlamp, grille..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-suzuki-slate/90 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:border-suzuki-red focus:outline-none transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <select
                name="category"
                defaultValue={category || "All"}
                className="px-3.5 py-2.5 rounded-xl bg-suzuki-slate/90 border border-white/10 text-xs sm:text-sm text-white focus:border-suzuki-red focus:outline-none transition-colors"
              >
                <option value="All">All Categories</option>
                {PART_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                name="model"
                defaultValue={model || "All"}
                className="px-3.5 py-2.5 rounded-xl bg-suzuki-slate/90 border border-white/10 text-xs sm:text-sm text-white focus:border-suzuki-red focus:outline-none transition-colors"
              >
                <option value="All">All Suzuki Models</option>
                {SUZUKI_MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-suzuki-red hover:bg-suzuki-brightred text-white text-xs sm:text-sm font-bold shadow-md transition-colors cursor-pointer"
              >
                Filter
              </button>

              {(q || (category && category !== "All") || (model && model !== "All")) && (
                <Link
                  href="/home"
                  className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs sm:text-sm flex items-center transition-colors"
                >
                  Reset
                </Link>
              )}
            </div>
          </form>
        </div>

        {/* Parts Grid */}
        {parts.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-glass border border-white/5 p-8">
            <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No parts match your criteria</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search terms or filter selections to view available inventory.
            </p>
            <Link
              href="/home"
              className="inline-block mt-4 text-xs font-semibold text-suzuki-red hover:underline"
            >
              Clear all filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {parts.map((part) => (
              <div
                key={part.id}
                className="group rounded-2xl bg-glass-card overflow-hidden flex flex-col transition-all duration-200"
              >
                {/* Photo Thumbnail */}
                <div className="relative aspect-[16/10] bg-suzuki-slate overflow-hidden">
                  {part.photos && part.photos.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={part.photos[0]}
                      alt={part.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Layers className="w-10 h-10" />
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {part.is_offer && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-suzuki-red text-white text-[11px] font-black uppercase tracking-wider shadow-md">
                        <Sparkles className="w-3 h-3" />
                        <span>Special Offer</span>
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-md bg-suzuki-black/80 backdrop-blur-md text-slate-200 text-[11px] font-semibold border border-white/10">
                      {part.category}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
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

                  {/* Reference Price Tag in bottom of image */}
                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-suzuki-black/90 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Ref Price:
                    </span>
                    <span className="text-sm font-black text-white">
                      ${Number(part.price).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-white group-hover:text-suzuki-brightred transition-colors line-clamp-2">
                      {part.name}
                    </h3>
                    {part.part_number && (
                      <p className="text-[11px] font-mono text-slate-400 mt-1">
                        OEM #{part.part_number}
                      </p>
                    )}

                    {/* Compatible Models Tags */}
                    {part.compatible_models && part.compatible_models.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {part.compatible_models.slice(0, 3).map((mod) => (
                          <span
                            key={mod}
                            className="px-2 py-0.5 rounded bg-white/5 text-[11px] text-slate-300 border border-white/5"
                          >
                            {mod}
                          </span>
                        ))}
                        {part.compatible_models.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-slate-400">
                            +{part.compatible_models.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Condition preview */}
                    <p className="text-xs text-slate-400 mt-3 line-clamp-2 italic border-l-2 border-amber-500/40 pl-2.5">
                      {part.condition_note}
                    </p>
                  </div>

                  {/* Action CTA */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Direct lead to dealer</span>
                    <Link
                      href={`/parts/${part.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-suzuki-brightred hover:text-white transition-colors"
                    >
                      <span>View & Request</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
