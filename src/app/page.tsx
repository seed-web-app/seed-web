import Link from "next/link";
import { ShieldCheck, Wrench, Car, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SplashPage() {
  return (
    <main className="min-h-screen bg-carbon-pattern flex flex-col justify-between selection:bg-suzuki-red selection:text-white">
      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-suzuki-red flex items-center justify-center font-black text-white text-2xl tracking-tighter shadow-lg shadow-suzuki-red/30">
            S
          </div>
          <div>
            <span className="font-extrabold tracking-wider text-lg text-white uppercase block leading-none">
              Suzuki Parts Network
            </span>
            <span className="text-[11px] font-medium tracking-widest text-suzuki-muted uppercase">
              Authorized Dealer Direct
            </span>
          </div>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-suzuki-slate/90 hover:bg-suzuki-slate text-sm font-semibold text-white border border-white/10 hover:border-suzuki-red/50 transition-all duration-200 shadow-md"
        >
          <span>Sign In</span>
          <ArrowRight className="w-4 h-4 text-suzuki-red" />
        </Link>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-6xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-suzuki-red/10 border border-suzuki-red/25 text-suzuki-brightred text-xs font-semibold tracking-wide uppercase mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Exclusive Suzuki Owners & Parts Dealer Network</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white max-w-4xl leading-[1.08] mb-6">
          Genuine Suzuki Parts.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-suzuki-red via-red-500 to-amber-500">
            Direct from the Dealer.
          </span>
        </h1>

        <p className="max-w-2xl text-base sm:text-lg text-slate-300 mb-10 leading-relaxed font-normal">
          A dedicated owner network connecting verified Suzuki drivers with factory body panels,
          OEM mechanical components, and dealership service specialists. Request parts directly
          with zero hassle.
        </p>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md">
          <Link
            href="/login"
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-suzuki-red hover:bg-suzuki-brightred text-white text-base font-bold shadow-xl shadow-suzuki-red/30 hover:shadow-suzuki-red/50 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <span>Enter Customer Network</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-16 text-left">
          <div className="p-6 rounded-2xl bg-glass-card border border-white/5 flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-suzuki-red/10 border border-suzuki-red/20 flex items-center justify-center mb-4 text-suzuki-red">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">OEM Certified Fitment</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every body panel, headlamp, and mechanical part is cataloged for exact fitment on
              Swift, Jimny, Grand Vitara, Baleno, and more.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-glass-card border border-white/5 flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Factory Primer Transparency</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Clear condition disclaimers on every panel. Body parts arrive in electro-deposit gray
              primer ready for custom paint matching.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-glass-card border border-white/5 flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
              <Car className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Direct Dealer Follow-Up</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              No online checkout or automated bots. Submit a request and our dealership parts
              specialists connect directly via WhatsApp or phone.
            </p>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Google Single Sign-On</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Private Customer Garage</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Real-time Inquiry Tracking</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Authorized Dealer Direct</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Authorized Suzuki Auto-Parts Dealer Network. All rights reserved.</p>
          <div className="flex gap-6">
            <span>Swift • Jimny • Grand Vitara • Baleno • Ertiga • Brezza</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
