import Link from "next/link";
import { Check, Clock3, Gift, MessageCircle, Users } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CustomerOffer, Part, Profile, Vehicle } from "@/lib/types";
import { OfferComposer } from "./OfferComposer";
import { cancelOffer, markOfferSent } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminOffersPage({ searchParams }: { searchParams: Promise<{ customer?: string; saved?: string; error?: string }> }) {
  const { customer, saved, error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const [{ data: customerRows }, { data: partRows }, { data: offerRows }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, phone, vehicles(model, year)").eq("role", "customer").order("created_at", { ascending: false }),
    supabase.from("parts").select("id, name, price, short_description").eq("status", "available").order("name"),
    supabase.from("customer_offers").select("*, customer:profiles(*), part:parts(*)").order("created_at", { ascending: false }).limit(30),
  ]);
  const customers = (customerRows as (Pick<Profile, "id" | "full_name" | "email" | "phone"> & { vehicles: Pick<Vehicle, "model" | "year">[] })[]) || [];
  const parts = (partRows as Pick<Part, "id" | "name" | "price" | "short_description">[]) || [];
  const offers = (offerRows as CustomerOffer[]) || [];
  const sent = offers.filter((offer) => offer.status === "sent").length;
  const prepared = offers.filter((offer) => offer.status === "prepared").length;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-5 sm:p-7 lg:p-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff626d]">Personal outreach</p><h1 className="mt-1 flex items-center gap-3 text-3xl font-black tracking-[-0.04em] text-white"><Gift className="h-7 w-7 text-[#ff626d]" /> Special offers</h1><p className="mt-2 max-w-2xl text-sm text-slate-400">Prepare one-to-one offers using each owner’s registered Suzuki, then send manually through your preferred channel.</p></div><Link href="/admin/users" className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-white/[0.08] px-4 text-xs font-bold text-white hover:bg-white/[0.13]"><Users className="h-4 w-4" /> Owner directory</Link></header>
      {saved ? <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-300">Offer {saved} successfully.</div> : null}
      {error ? <div role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-semibold text-red-300">{error === "no_phone" ? "The offer was saved, but this owner has no phone number." : error === "no_email" ? "The offer was saved, but this owner has no email address." : "The offer could not be completed. Check the fields and try again."}</div> : null}

      <section className="grid gap-3 sm:grid-cols-3"><div className="rounded-[24px] border border-white/10 bg-white/[0.055] p-5"><Users className="h-5 w-5 text-blue-400" /><p className="mt-4 text-3xl font-black text-white">{customers.length}</p><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Owners available</p></div><div className="rounded-[24px] border border-white/10 bg-white/[0.055] p-5"><Clock3 className="h-5 w-5 text-amber-300" /><p className="mt-4 text-3xl font-black text-white">{prepared}</p><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Prepared</p></div><div className="rounded-[24px] border border-white/10 bg-white/[0.055] p-5"><Check className="h-5 w-5 text-emerald-400" /><p className="mt-4 text-3xl font-black text-white">{sent}</p><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Marked sent</p></div></section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <OfferComposer customers={customers} parts={parts} initialCustomerId={customer} />
        <section className="rounded-[30px] border border-white/10 bg-white/[0.055] p-5 sm:p-7"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black tracking-[-0.03em] text-white">Recent offers</h2><p className="mt-1 text-xs text-slate-400">Your latest prepared and sent messages.</p></div><span className="rounded-full bg-white/[0.07] px-3 py-1 text-[10px] font-bold text-slate-300">{offers.length}</span></div><div className="mt-5 max-h-[720px] space-y-3 overflow-y-auto pr-1">{offers.length ? offers.map((offer) => <article key={offer.id} className="rounded-[22px] border border-white/[0.08] bg-black/10 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-white">{offer.title}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">{offer.customer?.full_name || "Owner"}{offer.part ? ` · ${offer.part.name}` : ""}</p></div><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase ${offer.status === "sent" ? "bg-emerald-500/15 text-emerald-300" : offer.status === "cancelled" ? "bg-white/[0.06] text-slate-500" : "bg-amber-400/15 text-amber-200"}`}>{offer.status}</span></div><p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-400">{offer.message}</p><div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-3"><span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500"><MessageCircle className="h-3 w-3" /> {offer.channel} · {new Date(offer.created_at).toLocaleDateString()}</span>{offer.status === "prepared" ? <div className="flex gap-2"><form action={cancelOffer}><input type="hidden" name="id" value={offer.id} /><button className="rounded-full px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:bg-white/[0.06]">Cancel</button></form><form action={markOfferSent}><input type="hidden" name="id" value={offer.id} /><button className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/25">Mark sent</button></form></div> : null}</div></article>) : <div className="py-16 text-center text-xs text-slate-500">No offers prepared yet.</div>}</div></section>
      </div>
    </main>
  );
}
