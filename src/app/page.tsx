import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/supabase/server";
import { signInWithGoogle } from "@/app/auth/actions";
import { ShieldCheck, Wrench, MapPin, MessageSquare, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

const errorDescriptions: Record<string, string> = {
  auth: "Authentication service is temporarily unavailable. Please try again.",
  oauth: "Google sign-in could not be initiated. Please verify your connection.",
  no_code: "No authentication code returned by Google.",
  exchange_failed: "Session verification failed. Please try signing in again.",
  user_verification_failed: "Could not verify your customer profile.",
  unauthorized: "Access restricted to verified Suzuki Mauritius members.",
};

export default async function RootPage({ searchParams }: PageProps) {
  const profile = await getCurrentProfile();

  // If already authenticated, redirect straight to their respective dashboard
  if (profile) {
    if (profile.role === "admin") {
      redirect("/admin");
    }
    redirect("/home");
  }

  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-[#eaeded] flex flex-col justify-between font-sans selection:bg-[#ffd814] selection:text-black">
      {/* 1. Header: Clean Official Application Header */}
      <header className="w-full bg-[#131921] border-b border-[#232f3e] px-4 sm:px-8 py-3.5 select-none shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded bg-suzuki-red flex items-center justify-center font-black text-white text-xl shadow-md">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-white leading-none">
                suzuki<span className="text-[#febd69]">.mu</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#febd69] font-bold">
                Mauritius
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#232f3e] border border-white/10 text-white text-xs font-semibold">
              <span className="text-base leading-none">🇲🇺</span>
              <span className="hidden sm:inline">Official Customer Network</span>
              <span className="sm:hidden">Network</span>
            </span>
          </div>
        </div>
      </header>

      {/* 2. Main Center: Google Sign-In Card (Application Login Screen) */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md bg-white border border-[#d5d9d9] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Emblem & Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fcf5e8] border border-[#fbd88e] text-[#b12704] text-[11px] font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Authorized Dealership Network</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f1111] tracking-tight">
              Sign In to Your Suzuki Portal
            </h1>
            <p className="text-xs sm:text-sm text-[#565959] leading-relaxed">
              Connect with the authorized Suzuki dealership in Mauritius. Sign in with Google to access genuine parts, request quotes, and manage your garage.
            </p>
          </div>

          {/* Error Message Display if OAuth Failed */}
          {error && (
            <div className="p-3.5 rounded-xl bg-[#fdf3f2] border border-[#d9381e] flex items-start gap-2.5 text-[#d9381e] text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="font-medium">
                {errorDescriptions[error] || "Sign-in failed. Please try again."}
              </span>
            </div>
          )}

          {/* Google Sign-In Action */}
          <form action={signInWithGoogle} className="space-y-4 pt-1">
            <button
              type="submit"
              className="w-full min-h-[48px] py-3 px-5 rounded-full btn-amazon-primary text-sm font-bold text-[#0f1111] flex items-center justify-center gap-3 shadow-md hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer border border-[#fcd200]"
            >
              {/* Google Colored Logo */}
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>

          {/* Network Features Breakdown */}
          <div className="pt-4 border-t border-[#e7e7e7] space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#565959] block">
              What&apos;s Inside the Network:
            </span>

            <div className="space-y-2.5 text-xs text-[#0f1111]">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#f0f2f2] flex items-center justify-center flex-shrink-0 mt-0.5 text-[#007185]">
                  <Wrench className="w-3 h-3" />
                </div>
                <span>
                  <strong>Genuine Suzuki Parts Catalog</strong>: 68+ genuine components with transparent Mauritian Rupee reference quotes.
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#f0f2f2] flex items-center justify-center flex-shrink-0 mt-0.5 text-[#2b8a3e]">
                  <MapPin className="w-3 h-3" />
                </div>
                <span>
                  <strong>Phoenix & Port Louis Depots</strong>: Certified VIN fitment check, warehouse pickup & authorized workshop fitting.
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#f0f2f2] flex items-center justify-center flex-shrink-0 mt-0.5 text-[#b12704]">
                  <MessageSquare className="w-3 h-3" />
                </div>
                <span>
                  <strong>Mauritius Owners Community</strong>: Technical maintenance protocols, car news, and direct WhatsApp parts desk.
                </span>
              </div>
            </div>
          </div>

          {/* Access Policy Note */}
          <div className="pt-3 border-t border-[#f0f0f0] text-[11px] text-[#565959] leading-relaxed text-center">
            🔒 Private customer network. Google sign-in is required before viewing inventory or participating in community forums.
          </div>
        </div>
      </main>

      {/* 3. Footer: Official Mauritius Dealership Notice */}
      <footer className="bg-white border-t border-[#e7e7e7] py-4 px-4 text-center text-xs text-[#565959] space-y-1">
        <p className="font-semibold text-[#0f1111]">
          Authorized Suzuki Dealership Parts & Service Network — Mauritius
        </p>
        <p className="text-[11px]">
          Phoenix Central Hub • Port Louis Harbour Desk • Centre de Flacq • Grand Baie
        </p>
        <p className="text-[10px] text-[#888888] pt-1">
          © {new Date().getFullYear()} Suzuki Mauritius. All rights reserved. Customer Connection Network (Offline Fulfillment).
        </p>
      </footer>
    </div>
  );
}
