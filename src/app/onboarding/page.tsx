import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowRight, Car, CheckCircle2, ShieldCheck } from "lucide-react";
import { completeOnboarding } from "@/app/onboarding/actions";
import { getCurrentProfile, getUserVehicles } from "@/lib/supabase/server";
import { SUZUKI_MODELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/");

  const vehicles = await getUserVehicles(profile.id);
  if (vehicles.length) redirect("/home");

  const { error } = await searchParams;
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, index) => currentYear - index);

  return (
    <main className="app-canvas min-h-screen p-4 text-[#1d1d1f] sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between pb-4 sm:pb-6">
        <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#e30613] text-lg font-black text-white shadow-[0_7px_18px_rgba(227,6,19,0.2)]">S</span><div><p className="text-sm font-black tracking-[-0.02em]">Suzuki Mauritius</p><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#8e8e93]">Set up your garage</p></div></div>
        <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-[#6e6e73] shadow-sm ring-1 ring-black/[0.06]">One quick step</span>
      </div>

      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[34px] bg-white shadow-[0_28px_80px_rgba(17,17,19,0.12)] ring-1 ring-black/[0.05] lg:min-h-[720px] lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative min-h-[320px] overflow-hidden lg:min-h-full">
          <Image src="/brand/vehicle-lineup.jpg" alt="A lineup of compact vehicles ready to add to a personal garage" fill preload sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/[0.78] via-black/5 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-9">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xl"><Car className="h-5 w-5" /></span>
            <h1 className="mt-5 text-3xl font-black leading-tight tracking-[-0.045em] sm:text-4xl">Make every part request more accurate.</h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/70">Add your main Suzuki once. We will use it to make model selection and fitment conversations quicker.</p>
            <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-bold"><span className="rounded-full bg-white/12 px-3 py-1.5 backdrop-blur">Private garage</span><span className="rounded-full bg-white/12 px-3 py-1.5 backdrop-blur">Faster fitment</span><span className="rounded-full bg-white/12 px-3 py-1.5 backdrop-blur">Edit anytime</span></div>
          </div>
        </section>

        <section className="flex items-center p-6 sm:p-10 lg:p-14">
          <div className="w-full">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#e30613]">Welcome, {profile.full_name?.split(" ")[0] || "Driver"}</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] sm:text-4xl">Which Suzuki do you drive?</h2>
            <p className="mt-3 text-sm leading-6 text-[#6e6e73]">Start with your primary vehicle. You can add more vehicles from your profile later.</p>

            {error ? <div role="alert" className="mt-5 rounded-2xl bg-[#fff0f1] p-4 text-xs font-semibold text-[#b8000e]">{error === "missing_fields" ? "Choose your vehicle model and year to continue." : error === "invalid_year" ? "Choose a valid manufacture year." : "We could not save the vehicle yet. Please try once more."}</div> : null}

            <form action={completeOnboarding} className="mt-7 space-y-4">
              <input type="hidden" name="make" value="Suzuki" />
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#6e6e73]">Model</label>
                <select name="model" required defaultValue="" className="ios-field h-[52px] w-full rounded-2xl px-4 py-3.5 text-sm font-semibold"><option value="" disabled>Select your Suzuki</option>{SUZUKI_MODELS.map((model) => <option key={model} value={model}>{model}</option>)}</select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#6e6e73]">Manufacture year</label><select name="year" required defaultValue={currentYear} className="ios-field h-[52px] w-full rounded-2xl px-4 py-3.5 text-sm font-semibold">{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></div>
                <div><label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#6e6e73]">Plate number <span className="normal-case tracking-normal text-[#8e8e93]">(optional)</span></label><input type="text" name="registration_no" placeholder="e.g. 1234 ZM 23" className="ios-field h-[52px] w-full rounded-2xl px-4 py-3.5 text-sm font-semibold uppercase placeholder:normal-case" /></div>
              </div>
              <div><label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#6e6e73]">Phone or WhatsApp <span className="normal-case tracking-normal text-[#8e8e93]">(recommended)</span></label><input type="tel" name="phone" defaultValue={profile.phone || ""} placeholder="+230 5555 0199" className="ios-field h-[52px] w-full rounded-2xl px-4 py-3.5 text-sm font-semibold" /></div>
              <p className="flex items-start gap-2 rounded-2xl bg-[#e8f8ef] px-3.5 py-3 text-[10px] font-semibold leading-4 text-[#166b43]"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-none" /> Used only by the dealer team to confirm fitment and respond to your requests.</p>
              <button type="submit" className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#e30613] px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(227,6,19,0.22)] transition hover:-translate-y-0.5 hover:bg-[#c90010]">Save vehicle and continue <ArrowRight className="h-4 w-4" /></button>
              <p className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-[#8e8e93]"><CheckCircle2 className="h-3.5 w-3.5 text-[#138a51]" /> You can update this anytime in your garage</p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
