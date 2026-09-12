import { CheckCircle2, Layers3, Plus, Save } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PartCategory } from "@/lib/types";
import { createCategory, updateCategory } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { saved, error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const [{ data }, { data: parts }] = await Promise.all([
    supabase.from("part_categories").select("*").order("name"),
    supabase.from("parts").select("category"),
  ]);
  const categories = (data as PartCategory[]) || [];
  const counts = new Map<string, number>();
  for (const part of parts || []) counts.set(part.category, (counts.get(part.category) || 0) + 1);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-5 sm:p-7 lg:p-10">
      <header><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff626d]">Catalog structure</p><h1 className="mt-1 flex items-center gap-3 text-3xl font-black tracking-[-0.04em] text-white"><Layers3 className="h-7 w-7 text-[#ff626d]" /> Part categories</h1><p className="mt-2 text-sm text-slate-400">Create the sections customers use to browse your inventory.</p></header>

      {saved ? <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Category {saved} successfully.</div> : null}
      {error ? <div role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-semibold text-red-300">{error === "duplicate" ? "That category already exists." : "The category could not be saved. Check the name and try again."}</div> : null}

      <form action={createCategory} className="grid gap-3 rounded-[26px] border border-white/10 bg-white/[0.055] p-4 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end sm:p-5">
        <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Category name<input name="name" required placeholder="e.g. Cooling & Air Conditioning" className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold normal-case tracking-normal text-white outline-none focus:border-[#e30613]" /></label>
        <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Short description<input name="short_description" placeholder="What customers will find here" className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm normal-case tracking-normal text-white outline-none focus:border-[#e30613]" /></label>
        <button type="submit" className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#e30613] px-5 text-xs font-bold text-white shadow-lg shadow-red-950/20 hover:bg-[#ff2432]"><Plus className="h-4 w-4" /> Add category</button>
      </form>

      <section className="grid gap-4 lg:grid-cols-2">
        {categories.map((category) => (
          <form key={category.id} action={updateCategory} className="rounded-[26px] border border-white/10 bg-white/[0.055] p-5">
            <input type="hidden" name="id" value={category.id} />
            <div className="flex items-start justify-between gap-4"><div><span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[10px] font-bold text-slate-300">{counts.get(category.name) || 0} parts</span></div><label className="flex items-center gap-2 text-[10px] font-bold text-slate-300"><input type="checkbox" name="is_active" defaultChecked={category.is_active} className="h-4 w-4 rounded text-[#e30613]" /> Active</label></div>
            <label className="mt-4 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Name<input name="name" required defaultValue={category.name} className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm font-bold normal-case tracking-normal text-white outline-none focus:border-[#e30613]" /></label>
            <label className="mt-3 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Description<input name="short_description" defaultValue={category.short_description || ""} className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm normal-case tracking-normal text-white outline-none focus:border-[#e30613]" /></label>
            <button type="submit" className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-white/[0.08] text-xs font-bold text-white hover:bg-white/[0.13]"><Save className="h-3.5 w-3.5" /> Save changes</button>
          </form>
        ))}
      </section>
    </main>
  );
}
