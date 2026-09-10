import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile, getUserVehicles, createSupabaseServerClient } from "@/lib/supabase/server";
import { CustomerNavbar } from "@/components/customer/Navbar";
import { HeroSlider } from "@/components/customer/HeroSlider";
import { CategoryIconsGrid } from "@/components/customer/CategoryIconsGrid";
import { ProductRail } from "@/components/customer/ProductRail";
import { DealOfTheDay } from "@/components/customer/DealOfTheDay";
import { STANDING_CONDITION_DISCLAIMER } from "@/lib/types";
import type { Part, CarModel, NewsArticle, ForumThread } from "@/lib/types";
import {
  AlertTriangle,
  Car,
  MessageSquare,
  ShieldCheck,
  Phone,
  Wrench,
  Compass,
  MapPin,
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

  // 1. Fetch Parts
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
  let parts = (rawParts as Part[]) || [];

  if (model && model !== "All") {
    parts = parts.filter((p) =>
      p.compatible_models.some((m) =>
        m.toLowerCase().includes(model.toLowerCase())
      )
    );
  }

  // 2. Fetch Cars Showcase
  const { data: rawCars } = supabase
    ? await supabase.from("car_models").select("*").limit(6)
    : { data: [] };
  const cars = (rawCars as CarModel[]) || [];

  // 3. Fetch News Articles
  const { data: rawNews } = supabase
    ? await supabase.from("news_articles").select("*").order("published_at", { ascending: false }).limit(4)
    : { data: [] };
  const news = (rawNews as NewsArticle[]) || [];

  // 4. Fetch Forum Threads
  const { data: rawThreads } = supabase
    ? await supabase.from("forum_threads").select("*").order("created_at", { ascending: false }).limit(4)
    : { data: [] };
  const threads = (rawThreads as ForumThread[]) || [];

  // Inquiries count for navbar badge
  const { count: inquiryCount } = supabase
    ? await supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("customer_id", profile.id)
    : { count: 0 };

  const isFiltered = Boolean(q || (category && category !== "All") || (model && model !== "All"));

  // Segment parts into Amazon rails
  const offerParts = parts.filter((p) => p.is_offer);
  const dealPart = offerParts[0] || parts[0];
  const bodyPanels = parts.filter((p) => p.category === "Body Panels");
  const engineParts = parts.filter((p) => p.category === "Engine & Drivetrain");
  const electricalParts = parts.filter((p) => p.category === "Electrical & Lighting");
  const suspensionParts = parts.filter((p) => p.category === "Suspension & Steering");
  const brakeParts = parts.filter((p) => p.category === "Brakes & Wheels");
  const interiorParts = parts.filter((p) => p.category === "Interior & Accessories");

  return (
    <div className="min-h-screen bg-[#eaeded] flex flex-col font-sans selection:bg-[#ffd814] selection:text-black">
      <CustomerNavbar
        profile={profile}
        vehicleCount={vehicles.length}
        inquiryCount={inquiryCount || 0}
      />

      <main className="flex-1 max-w-[1540px] w-full mx-auto px-2 sm:px-4 lg:px-6 pb-16 space-y-6">
        {/* Amazon Hero Banner Slider (Active when not searching) */}
        {!isFiltered && <HeroSlider />}

        {/* Quick Vehicle & Filter Chips Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-[#e7e7e7] shadow-xs text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[#0f1111] flex items-center gap-1.5">
              <Car className="w-4 h-4 text-[#f08804]" />
              <span>Your Vehicle:</span>
            </span>

            {vehicles.length > 0 ? (
              <span className="px-2.5 py-1 rounded bg-[#f0f2f2] text-[#0f1111] font-bold border border-[#d5d9d9]">
                {vehicles[0].year} {vehicles[0].make} {vehicles[0].model}
              </span>
            ) : (
              <Link
                href="/profile"
                className="px-2.5 py-1 rounded bg-[#fff8e7] text-[#b12704] font-semibold border border-[#fbd88e] hover:underline"
              >
                + Register your Suzuki in Garage for auto-fitment
              </Link>
            )}

            {isFiltered && (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[#e7e7e7]">
                <span className="text-[#565959]">Active filter:</span>
                {category && category !== "All" && (
                  <span className="px-2 py-0.5 rounded-full bg-[#131921] text-white font-semibold text-[11px]">
                    Category: {category}
                  </span>
                )}
                {q && (
                  <span className="px-2 py-0.5 rounded-full bg-[#131921] text-white font-semibold text-[11px]">
                    Keyword: &ldquo;{q}&rdquo;
                  </span>
                )}
                {model && model !== "All" && (
                  <span className="px-2 py-0.5 rounded-full bg-[#131921] text-white font-semibold text-[11px]">
                    Model: {model}
                  </span>
                )}
                <Link
                  href="/home"
                  className="text-xs font-bold text-[#007185] hover:text-[#c7511f] hover:underline ml-1"
                >
                  Clear All Filters ✕
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-[#565959] text-[11px]">
            <span className="hidden sm:inline">Authorized Dealer Depot:</span>
            <span className="font-bold text-[#0f1111] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#febd69]" />
              <span>Phoenix & Port Louis, Mauritius</span>
            </span>
          </div>
        </div>

        {/* 1. Category Icons Grid with Proper Categories */}
        <CategoryIconsGrid activeCategory={category} />

        {/* 2. Amazon 4-in-1 Cards Section (When not filtered) */}
        {!isFiltered && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Shop Genuine Parts */}
            <div className="amazon-card bg-white p-5 flex flex-col justify-between rounded-lg">
              <div>
                <h3 className="text-base font-extrabold text-[#0f1111] mb-1">
                  Shop Suzuki Parts by Category
                </h3>
                <p className="text-[11px] text-[#565959] mb-3">
                  Direct replacement OEM components
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    href="/home?category=Body+Panels"
                    className="group block text-center"
                  >
                    <div className="aspect-[4/3] bg-[#f7f7f7] rounded p-1 mb-1 flex items-center justify-center border border-[#e7e7e7] group-hover:border-[#f08804]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80"
                        alt="Body Panels"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-[#0f1111] group-hover:text-[#c7511f] block leading-tight">
                      Body Panels (Primer)
                    </span>
                  </Link>

                  <Link
                    href="/home?category=Engine+%26+Drivetrain"
                    className="group block text-center"
                  >
                    <div className="aspect-[4/3] bg-[#f7f7f7] rounded p-1 mb-1 flex items-center justify-center border border-[#e7e7e7] group-hover:border-[#f08804]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80"
                        alt="Engine"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-[#0f1111] group-hover:text-[#c7511f] block leading-tight">
                      Boosterjet Engines
                    </span>
                  </Link>

                  <Link
                    href="/home?category=Electrical+%26+Lighting"
                    className="group block text-center"
                  >
                    <div className="aspect-[4/3] bg-[#f7f7f7] rounded p-1 mb-1 flex items-center justify-center border border-[#e7e7e7] group-hover:border-[#f08804]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80"
                        alt="Electrical"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-[#0f1111] group-hover:text-[#c7511f] block leading-tight">
                      Hybrid & Lights
                    </span>
                  </Link>

                  <Link
                    href="/home?category=Brakes+%26+Wheels"
                    className="group block text-center"
                  >
                    <div className="aspect-[4/3] bg-[#f7f7f7] rounded p-1 mb-1 flex items-center justify-center border border-[#e7e7e7] group-hover:border-[#f08804]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=400&q=80"
                        alt="Brakes"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-[#0f1111] group-hover:text-[#c7511f] block leading-tight">
                      Brakes & Rotors
                    </span>
                  </Link>
                </div>
              </div>

              <Link
                href="/home"
                className="mt-4 text-xs font-semibold text-[#007185] hover:text-[#c7511f] hover:underline"
              >
                Browse All 68 Parts Catalog →
              </Link>
            </div>

            {/* Card 2: Mauritius Suzuki Cars Lineup */}
            <div className="amazon-card bg-white p-5 flex flex-col justify-between rounded-lg">
              <div>
                <h3 className="text-base font-extrabold text-[#0f1111] mb-1">
                  Explore Suzuki Cars Mauritius
                </h3>
                <p className="text-[11px] text-[#565959] mb-3">
                  Right-hand drive showroom lineup
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  <Link href="/cars" className="group block text-center">
                    <div className="aspect-[4/3] bg-[#f7f7f7] rounded p-1 mb-1 flex items-center justify-center border border-[#e7e7e7] group-hover:border-[#f08804]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80"
                        alt="Jimny"
                        className="max-h-full max-w-full object-cover rounded"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-[#0f1111] group-hover:text-[#c7511f] block">
                      Jimny AllGrip Pro
                    </span>
                  </Link>

                  <Link href="/cars" className="group block text-center">
                    <div className="aspect-[4/3] bg-[#f7f7f7] rounded p-1 mb-1 flex items-center justify-center border border-[#e7e7e7] group-hover:border-[#f08804]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80"
                        alt="Swift"
                        className="max-h-full max-w-full object-cover rounded"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-[#0f1111] group-hover:text-[#c7511f] block">
                      Swift Hybrid 2026
                    </span>
                  </Link>

                  <Link href="/cars" className="group block text-center">
                    <div className="aspect-[4/3] bg-[#f7f7f7] rounded p-1 mb-1 flex items-center justify-center border border-[#e7e7e7] group-hover:border-[#f08804]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80"
                        alt="Grand Vitara"
                        className="max-h-full max-w-full object-cover rounded"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-[#0f1111] group-hover:text-[#c7511f] block">
                      Grand Vitara SUV
                    </span>
                  </Link>

                  <Link href="/cars" className="group block text-center">
                    <div className="aspect-[4/3] bg-[#f7f7f7] rounded p-1 mb-1 flex items-center justify-center border border-[#e7e7e7] group-hover:border-[#f08804]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=400&q=80"
                        alt="Fronx Turbo"
                        className="max-h-full max-w-full object-cover rounded"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-[#0f1111] group-hover:text-[#c7511f] block">
                      Fronx Turbo Coupe
                    </span>
                  </Link>
                </div>
              </div>

              <Link
                href="/cars"
                className="mt-4 text-xs font-semibold text-[#007185] hover:text-[#c7511f] hover:underline"
              >
                See Full Mauritius Vehicle Showcase →
              </Link>
            </div>

            {/* Card 3: Mauritius News & Carbon Policy */}
            <div className="amazon-card bg-white p-5 flex flex-col justify-between rounded-lg">
              <div>
                <h3 className="text-base font-extrabold text-[#0f1111] mb-1">
                  Mauritius News & Tech
                </h3>
                <p className="text-[11px] text-[#565959] mb-3">
                  Government policies & EV updates
                </p>

                <div className="space-y-3">
                  {news.slice(0, 2).map((item) => (
                    <Link
                      key={item.id}
                      href="/news"
                      className="group flex gap-2.5 items-start p-1 rounded hover:bg-[#f7f7f7]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-16 h-12 object-cover rounded flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-[#b12704] uppercase">
                          {item.category}
                        </span>
                        <h4 className="text-xs font-semibold text-[#0f1111] group-hover:text-[#c7511f] line-clamp-2 leading-tight">
                          {item.title}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <Link
                href="/news"
                className="mt-4 text-xs font-semibold text-[#007185] hover:text-[#c7511f] hover:underline"
              >
                Read All Automotive News ({news.length}) →
              </Link>
            </div>

            {/* Card 4: Mauritius Owners Community Forum */}
            <div className="amazon-card bg-white p-5 flex flex-col justify-between rounded-lg">
              <div>
                <h3 className="text-base font-extrabold text-[#0f1111] mb-1">
                  Suzuki Owners Forum
                </h3>
                <p className="text-[11px] text-[#565959] mb-3">
                  Discussions by local island drivers
                </p>

                <div className="space-y-2.5">
                  {threads.slice(0, 3).map((th) => (
                    <Link
                      key={th.id}
                      href={`/forum?thread=${th.id}`}
                      className="group block p-2 rounded bg-[#f7fafa] border border-[#e7e7e7] hover:border-[#f08804]"
                    >
                      <span className="text-[10px] font-bold text-[#007185]">
                        @{th.author_name}
                      </span>
                      <h4 className="text-xs font-semibold text-[#0f1111] group-hover:text-[#c7511f] line-clamp-1 leading-snug">
                        {th.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-[#565959] mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <MessageSquare className="w-3 h-3" />
                          <span>{th.replies_count} replies</span>
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <Link
                href="/forum"
                className="mt-4 text-xs font-semibold text-[#007185] hover:text-[#c7511f] hover:underline"
              >
                Join Community Discussions →
              </Link>
            </div>
          </div>
        )}

        {/* 3. Deal of the Day Banner */}
        <DealOfTheDay dealPart={dealPart} />

        {/* 4. Standing Condition & Primer Transparency Disclaimer Banner */}
        <div className="amazon-card p-4 sm:p-5 bg-[#fff8e7] border-2 border-[#fbd88e] rounded-lg text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#fa8900] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#b12704] flex items-center gap-1.5">
                <span>Standing Dealership Condition & Primer Disclaimer</span>
              </h3>
              <p className="text-[#0f1111] font-medium mt-0.5 leading-relaxed">
                &ldquo;{STANDING_CONDITION_DISCLAIMER}&rdquo;
              </p>
              <p className="text-[11px] text-[#565959] mt-0.5">
                All parts require final quote confirmation via WhatsApp or phone. Offline delivery or counter pickup available at Phoenix Depot.
              </p>
            </div>
          </div>

          <Link
            href="/news"
            className="px-4 py-2 rounded-full bg-white border border-[#d5d9d9] hover:bg-[#fafafa] font-bold text-xs text-[#0f1111] whitespace-nowrap self-end sm:self-auto shadow-xs"
          >
            Learn About Factory Primer →
          </Link>
        </div>

        {/* 5. Horizontal Product Rails (with left/right scroll arrows) */}
        {offerParts.length > 0 && (
          <ProductRail
            title="Dealership Special Offers & Promoted Inquiries"
            subtitle="Discounted reference quotes for fast-moving maintenance items in Mauritius"
            parts={offerParts}
            viewAllLink="/home"
          />
        )}

        <ProductRail
          title="Suzuki Body Panels in Factory Gray Primer"
          subtitle="Genuine replacement bumpers, hoods, and fenders ready for spray painting at certified body shops"
          parts={bodyPanels}
          viewAllLink="/home?category=Body+Panels"
        />

        <ProductRail
          title="Engine, Boosterjet Turbos & Drivetrain Kits"
          subtitle="K14C turbochargers, timing chains, DualJet clutch sets, and tropical engine oil filters"
          parts={engineParts}
          viewAllLink="/home?category=Engine+%26+Drivetrain"
        />

        <ProductRail
          title="Electrical, Smart Hybrid & LED Lighting"
          subtitle="Lithium batteries, hybrid inverters, LED projector lamps, and electronic ignition coils"
          parts={electricalParts}
          viewAllLink="/home?category=Electrical+%26+Lighting"
        />

        <ProductRail
          title="Suspension, AllGrip Pro & Off-Road Steering"
          subtitle="Heavy-duty struts, control arms, tie rod ends, and Jimny JB74 trail dampers"
          parts={suspensionParts}
          viewAllLink="/home?category=Suspension+%26+Steering"
        />

        <ProductRail
          title="Brakes, Friction Discs & ABS Sensors"
          subtitle="High-durability brake pads, ventilated discs, and wheel bearings tested for tropical coastlines"
          parts={brakeParts}
          viewAllLink="/home?category=Brakes+%26+Wheels"
        />

        <ProductRail
          title="Interior Styling, All-Weather Mats & Accessories"
          subtitle="Genuine Suzuki all-weather floor trays, dash armrests, roof rails, and cargo liners"
          parts={interiorParts}
          viewAllLink="/home?category=Interior+%26+Accessories"
        />

        {/* 6. "Why Buy Genuine Suzuki in Mauritius" Trust Reassurance Section */}
        <div className="amazon-card bg-white p-6 sm:p-8 rounded-lg border border-[#e7e7e7] space-y-5">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <span className="text-xs font-bold text-[#b12704] uppercase tracking-wider">
              Quality Assurance • Mauritius Network
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#0f1111]">
              Why Buy Genuine Suzuki Parts from Authorized Dealership
            </h2>
            <p className="text-xs text-[#565959]">
              Every component sold through our portal is cross-referenced with your chassis VIN number
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-[#f7fafa] border border-[#e7e7e7] space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#e8f4fd] text-[#007185] flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xs text-[#0f1111]">NLTA Fitness Certified</h3>
              <p className="text-[11px] text-[#565959] leading-relaxed">
                Passes all National Land Transport Authority annual vehicle fitness examinations without failing brake or suspension tests.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#f7fafa] border border-[#e7e7e7] space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#e8f4fd] text-[#007185] flex items-center justify-center font-bold">
                <Wrench className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xs text-[#0f1111]">Factory Gray Primer</h3>
              <p className="text-[11px] text-[#565959] leading-relaxed">
                Body parts arrive in electrostatic gray primer. Provides superior anti-corrosion barrier against island humidity and sea spray.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#f7fafa] border border-[#e7e7e7] space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#e8f4fd] text-[#007185] flex items-center justify-center font-bold">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xs text-[#0f1111]">AllGrip RHD Specification</h3>
              <p className="text-[11px] text-[#565959] leading-relaxed">
                All components are verified for right-hand-drive Mauritius specifications (Japan & Indian Maruti-Suzuki genuine lines).
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#f7fafa] border border-[#e7e7e7] space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#e8f4fd] text-[#007185] flex items-center justify-center font-bold">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xs text-[#0f1111]">WhatsApp Direct Quotes</h3>
              <p className="text-[11px] text-[#565959] leading-relaxed">
                No automated card charges. Our parts advisors chat directly on WhatsApp (+230 555-0199) to verify fitment and arrange delivery.
              </p>
            </div>
          </div>
        </div>

        {/* Explore Suzuki Mauritius Vehicle Lineup Carousel */}
        {cars.length > 0 && (
          <div className="amazon-card bg-white p-5 rounded-lg border border-[#e7e7e7]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#0f1111]">
                  Explore Suzuki Cars Showroom in Mauritius
                </h2>
                <p className="text-xs text-[#565959]">
                  View model specifications, fuel efficiency, and direct compatible genuine parts
                </p>
              </div>
              <Link
                href="/cars"
                className="text-xs font-semibold text-[#007185] hover:text-[#c7511f] hover:underline"
              >
                View All Vehicles ({cars.length}) →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cars.slice(0, 3).map((car) => (
                <div
                  key={car.id}
                  className="border border-[#e7e7e7] rounded-lg p-3.5 bg-white hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[16/10] bg-[#f7f7f7] rounded-md overflow-hidden mb-2.5 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={car.image_url}
                        alt={car.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-[#131921]/90 text-white text-[10px] font-bold">
                        {car.price_guide}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-[#0f1111]">{car.name}</h3>
                    <p className="text-xs text-[#c7511f] font-medium">{car.tagline}</p>
                    <p className="text-[11px] text-[#565959] mt-1 line-clamp-2">{car.description}</p>
                  </div>

                  <div className="pt-3 border-t border-[#f0f0f0] mt-3 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#2b8a3e]">
                      {car.specs.fuel_economy}
                    </span>
                    <Link
                      href={`/home?model=${encodeURIComponent(car.name.split(" ")[1] || car.name)}`}
                      className="text-xs font-bold text-[#007185] hover:text-[#c7511f] hover:underline"
                    >
                      Browse Compatible Parts →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Comprehensive Amazon-Style Multi-Column Footer */}
      <footer className="w-full bg-[#232f3e] text-white text-xs">
        {/* Back to Top Button */}
        <a
          href="#"
          className="block w-full py-3 bg-[#37475a] hover:bg-[#485769] text-center font-bold text-white text-xs transition-colors"
        >
          Back to top
        </a>

        {/* Directory Links */}
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-bold text-sm text-white mb-3">Get to Know Us</h4>
            <ul className="space-y-2 text-[#cccccc] text-xs">
              <li>
                <Link href="/home" className="hover:underline">
                  About Suzuki Mauritius
                </Link>
              </li>
              <li>
                <Link href="/cars" className="hover:underline">
                  Authorized Showroom
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:underline">
                  Customer Garage & Registry
                </Link>
              </li>
              <li>
                <span className="text-[#999999]">Phoenix Head Office Depot</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm text-white mb-3">Suzuki Cars Lineup</h4>
            <ul className="space-y-2 text-[#cccccc] text-xs">
              <li>
                <Link href="/cars" className="hover:underline">
                  Suzuki Swift (4th Gen Hybrid)
                </Link>
              </li>
              <li>
                <Link href="/cars" className="hover:underline">
                  Suzuki Jimny (3-Door & 5-Door)
                </Link>
              </li>
              <li>
                <Link href="/cars" className="hover:underline">
                  Suzuki Grand Vitara AllGrip
                </Link>
              </li>
              <li>
                <Link href="/cars" className="hover:underline">
                  Suzuki Fronx Turbo Coupe
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm text-white mb-3">Genuine Parts & Care</h4>
            <ul className="space-y-2 text-[#cccccc] text-xs">
              <li>
                <Link href="/home?category=Body+Panels" className="hover:underline">
                  Body Panels in Gray Primer
                </Link>
              </li>
              <li>
                <Link href="/news" className="hover:underline">
                  Primer Painting & Prep Guide
                </Link>
              </li>
              <li>
                <Link href="/home?category=Engine+%26+Drivetrain" className="hover:underline">
                  Boosterjet Turbo Maintenance
                </Link>
              </li>
              <li>
                <Link href="/forum" className="hover:underline">
                  Owner Community Discussions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm text-white mb-3">Customer Assistance</h4>
            <ul className="space-y-2 text-[#cccccc] text-xs">
              <li>
                <a href="tel:+2305550199" className="hover:underline text-[#febd69] font-bold">
                  Hotline: +230 555-0199
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/2305550199"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-[#febd69]"
                >
                  WhatsApp Parts Advisor
                </a>
              </li>
              <li>
                <Link href="/profile#inquiries" className="hover:underline">
                  Track Your Enquiries
                </Link>
              </li>
              <li>
                <span className="text-[#999999]">Phoenix • Port Louis • Grand Baie</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="border-t border-[#3a4553] py-6 px-4 text-center text-[#999999] text-[11px] bg-[#131921]">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-6 h-6 rounded bg-suzuki-red text-white flex items-center justify-center font-bold text-xs">
              S
            </div>
            <span className="font-bold text-white text-xs">suzuki.mu</span>
            <span className="text-[#cccccc]">| Deliver to Mauritius 🇲🇺</span>
          </div>
          <p>© 2026 Authorized Suzuki Customer Network Mauritius. All rights reserved.</p>
          <p className="mt-1 text-[#777777]">
            Price quotes shown are for indicative reference only. All body panels arrive in factory electro-primer ready for paint.
          </p>
        </div>
      </footer>
    </div>
  );
}
