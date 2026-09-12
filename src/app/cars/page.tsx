import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerNavbar } from "@/components/customer/Navbar";
import { getCachedCars } from "@/lib/catalog";
import { getOptimizedImageUrl } from "@/lib/images";
import { getCurrentProfile, getUserVehicles } from "@/lib/supabase/server";
import { ArrowRight, Check, Fuel, Gauge, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CarsShowcasePage() {
  const [profile, cars] = await Promise.all([getCurrentProfile(), getCachedCars()]);
  if (!profile) redirect("/");
  const vehicles = await getUserVehicles(profile.id);

  return (
    <div className="app-canvas min-h-screen text-[#1d1d1f]">
      <CustomerNavbar profile={profile} vehicleCount={vehicles.length} />

      <main className="mx-auto max-w-[1380px] space-y-10 px-4 pb-24 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-16">
        <section className="relative min-h-[510px] overflow-hidden rounded-[30px] bg-[#1d1d1f] shadow-[0_24px_70px_rgba(17,17,19,0.15)] sm:min-h-[560px] sm:rounded-[38px]">
          <Image src="/brand/vehicle-lineup.jpg" alt="A modern compact hatchback, SUV and rugged four-wheel-drive vehicle in a premium studio" fill preload sizes="(max-width: 1440px) 100vw, 1380px" className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/[0.83] via-black/5 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 z-10 max-w-3xl p-6 text-white sm:p-10 lg:p-14">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur-xl"><Sparkles className="h-3.5 w-3.5" /> Built around your drive</div>
            <h1 className="text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-[3.7rem]">Meet the Suzuki family.</h1>
            <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-white/72 sm:text-base">Compare the models on Mauritius roads, then jump straight to compatible parts for the vehicle you own.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/profile#garage" className="flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#1d1d1f]">Manage my garage <ArrowRight className="h-4 w-4" /></Link>
              <a href="https://wa.me/2305550199" target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 text-sm font-bold backdrop-blur-xl hover:bg-white/20"><MessageCircle className="h-4 w-4" /> Ask an advisor</a>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 px-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#e30613]">Vehicle guide</p>
            <h2 className="ios-section-title mt-1 text-3xl sm:text-4xl">Choose your drive</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6e6e73]">Clear specifications and direct access to matching parts. Add your actual vehicle in the garage for personalized fitment support.</p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {cars.map((car) => {
              const modelQuery = car.name.toLowerCase().includes("grand vitara") ? "Grand Vitara" : car.name.split(" ")[1] || car.name;
              return (
                <article key={car.id} className="ios-card group overflow-hidden rounded-[30px] transition duration-200 hover:-translate-y-1">
                  <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-white to-[#e9e9ec]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getOptimizedImageUrl(car.image_url, 900, 84)} alt={car.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]" />
                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/45 to-transparent" />
                    <span className="absolute bottom-4 left-4 rounded-full border border-white/25 bg-black/25 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur-xl">{car.price_guide}</span>
                  </div>

                  <div className="p-5 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#e30613]">{car.tagline}</p><h2 className="mt-1 text-2xl font-black tracking-[-0.035em]">{car.name}</h2></div>
                      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-[#f2f2f4] text-[#1d1d1f]"><ShieldCheck className="h-5 w-5" /></span>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-[#6e6e73]">{car.description}</p>

                    <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="rounded-2xl bg-[#f5f5f7] p-3"><Gauge className="mb-2 h-4 w-4 text-[#087cf0]" /><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#8e8e93]">Engine</p><p className="mt-1 text-[11px] font-bold leading-4">{car.specs.engine}</p></div>
                      <div className="rounded-2xl bg-[#f5f5f7] p-3"><Sparkles className="mb-2 h-4 w-4 text-[#e30613]" /><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#8e8e93]">Power</p><p className="mt-1 text-[11px] font-bold leading-4">{car.specs.power}</p></div>
                      <div className="rounded-2xl bg-[#f5f5f7] p-3"><Fuel className="mb-2 h-4 w-4 text-[#138a51]" /><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#8e8e93]">Efficiency</p><p className="mt-1 text-[11px] font-bold leading-4">{car.specs.fuel_economy}</p></div>
                      <div className="rounded-2xl bg-[#f5f5f7] p-3"><Check className="mb-2 h-4 w-4 text-[#7f52c5]" /><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#8e8e93]">Drive</p><p className="mt-1 text-[11px] font-bold leading-4">{car.specs.drive_type}</p></div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {car.features.slice(0, 4).map((feature) => <span key={feature} className="ios-chip rounded-full px-3 py-1.5 text-[10px] font-semibold text-[#6e6e73]">{feature}</span>)}
                    </div>

                    <div className="mt-6 flex flex-col gap-2 border-t border-black/[0.06] pt-5 sm:flex-row">
                      <Link href={`/home?model=${encodeURIComponent(modelQuery)}#all-parts`} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-5 text-xs font-bold text-white transition hover:bg-[#e30613]">Find compatible parts <ArrowRight className="h-4 w-4" /></Link>
                      <Link href="/profile#garage" className="flex min-h-11 items-center justify-center rounded-full bg-[#f2f2f4] px-5 text-xs font-bold text-[#1d1d1f] transition hover:bg-[#e9e9ec]">Add to garage</Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
