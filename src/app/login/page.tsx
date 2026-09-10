import Link from "next/link";
import { signInWithGoogle } from "@/app/auth/actions";
import { Shield, ArrowLeft, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const errorDescriptions: Record<string, string> = {
  auth: "Authentication service is temporarily unavailable. Please try again.",
  oauth: "Google sign-in could not be initiated. Please verify your connection.",
  no_code: "No authentication authorization code returned by Google.",
  exchange_failed: "Session creation failed during Google verification.",
  user_verification_failed: "Could not verify your account profile.",
  unauthorized: "Access denied. You do not possess the required permissions.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-carbon-pattern flex flex-col justify-between p-6 selection:bg-suzuki-red selection:text-white">
      {/* Top back navigation */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to overview</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-suzuki-red flex items-center justify-center font-black text-white text-sm">
            S
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Dealer Network
          </span>
        </div>
      </div>

      {/* Center Auth Card */}
      <div className="w-full max-w-md mx-auto my-12">
        <div className="p-8 sm:p-10 rounded-3xl bg-glass border border-white/10 shadow-2xl shadow-black/80 relative overflow-hidden">
          {/* Subtle top red glow accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-suzuki-red to-transparent opacity-80" />

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-suzuki-red/15 border border-suzuki-red/30 text-suzuki-brightred mb-4 shadow-lg shadow-suzuki-red/20">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Customer & Dealer Portal
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Sign in with your verified Google account to access parts catalogs, submit leads, or
              manage dealership operations.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300 text-xs leading-relaxed">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorDescriptions[error] || "Sign-in error occurred. Please try again."}</span>
            </div>
          )}

          {/* Single Confident CTA */}
          <form action={signInWithGoogle} className="space-y-4">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3.5 px-6 py-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl shadow-white/5 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
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

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-[12px] text-slate-400">
              No registration forms or passwords needed. Your Google login automatically registers
              your profile and secures your garage.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Legal Note */}
      <div className="w-full text-center text-xs text-slate-400">
        <p>Authorized Suzuki Parts Customer Network • Secure OAuth 2.0</p>
      </div>
    </main>
  );
}
