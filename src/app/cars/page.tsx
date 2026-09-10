import Link from "next/link";
import { getCurrentProfile, getUserVehicles, createSupabaseServerClient } from "@/lib/supabase/server";
import { CustomerNavbar } from "@/components/customer/Navbar";
import type { CarModel } from "@/lib/types";
import {
  Car,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Phone,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CarsShowcasePage() {
  const profile = await getCurrentProfile();
  const vehicles = profile ? await getUserVehicles(profile.id) : [];
  const supabase = await createSupabaseServerClient();

  const { data: rawCars } = supabase
    ? await supabase.from("car_models").select("*").order("name")
    : { data: [] };

  const cars = (rawCars as CarModel[]) || [];

  return (
    <div className="min-h-screen bg-[#eaeded] flex flex-col font-sans selection:bg-[#ffd814] selection:text-black">
      <CustomerNavbar profile={profile} vehicleCount={vehicles.length} />

      <main className="flex-1 max-w-[1450px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner Header */}
        <div className="amazon-card p-6 sm:p-8 bg-gradient-to-r from-[#131921] to-[#232f3e] text-white">
          <div className="max-w-3xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#f08804] text-[#111111] font-bold text-[10px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mauritius Authorized Dealership Lineup</span>
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Suzuki Mauritius Vehicles & Specifications
            </h1>
            <p className="text-xs sm:text-sm text-[#cccccc] leading-relaxed">
              Explore full technical specifications, hybrid fuel efficiency ratings, AllGrip 4WD systems, and browse dedicated OEM replacement parts for every Suzuki model on Mauritius roads.
            </p>
          </div>
        </div>

        {/* Cars List Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cars.map((car) => (
            <div
              key={car.id}
              className="amazon-card bg-white p-5 sm:p-6 flex flex-col justify-between space-y-5"
            >
              <div>
                {/* Photo */}
                <div className="aspect-[16/10] bg-[#f7f7f7] rounded-lg overflow-hidden relative mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={car.image_url}
                    alt={car.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 right-3 bg-[#131921]/90 backdrop-blur-md px-3 py-1 rounded text-white text-xs font-bold">
                    {car.price_guide}
                  </div>
                </div>

                {/* Title & Tagline */}
                <div>
                  <h2 className="text-xl font-bold text-[#0f1111]">{car.name}</h2>
                  <p className="text-xs font-medium text-[#c7511f] mt-0.5">{car.tagline}</p>
                  <p className="text-xs text-[#565959] mt-2 leading-relaxed">{car.description}</p>
                </div>

                {/* Specs Box */}
                <div className="mt-4 p-3.5 rounded-lg bg-[#f7fafa] border border-[#e7e7e7] grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#565959] block">
                      Engine
                    </span>
                    <span className="font-semibold text-[#0f1111] leading-tight block">
                      {car.specs.engine}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#565959] block">
                      Power
                    </span>
                    <span className="font-semibold text-[#0f1111] leading-tight block">
                      {car.specs.power}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#565959] block">
                      Fuel Economy
                    </span>
                    <span className="font-semibold text-[#2b8a3e] leading-tight block">
                      {car.specs.fuel_economy}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#565959] block">
                      Drive Type
                    </span>
                    <span className="font-semibold text-[#0f1111] leading-tight block">
                      {car.specs.drive_type}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-2">
                    <span className="text-[10px] uppercase font-bold text-[#565959] block">
                      Transmission
                    </span>
                    <span className="font-semibold text-[#0f1111] leading-tight block">
                      {car.specs.transmission}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <div className="mt-4">
                  <span className="text-[11px] uppercase font-bold text-[#565959] tracking-wider block mb-2">
                    Standard Equipment & Features:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#0f1111]">
                    {car.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2b8a3e] flex-shrink-0" />
                        <span className="text-[11px] truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-[#f0f0f0] flex flex-col sm:flex-row items-center gap-3 justify-between">
                <Link
                  href={`/home?model=${encodeURIComponent(
                    car.name.toLowerCase().includes("grand vitara")
                      ? "Grand Vitara"
                      : car.name.split(" ")[1] || car.name
                  )}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-full btn-amazon-primary text-xs font-semibold"
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Browse Compatible Parts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <a
                  href="https://wa.me/2305550199"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-full btn-amazon-outline text-xs font-semibold"
                >
                  <Phone className="w-3.5 h-3.5 text-[#2b8a3e]" />
                  <span>Ask Dealership Rep</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
