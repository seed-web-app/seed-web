import { redirect } from "next/navigation";
import { getCurrentProfile, getUserVehicles } from "@/lib/supabase/server";
import { completeOnboarding } from "@/app/onboarding/actions";
import { SUZUKI_MODELS } from "@/lib/types";
import { Car, ShieldCheck, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const vehicles = await getUserVehicles(profile.id);
  // If user already has a registered vehicle, take them directly to home
  if (vehicles.length > 0) {
    redirect("/home");
  }

  const { error } = await searchParams;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <main className="min-h-screen bg-carbon-pattern flex flex-col justify-between p-6">
      {/* Top Header */}
      <div className="w-full max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-suzuki-red flex items-center justify-center font-black text-white text-sm">
            S
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
            Owner Onboarding
          </span>
        </div>
        <span className="text-xs text-slate-500 font-mono">Step 1 of 1</span>
      </div>

      {/* Center Onboarding Card */}
      <div className="w-full max-w-xl mx-auto my-10">
        <div className="p-8 sm:p-10 rounded-3xl bg-glass border border-white/10 shadow-2xl shadow-black/80">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-suzuki-red/15 border border-suzuki-red/30 text-suzuki-brightred mb-4">
              <Car className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Register Your Suzuki
            </h1>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Welcome, <span className="text-white font-semibold">{profile.full_name}</span>. Link your
              vehicle so our parts catalog can highlight guaranteed compatible components and our dealer
              specialists know exactly what fits your car.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              {error === "missing_fields"
                ? "Please choose your vehicle model and manufacture year."
                : error === "invalid_year"
                ? "Please select a valid manufacture year."
                : "We could not save your vehicle. Nothing was lost—please try again."}
            </div>
          )}

          <form action={completeOnboarding} className="space-y-5">
            {/* Make (Fixed Suzuki) */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Make
              </label>
              <input
                type="text"
                name="make"
                value="Suzuki"
                readOnly
                className="w-full px-4 py-3 rounded-xl bg-suzuki-slate/60 border border-white/10 text-slate-300 text-sm font-medium cursor-not-allowed"
              />
            </div>

            {/* Model & Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Model <span className="text-suzuki-red">*</span>
                </label>
                <select
                  name="model"
                  required
                  defaultValue=""
                  className="w-full px-4 py-3 rounded-xl bg-suzuki-slate/90 border border-white/15 text-white text-sm focus:border-suzuki-red focus:outline-none transition-colors"
                >
                  <option value="" disabled className="bg-suzuki-black text-slate-400">
                    Select your Suzuki model
                  </option>
                  {SUZUKI_MODELS.map((m) => (
                    <option key={m} value={m} className="bg-suzuki-black text-white">
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Manufacture Year <span className="text-suzuki-red">*</span>
                </label>
                <select
                  name="year"
                  required
                  defaultValue={currentYear}
                  className="w-full px-4 py-3 rounded-xl bg-suzuki-slate/90 border border-white/15 text-white text-sm focus:border-suzuki-red focus:outline-none transition-colors"
                >
                  {years.map((y) => (
                    <option key={y} value={y} className="bg-suzuki-black text-white">
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Registration Number (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Registration / Plate #
                </label>
                <span className="text-[11px] text-slate-400">Optional</span>
              </div>
              <input
                type="text"
                name="registration_no"
                placeholder="e.g. DL-04-AB-1234 or chassis suffix"
                className="w-full px-4 py-3 rounded-xl bg-suzuki-slate/90 border border-white/15 text-white text-sm placeholder:text-slate-400 focus:border-suzuki-red focus:outline-none transition-colors uppercase"
              />
            </div>

            {/* Contact Phone (for Dealer Offline Follow-up) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Contact Phone / WhatsApp
                </label>
                <span className="text-[11px] text-amber-400">Recommended for lead updates</span>
              </div>
              <input
                type="tel"
                name="phone"
                defaultValue={profile.phone || ""}
                placeholder="e.g. +1 (555) 019-2834"
                className="w-full px-4 py-3 rounded-xl bg-suzuki-slate/90 border border-white/15 text-white text-sm placeholder:text-slate-400 focus:border-suzuki-red focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Our dealership team uses this number to confirm fitment & coordinate offline dispatch.</span>
              </p>
            </div>

            <button
              type="submit"
              className="w-full mt-4 flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-suzuki-red hover:bg-suzuki-brightred text-white font-bold text-sm shadow-xl shadow-suzuki-red/30 transition-all duration-200 cursor-pointer"
            >
              <span>Save Vehicle & Enter Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="w-full text-center text-xs text-slate-600">
        You can add more Suzuki vehicles to your garage anytime in your profile.
      </div>
    </main>
  );
}
