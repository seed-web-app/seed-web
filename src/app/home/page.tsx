import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerNavbar } from "@/components/customer/Navbar";
import { HeroSlider } from "@/components/customer/HeroSlider";
import { CategoryIconsGrid } from "@/components/customer/CategoryIconsGrid";
import { ProductRail } from "@/components/customer/ProductRail";
import { EnquireButton } from "@/components/customer/EnquireButton";
import { QuickFilterBar } from "@/components/customer/QuickFilterBar";
import { getCachedNews, getCachedParts, getCachedThreads } from "@/lib/catalog";
import { getOptimizedImageUrl } from "@/lib/images";
import { createSupabaseServerClient, getCurrentProfile, getUserVehicles } from "@/lib/supabase/server";
import { PART_CATEGORIES, STANDING_CONDITION_DISCLAIMER } from "@/lib/types";
import {
  AlertTriangle,
  ArrowRight,
  Car,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface HomeFeedProps {
  searchParams: Promise<{ q?: string; category?: string; model?: string; offers?: string }>;
}

export default async function HomeFeedPage({ searchParams }: HomeFeedProps) {
  const filters = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/");

  const [allParts, news, threads, vehicles, supabase] = await Promise.all([
    getCachedParts(),
    getCachedNews(),
    getCachedThreads(),
    getUserVehicles(profile.id),
    createSupabaseServerClient(),
  ]);
  const inquiryResult = supabase
    ? await supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("customer_id", profile.id)
    : { count: 0 };

  let parts = allParts;
  if (filters.offers === "true") parts = parts.filter((part) => part.is_offer);
  if (filters.category && filters.category !== "All") parts = parts.filter((part) => part.category.toLowerCase() === filters.category?.toLowerCase());
  if (filters.q) {
    const query = filters.q.toLowerCase();
    parts = parts.filter((part) => part.name.toLowerCase().includes(query) || part.category.toLowerCase().includes(query) || (part.part_number || "").toLowerCase().includes(query) || part.compatible_models.some((model) => model.toLowerCase().includes(query)));
  }
  if (filters.model && filters.model !== "All") {
    const model = filters.model.toLowerCase();
    parts = parts.filter((part) => part.compatible_models.some((compatible) => compatible.toLowerCase().includes(model)));
  }

  const filtered = Boolean(filters.q || filters.category || filters.model || filters.offers === "true");
  const offerParts = allParts.filter((part) => part.is_offer);
  const bodyPanels = allParts.filter((part) => part.category === "Body Panels");
  const firstName = profile.full_name?.split(" ")[0] || "Driver";

  return (
    <div id="top" className="app-canvas min-h-screen text-[#1d1d1f]">
      <CustomerNavbar profile={profile} vehicleCount={vehicles.length} inquiryCount={inquiryResult.count || 0} />

      <main className="mx-auto max-w-[1380px] space-y-12 px-4 pb-24 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-16">
        {!filtered ? <HeroSlider /> : null}

        <section className={`ios-card grid overflow-hidden rounded-[26px] ${filtered ? "mt-2" : "-mt-4 relative z-10 mx-2 sm:mx-8"} sm:grid-cols-[1fr_auto]`}>
          <div className="flex items-center gap-3 p-4 sm:p-5">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-[#fff0f1] text-[#e30613]"><Car className="h-5 w-5" /></span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8e8e93]">Hello, {firstName}</p>
              {vehicles.length ? (
                <p className="mt-1 truncate text-sm font-extrabold">{vehicles[0].year} {vehicles[0].make} {vehicles[0].model} is ready for fitment checks</p>
              ) : (
                <p className="mt-1 text-sm font-extrabold">Add your Suzuki for faster fitment checks</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-black/[0.06] px-4 py-3 sm:border-l sm:border-t-0 sm:px-5">
            <MapPin className="h-4 w-4 text-[#e30613]" />
            <span className="text-[11px] font-semibold text-[#6e6e73]">Phoenix & Port Louis</span>
            <Link href="/profile#garage" className="ml-auto rounded-full bg-[#1d1d1f] px-4 py-2 text-[11px] font-bold text-white sm:ml-3">{vehicles.length ? "Manage garage" : "Add vehicle"}</Link>
          </div>
        </section>

        {filtered ? (
          <section className="rounded-[26px] bg-[#1d1d1f] px-5 py-5 text-white sm:flex sm:items-center sm:justify-between sm:px-7">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50">Catalog results</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.035em]">{parts.length} matching parts</h1>
              <p className="mt-1 text-xs text-white/60">{filters.q ? `Search: “${filters.q}”` : filters.category || filters.model || "Selected offers"}</p>
            </div>
            <Link href="/home" className="mt-4 inline-flex min-h-10 items-center rounded-full bg-white px-4 text-xs font-bold text-[#1d1d1f] sm:mt-0">Clear filters</Link>
          </section>
        ) : null}

        <CategoryIconsGrid activeCategory={filters.category} />

        {!filtered ? (
          <section className="grid overflow-hidden rounded-[30px] bg-[#1d1d1f] text-white shadow-[0_24px_60px_rgba(17,17,19,0.12)] lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative min-h-[320px] lg:min-h-[430px]">
              <Image src="/brand/parts-studio.jpg" alt="Body panel, headlamp and brake parts prepared in a clean dealer workshop" fill sizes="(max-width: 1024px) 100vw, 52vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#1d1d1f]/20" />
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-12">
              <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white"><ShieldCheck className="h-5 w-5" /></span>
              <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#ff6b75]">Know before you request</p>
              <h2 className="mt-2 text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl">Clear parts. Clear condition. Human support.</h2>
              <p className="mt-4 text-sm leading-6 text-white/65">{STANDING_CONDITION_DISCLAIMER}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/home?category=Body+Panels" className="flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-xs font-bold text-[#1d1d1f]">View body parts <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/content" className="flex min-h-11 items-center rounded-full border border-white/15 bg-white/5 px-5 text-xs font-bold text-white hover:bg-white/10">Watch care guides</Link>
              </div>
            </div>
          </section>
        ) : null}

        {!filtered && offerParts.length ? <ProductRail title="Offers worth a look" subtitle="Current reference-price offers from the dealer parts desk." parts={offerParts} viewAllLink="/home?offers=true" /> : null}
        {!filtered && bodyPanels.length ? <ProductRail title="Body parts, made simpler" subtitle="Primer-ready panels with condition notes shown before you request." parts={bodyPanels} viewAllLink="/home?category=Body+Panels" /> : null}

        <section id="all-parts" className="scroll-mt-28">
          <div className="mb-5 flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#e30613]">Live dealer catalog</p>
              <h2 className="ios-section-title text-3xl sm:text-4xl">{filtered ? "Your results" : "All available parts"}</h2>
              <p className="mt-1 text-xs text-[#6e6e73]">Reference pricing only. Send a request and the dealer will confirm fitment.</p>
            </div>
            <div className="nav-scroll flex gap-2 overflow-x-auto pb-1 text-[11px] font-bold">
              <Link href="/home#all-parts" className={`whitespace-nowrap rounded-full px-4 py-2 ${!filters.category ? "bg-[#1d1d1f] text-white" : "ios-chip text-[#6e6e73]"}`}>All parts</Link>
              {PART_CATEGORIES.map((category) => <Link key={category} href={`/home?category=${encodeURIComponent(category)}#all-parts`} className={`whitespace-nowrap rounded-full px-4 py-2 ${filters.category === category ? "bg-[#1d1d1f] text-white" : "ios-chip text-[#6e6e73]"}`}>{category}</Link>)}
            </div>
          </div>

          <QuickFilterBar />

          {parts.length ? (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {parts.map((part) => (
                <article key={part.id} className="ios-card group flex flex-col overflow-hidden rounded-[26px] transition duration-200 hover:-translate-y-1">
                  <Link href={`/parts/${part.id}`} className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-white to-[#ededf0] p-6">
                    {part.photos?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getOptimizedImageUrl(part.photos[0], 560, 82)} alt={part.name} loading="lazy" decoding="async" className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.04]" />
                    ) : <Wrench className="h-8 w-8 text-[#c7c7cc]" />}
                    <div className="absolute left-3 top-3 flex gap-1.5">
                      <span className="rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-bold shadow-sm backdrop-blur">{part.status === "available" ? "Available" : part.status}</span>
                      {part.is_offer ? <span className="rounded-full bg-[#e30613] px-2.5 py-1 text-[9px] font-bold text-white">Offer</span> : null}
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#8e8e93]">{part.category}</p>
                    <Link href={`/parts/${part.id}`} className="mt-1.5 line-clamp-2 text-[15px] font-extrabold leading-5 tracking-[-0.02em] hover:text-[#e30613]">{part.name}</Link>
                    <p className="mt-1 text-[10px] font-medium text-[#8e8e93]">{part.part_number ? `OEM ${part.part_number}` : "Fitment verified on request"}</p>
                    {part.category === "Body Panels" ? <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-[#fff6e8] px-2.5 py-2 text-[10px] font-semibold text-[#a45c08]"><AlertTriangle className="h-3.5 w-3.5" /> Gray-primer condition applies</p> : null}
                    <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                      <div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#8e8e93]">Reference</p><p className="mt-0.5 text-xl font-black tracking-[-0.035em]">Rs {Number(part.price || 0).toLocaleString()}</p></div>
                      <EnquireButton partId={part.id} partName={part.name} partPrice={Number(part.price || 0)} label="Request" className="flex min-h-10 items-center justify-center rounded-full bg-[#e30613] px-4 text-xs font-bold text-white shadow-[0_7px_18px_rgba(227,6,19,0.18)] hover:bg-[#c90010]" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="ios-card mt-5 rounded-[28px] px-6 py-16 text-center"><CircleGauge className="mx-auto h-8 w-8 text-[#c7c7cc]" /><h3 className="mt-4 text-lg font-black">No exact match yet</h3><p className="mt-1 text-xs text-[#6e6e73]">Clear the filters or ask the parts desk for help.</p><Link href="/home" className="mt-5 inline-flex min-h-10 items-center rounded-full bg-[#1d1d1f] px-5 text-xs font-bold text-white">Reset catalog</Link></div>
          )}
        </section>

        {!filtered ? (
          <section className="grid gap-5 lg:grid-cols-2">
            <div className="ios-card rounded-[28px] p-6 sm:p-8">
              <div className="flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf3ff] text-[#087cf0]"><Sparkles className="h-5 w-5" /></span><Link href="/news" className="text-xs font-bold text-[#087cf0]">All stories</Link></div>
              <h2 className="ios-section-title mt-6 text-2xl">Stories for island driving</h2>
              <div className="mt-4 divide-y divide-black/[0.06]">
                {news.slice(0, 3).map((item) => <Link key={item.id} href="/news" className="flex items-center gap-3 py-3.5 group"><span className="min-w-0 flex-1"><span className="block text-[10px] font-bold uppercase tracking-[0.11em] text-[#e30613]">{item.category}</span><span className="mt-1 block line-clamp-2 text-sm font-bold leading-5 group-hover:text-[#087cf0]">{item.title}</span></span><ChevronRight className="h-4 w-4 flex-none text-[#c7c7cc]" /></Link>)}
              </div>
            </div>
            <div className="ios-card rounded-[28px] p-6 sm:p-8">
              <div className="flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff0f1] text-[#e30613]"><MessageCircle className="h-5 w-5" /></span><Link href="/forum" className="text-xs font-bold text-[#087cf0]">Open community</Link></div>
              <h2 className="ios-section-title mt-6 text-2xl">From Suzuki owners</h2>
              <div className="mt-4 divide-y divide-black/[0.06]">
                {threads.slice(0, 3).map((thread) => <Link key={thread.id} href={`/forum?thread=${thread.id}`} className="flex items-center gap-3 py-3.5 group"><span className="min-w-0 flex-1"><span className="block text-[10px] font-bold text-[#8e8e93]">@{thread.author_name} · {thread.replies_count} replies</span><span className="mt-1 block truncate text-sm font-bold group-hover:text-[#087cf0]">{thread.title}</span></span><ChevronRight className="h-4 w-4 flex-none text-[#c7c7cc]" /></Link>)}
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-[30px] bg-white p-6 ring-1 ring-black/[0.06] sm:flex sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4"><span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-[#e8f8ef] text-[#138a51]"><CheckCircle2 className="h-5 w-5" /></span><div><h2 className="text-lg font-black tracking-[-0.025em]">No payments. No pressure.</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-[#6e6e73]">Every action sends a parts request to a real dealer advisor. You will confirm compatibility, condition, and final price directly.</p></div></div>
          <Link href="/profile#inquiries" className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-5 text-xs font-bold text-white sm:mt-0">View requests <ArrowRight className="h-4 w-4" /></Link>
        </section>
      </main>

      <footer className="border-t border-black/[0.06] bg-white/70 px-5 py-8 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1380px] flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e30613] text-sm font-black text-white">S</span><div><p className="text-xs font-black">Suzuki Mauritius</p><p className="text-[10px] text-[#8e8e93]">Parts & owner network</p></div></div><p className="text-[10px] leading-5 text-[#8e8e93]">Reference prices only · Phoenix · Port Louis · No online payments</p></div>
      </footer>
    </div>
  );
}
