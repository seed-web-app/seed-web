import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile, getUserVehicles, createSupabaseServerClient } from "@/lib/supabase/server";
import { CustomerNavbar } from "@/components/customer/Navbar";
import { STANDING_CONDITION_DISCLAIMER } from "@/lib/types";
import type { Part, CarModel, NewsArticle, ForumThread } from "@/lib/types";
import {
  AlertTriangle,
  Star,
  Check,
  Car,
  Newspaper,
  MessageSquare,
  ChevronRight,
  Send,
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
    ? await supabase.from("car_models").select("*").limit(4)
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
  const bodyPanels = parts.filter((p) => p.category === "Body Panels");
  const engineParts = parts.filter((p) => p.category === "Engine & Drivetrain");
  const electricalParts = parts.filter((p) => p.category === "Electrical & Lighting");
  const suspensionParts = parts.filter((p) => p.category === "Suspension & Steering");
  const brakeParts = parts.filter((p) => p.category === "Brakes & Wheels");
  const interiorParts = parts.filter((p) => p.category === "Interior & Accessories");

  return (
    <div className="min-h-screen bg-[#eaeded] flex flex-col selection:bg-[#ffd814] selection:text-black">
      <CustomerNavbar
        profile={profile}
        vehicleCount={vehicles.length}
        inquiryCount={inquiryCount || 0}
      />

      <main className="flex-1 max-w-[1500px] w-full mx-auto px-2 sm:px-4 lg:px-6 pb-12 space-y-5">
        {/* Amazon Hero Banner Section (Shown when no search filter active) */}
        {!isFiltered && (
          <div className="relative w-full rounded-b-lg overflow-hidden bg-gradient-to-b from-[#232f3e] to-[#eaeded] pt-4 pb-20 sm:pb-32 px-4 sm:px-8 text-white">
            <div className="max-w-4xl space-y-2">
              <span className="inline-block bg-[#f08804] text-white font-bold text-[11px] px-2.5 py-0.5 rounded tracking-wider uppercase">
                Suzuki Mauritius Customer Network
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Welcome to Suzuki Mauritius Parts & Owner Portal
              </h1>
              <p className="text-xs sm:text-sm text-[#e3e6e6] max-w-2xl leading-relaxed">
                Explore OEM replacement panels in gray primer, high-performance turbo kits, and genuine accessories for your Swift, Jimny, Grand Vitara, and Fronx. Connect with dealership parts desks across Phoenix and Port Louis.
              </p>
            </div>

            {/* Quick Vehicle Indicator in Hero */}
            {vehicles.length > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 bg-[#131921]/80 backdrop-blur-sm border border-[#3a4553] px-3.5 py-1.5 rounded-md text-xs">
                <Car className="w-4 h-4 text-[#febd69]" />
                <span className="text-[#cccccc]">Registered in Your Garage:</span>
                <span className="font-bold text-white">
                  {vehicles[0].year} {vehicles[0].make} {vehicles[0].model}
                </span>
                <Link href="/profile" className="ml-2 text-[#febd69] hover:underline">
                  Change / Add →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Amazon 4-in-1 Card Grid (Overlaps the hero gradient) */}
        {!isFiltered && (
          <div className="-mt-16 sm:-mt-24 relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Explore Suzuki Mauritius Cars */}
            <div className="amazon-card p-4 flex flex-col justify-between space-y-3 bg-white">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#0f1111] leading-snug">
                  Explore Suzuki Cars in Mauritius
                </h2>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {cars.slice(0, 4).map((car) => (
                    <Link
                      key={car.id}
                      href="/cars"
                      className="group flex flex-col text-left text-xs"
                    >
                      <div className="aspect-[4/3] bg-[#f7f7f7] rounded overflow-hidden mb-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={car.image_url}
                          alt={car.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <span className="font-bold text-[11px] text-[#0f1111] truncate group-hover:text-[#c7511f]">
                        {car.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
              <Link
                href="/cars"
                className="text-xs font-semibold text-[#007185] hover:text-[#c7511f] hover:underline flex items-center gap-1"
              >
                <span>See all Suzuki models & specs</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 2: Auto-Parts by Category */}
            <div className="amazon-card p-4 flex flex-col justify-between space-y-3 bg-white">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#0f1111] leading-snug">
                  Parts by Category (60+ Parts)
                </h2>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {[
                    { label: "Body Panels (Primer)", cat: "Body Panels", img: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80" },
                    { label: "Engine & Turbo", cat: "Engine & Drivetrain", img: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=400&q=80" },
                    { label: "Lighting & LEDs", cat: "Electrical & Lighting", img: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=400&q=80" },
                    { label: "Suspension Kits", cat: "Suspension & Steering", img: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80" },
                  ].map((item) => (
                    <Link
                      key={item.cat}
                      href={`/home?category=${encodeURIComponent(item.cat)}`}
                      className="group flex flex-col text-left text-xs"
                    >
                      <div className="aspect-[4/3] bg-[#f7f7f7] rounded overflow-hidden mb-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.img}
                          alt={item.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <span className="font-bold text-[11px] text-[#0f1111] truncate group-hover:text-[#c7511f]">
                        {item.label}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
              <Link
                href="/home"
                className="text-xs font-semibold text-[#007185] hover:text-[#c7511f] hover:underline flex items-center gap-1"
              >
                <span>Explore all 6 categories</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 3: Mauritius News & Car Policies */}
            <div className="amazon-card p-4 flex flex-col justify-between space-y-3 bg-white">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#0f1111] leading-snug flex items-center gap-1.5">
                  <Newspaper className="w-4 h-4 text-[#c7511f]" />
                  <span>Mauritius News & Tech</span>
                </h2>
                <div className="space-y-2.5 mt-3">
                  {news.slice(0, 3).map((n) => (
                    <Link
                      key={n.id}
                      href="/news"
                      className="group block text-left border-b border-[#f0f0f0] pb-2 last:border-0"
                    >
                      <span className="text-[10px] uppercase font-bold text-[#c7511f] tracking-wide block">
                        {n.category}
                      </span>
                      <p className="font-bold text-xs text-[#0f1111] line-clamp-2 group-hover:text-[#007185]">
                        {n.title}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
              <Link
                href="/news"
                className="text-xs font-semibold text-[#007185] hover:text-[#c7511f] hover:underline flex items-center gap-1"
              >
                <span>Read all policy & tech articles</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 4: Community Forum */}
            <div className="amazon-card p-4 flex flex-col justify-between space-y-3 bg-white">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#0f1111] leading-snug flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#f08804]" />
                  <span>Owner Community Forum</span>
                </h2>
                <div className="space-y-2.5 mt-3">
                  {threads.slice(0, 3).map((th) => (
                    <Link
                      key={th.id}
                      href="/forum"
                      className="group block text-left border-b border-[#f0f0f0] pb-2 last:border-0"
                    >
                      <p className="font-bold text-xs text-[#0f1111] line-clamp-2 group-hover:text-[#007185]">
                        {th.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-[#565959] mt-0.5">
                        <span>by @{th.author_name}</span>
                        <span>•</span>
                        <span>{th.replies_count} replies</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              <Link
                href="/forum"
                className="text-xs font-semibold text-[#007185] hover:text-[#c7511f] hover:underline flex items-center gap-1"
              >
                <span>Join Mauritius owners discussions</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Standing Condition Disclaimer Banner */}
        <div className="amazon-card p-4 bg-[#fff8e7] border border-[#fbd88e] flex items-start gap-3.5">
          <div className="p-2 rounded bg-[#f08804]/20 text-[#b12704] flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[#b12704] text-[11px]">
                Standing Condition Notice & Mauritius Dealership Disclaimer
              </span>
            </div>
            <p className="font-semibold text-[#0f1111] text-sm leading-snug">
              &ldquo;{STANDING_CONDITION_DISCLAIMER}&rdquo;
            </p>
            <p className="text-[#565959] leading-relaxed text-[11px]">
              Prices shown in this portal are for dealer reference only (estimated MUR conversion: $1 USD ≈ 46 MUR). Inquiries are routed directly to authorized parts desks in Phoenix & Port Louis for offline fitment confirmation.
            </p>
          </div>
        </div>

        {/* Filter / Search Feedback Bar */}
        {isFiltered && (
          <div className="amazon-card p-3.5 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#0f1111]">
              <span className="font-bold">{parts.length} results</span>
              {q && (
                <span>
                  for <strong className="text-[#c7511f]">&ldquo;{q}&rdquo;</strong>
                </span>
              )}
              {category && category !== "All" && (
                <span>
                  in <strong className="text-[#007185]">{category}</strong>
                </span>
              )}
              {model && model !== "All" && (
                <span>
                  compatible with <strong className="text-[#007185]">{model}</strong>
                </span>
              )}
            </div>
            <Link
              href="/home"
              className="text-xs font-bold text-[#007185] hover:text-[#c7511f] hover:underline"
            >
              Clear all filters
            </Link>
          </div>
        )}

        {/* IF FILTERED: Show standard Amazon product grid */}
        {isFiltered ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {parts.map((part) => (
              <ProductCard key={part.id} part={part} />
            ))}
          </div>
        ) : (
          /* IF HOMEPAGE DASHBOARD: Show Horizontal Product Recommendation Rails */
          <div className="space-y-6">
            {/* Rail 1: Hot Deals & Promotional Offers */}
            {offerParts.length > 0 && (
              <ProductRail
                title="Special Deals & Featured Offers"
                subtitle="Limited promotional allocations direct from dealership inventory"
                parts={offerParts}
                linkHref="/home"
              />
            )}

            {/* Rail 2: Body Panels (Gray Primer) */}
            <ProductRail
              title="Factory Gray Primer Body Panels"
              subtitle="Bumpers, grilles, fenders and spoilers shipped in protective primer for custom paint matching"
              parts={bodyPanels}
              linkHref="/home?category=Body+Panels"
            />

            {/* Rail 3: Engine & Drivetrain Kits */}
            <ProductRail
              title="Engine Components, Turbo & Service Kits"
              subtitle="Genuine Boosterjet K14C, Dualjet K12M, and K15B factory maintenance parts"
              parts={engineParts}
              linkHref="/home?category=Engine+%26+Drivetrain"
            />

            {/* Rail 4: Electrical & Lighting */}
            <ProductRail
              title="Electrical, Projector LEDs & Hybrid Sensors"
              subtitle="OEM headlamp units, DRLs, starter alternators, and 12V lithium-ion hybrid batteries"
              parts={electricalParts}
              linkHref="/home?category=Electrical+%26+Lighting"
            />

            {/* Rail 5: Suspension & Steering */}
            <ProductRail
              title="Heavy-Duty Suspension & Off-Road Upgrades"
              subtitle="Lift kits, Monroe sports dampers, steering dampers, and control arms"
              parts={suspensionParts}
              linkHref="/home?category=Suspension+%26+Steering"
            />

            {/* Rail 6: Brakes & Wheels */}
            <ProductRail
              title="Brakes, Ceramic Pads & Factory Alloy Wheels"
              subtitle="High-carbon ventilated rotors, low-dust ceramic pads, and Jimny steel wheels"
              parts={brakeParts}
              linkHref="/home?category=Brakes+%26+Wheels"
            />

            {/* Rail 7: Interior & Island Accessories */}
            <ProductRail
              title="Interior Accessories & Island Touring Gear"
              subtitle="3D all-weather rubber mats, roof racks, touchscreens, and canvas seat protectors"
              parts={interiorParts}
              linkHref="/home?category=Interior+%26+Accessories"
            />
          </div>
        )}
      </main>
    </div>
  );
}

// Sub-component: Amazon Horizontal Product Rail
function ProductRail({
  title,
  subtitle,
  parts,
  linkHref,
}: {
  title: string;
  subtitle?: string;
  parts: Part[];
  linkHref: string;
}) {
  if (parts.length === 0) return null;

  return (
    <section className="amazon-card p-4 sm:p-5 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-3 border-b border-[#f0f0f0] pb-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0f1111]">{title}</h2>
          {subtitle && <p className="text-xs text-[#565959] mt-0.5">{subtitle}</p>}
        </div>
        <Link
          href={linkHref}
          className="text-xs font-semibold text-[#007185] hover:text-[#c7511f] hover:underline mt-1 sm:mt-0 flex items-center gap-0.5"
        >
          <span>See all in this category</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Scrollable Track */}
      <div className="flex gap-4 overflow-x-auto horizontal-scroll pb-3 pt-1">
        {parts.map((part) => (
          <div key={part.id} className="w-60 sm:w-64 flex-shrink-0 flex flex-col justify-between">
            <ProductCard part={part} isRail />
          </div>
        ))}
      </div>
    </section>
  );
}

// Sub-component: Amazon Product Card
function ProductCard({ part, isRail = false }: { part: Part; isRail?: boolean }) {
  const murPrice = Math.round(part.price * 46);

  return (
    <div className={`amazon-card bg-white p-3 flex flex-col justify-between h-full group ${isRail ? "border border-[#e7e7e7]" : ""}`}>
      <div>
        {/* Photo Container */}
        <Link href={`/parts/${part.id}`} className="block relative aspect-[4/3] bg-[#f7f7f7] rounded overflow-hidden mb-2">
          {part.photos && part.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={part.photos[0]}
              alt={part.name}
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-[#565959]">
              No photo
            </div>
          )}

          {part.is_offer && (
            <span className="absolute top-2 left-2 bg-[#cc0c39] text-white text-[10px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase">
              Deal
            </span>
          )}
        </Link>

        {/* Title */}
        <Link href={`/parts/${part.id}`}>
          <h3 className="text-xs sm:text-sm font-medium text-[#0f1111] group-hover:text-[#c7511f] line-clamp-2 leading-snug">
            {part.name}
          </h3>
        </Link>

        {/* Star rating placeholder */}
        <div className="flex items-center gap-1 mt-1">
          <div className="flex text-[#de7921]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-current" />
            ))}
          </div>
          <span className="text-[11px] text-[#007185] font-medium">4.9</span>
          <span className="text-[10px] text-[#565959]">(Verified)</span>
        </div>

        {/* Compatible Models pill */}
        {part.compatible_models && part.compatible_models.length > 0 && (
          <p className="text-[10px] text-[#565959] mt-1 truncate">
            Fits: <strong className="text-[#0f1111]">{part.compatible_models.slice(0, 2).join(", ")}</strong>
          </p>
        )}

        {/* Dealer Prime-style badge */}
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-[#007185] font-bold">
          <Check className="w-3.5 h-3.5 text-[#f08804] stroke-[3]" />
          <span>Dealer Direct Mauritius</span>
        </div>

        {/* Price display */}
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-xs text-[#565959] font-normal">Ref:</span>
          <span className="text-base sm:text-lg font-bold text-[#0f1111]">
            ${Number(part.price).toFixed(2)}
          </span>
          <span className="text-[11px] text-[#565959]">
            (~Rs {murPrice.toLocaleString()})
          </span>
        </div>

        {/* Primer note preview if body part */}
        {part.category === "Body Panels" && (
          <p className="text-[10px] text-[#b12704] mt-1 line-clamp-1 italic">
            * Ships in gray primer coat
          </p>
        )}
      </div>

      {/* Amazon Golden Action Button: Enquire This Part */}
      <div className="mt-3 pt-2 border-t border-[#f0f0f0]">
        <Link
          href={`/parts/${part.id}`}
          className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full btn-amazon-primary text-xs font-semibold cursor-pointer text-center"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Enquire This Part</span>
        </Link>
      </div>
    </div>
  );
}
