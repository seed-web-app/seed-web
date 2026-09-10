import Link from "next/link";
import { ShieldCheck, Wrench, Car, ArrowRight, Sparkles, CheckCircle2, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SplashPage() {
  return (
    <main className="min-h-screen bg-[#eaeded] flex flex-col justify-between font-sans selection:bg-[#ffd814] selection:text-black">
      {/* Top Header */}
      <header className="w-full bg-[#131921] border-b border-[#232f3e] px-4 sm:px-8 py-3.5 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-suzuki-red flex items-center justify-center font-black text-white text-xl shadow-sm">
            S
          </div>
          <div>
            <span className="font-extrabold tracking-tight text-lg text-white block leading-none">
              suzuki<span className="text-[#febd69]">.mu</span>
            </span>
            <span className="text-[10px] font-bold tracking-widest text-[#febd69] uppercase">
              Mauritius Owners Network
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 text-xs text-[#cccccc]">
            <MapPin className="w-3.5 h-3.5 text-[#febd69]" />
            <span>Mauritius 🇲🇺</span>
          </div>

          <Link
            href="/login"
            className="px-5 py-2 rounded-full btn-amazon-primary text-xs font-semibold text-[#0f1111] transition-all shadow-sm"
          >
            Sign In with Google
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#d5d9d9] text-[#c7511f] text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#f08804]" />
          <span>Exclusive for Suzuki Drivers in Mauritius</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#0f1111] max-w-3xl leading-tight mb-5">
          Genuine Suzuki Auto-Parts.
          <br />
          <span className="text-[#007185]">
            Direct Dealership Network.
          </span>
        </h1>

        <p className="max-w-2xl text-sm sm:text-base text-[#565959] mb-8 leading-relaxed font-normal">
          An Amazon-style dedicated platform connecting verified Suzuki owners across Mauritius
          with OEM body panels in factory gray primer, Boosterjet turbo maintenance kits, cars lineup specifications, and local owner community discussions.
        </p>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md">
          <Link
            href="/login"
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full btn-amazon-primary text-sm font-bold text-[#0f1111] shadow-md hover:shadow-lg transition-all"
          >
            <span>Enter Customer Network</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Value Pillars (Amazon White Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full mt-14 text-left">
          <div className="amazon-card bg-white p-6 flex flex-col">
            <div className="w-10 h-10 rounded-lg bg-[#fff8e7] text-[#c7511f] flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0f1111] mb-1.5">OEM Fitment & Specifications</h3>
            <p className="text-xs text-[#565959] leading-relaxed">
              Every part is cataloged for exact fitment on Swift, Jimny, Grand Vitara, Baleno, and Ertiga.
            </p>
          </div>

          <div className="amazon-card bg-white p-6 flex flex-col">
            <div className="w-10 h-10 rounded-lg bg-[#fff8e7] text-[#c7511f] flex items-center justify-center mb-3">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0f1111] mb-1.5">Factory Primer Transparency</h3>
            <p className="text-xs text-[#565959] leading-relaxed">
              All replacement body parts ship in protective gray primer ready for professional island paint matching.
            </p>
          </div>

          <div className="amazon-card bg-white p-6 flex flex-col">
            <div className="w-10 h-10 rounded-lg bg-[#fff8e7] text-[#c7511f] flex items-center justify-center mb-3">
              <Car className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0f1111] mb-1.5">Dealer Direct Follow-Up</h3>
            <p className="text-xs text-[#565959] leading-relaxed">
              Submit your parts enquiry with one click. Dealership parts specialists connect via WhatsApp or phone.
            </p>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-[#565959]">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#2b8a3e]" />
            <span>Google Single Sign-On</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#2b8a3e]" />
            <span>Private Mauritius Garage</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#2b8a3e]" />
            <span>Community Owner Forum</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-[#131921] border-t border-[#232f3e] py-6 text-center text-xs text-[#999999]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Authorized Suzuki Customer Network Mauritius. All rights reserved.</p>
          <div className="flex gap-4 text-[#cccccc]">
            <span>Phoenix • Port Louis • Grand Baie • Curepipe</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
