import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCurrentProfile } from "@/lib/supabase/server";
import { signInWithGoogle } from "@/app/auth/actions";
import {
  AlertCircle,
  ArrowRight,
  CarFront,
  CheckCircle2,
  MessageSquareText,
  ShieldCheck,
  Wrench,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    code?: string;
    error?: string;
    error_code?: string;
  }>;
}

const errorDescriptions: Record<string, string> = {
  auth: "Authentication is temporarily unavailable. Please try again.",
  oauth: "Google sign-in could not be started. Please check your connection and retry.",
  invalid_request: "Your previous Google sign-in session expired. Start a fresh sign-in below.",
  bad_oauth_state: "Your previous Google sign-in session expired. Start a fresh sign-in below.",
  no_code: "Google did not return a sign-in code. Please try again.",
  exchange_failed: "We could not verify that Google session. Please sign in again.",
  user_verification_failed: "We could not verify your customer profile.",
  unauthorized: "This account does not have access to the Suzuki network.",
};

const networkHighlights = [
  {
    icon: Wrench,
    title: "Find the right part",
    description: "Browse genuine parts, reference prices, offers, and condition notes.",
  },
  {
    icon: CarFront,
    title: "Build your garage",
    description: "Register your Suzuki vehicles and keep fitment details in one place.",
  },
  {
    icon: MessageSquareText,
    title: "Request, never checkout",
    description: "Send an inquiry directly to the dealer. There are no online payments.",
  },
];

export default async function RootPage({ searchParams }: PageProps) {
  const { code, error, error_code: errorCode } = await searchParams;

  // Supabase can fall back to the configured site root when a callback URL is
  // not yet allow-listed. Recover that valid OAuth code through our callback.
  if (code) {
    redirect(`/auth/callback?code=${encodeURIComponent(code)}`);
  }

  const profile = await getCurrentProfile();

  if (profile) {
    redirect(profile.role === "admin" ? "/admin" : "/home");
  }

  const errorKey = errorCode || error;

  return (
    <div className="auth-shell min-h-screen flex flex-col font-sans text-[#17191d]">
      <header className="w-full border-b border-black/[0.06] bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link
            href="/"
            className="group flex items-center gap-3 rounded-xl"
            aria-label="Suzuki Mauritius home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e30613] text-xl font-black text-white shadow-[0_8px_20px_rgba(227,6,19,0.22)] transition-transform group-hover:-rotate-2">
              S
            </span>
            <span className="flex flex-col">
              <span className="text-base font-black leading-none tracking-[-0.02em] text-[#14161a] sm:text-lg">
                Suzuki Mauritius
              </span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#747980]">
                Owner network
              </span>
            </span>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-[#e3e6e8] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#555b63] shadow-sm sm:text-xs">
            <span className="h-2 w-2 rounded-full bg-[#24a148] shadow-[0_0_0_4px_rgba(36,161,72,0.1)]" />
            <span className="hidden sm:inline">Mauritius dealer network</span>
            <span className="sm:hidden">Mauritius</span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-6 px-4 py-5 sm:px-8 sm:py-10 lg:grid-cols-[1.15fr_0.85fr] lg:py-12">
        <section className="relative min-h-[520px] overflow-hidden rounded-[32px] bg-[#1d1d1f] shadow-[0_28px_80px_rgba(17,17,19,0.17)] sm:min-h-[640px] sm:rounded-[40px]">
          <Image src="/brand/coastal-hero.jpg" alt="Two modern compact vehicles overlooking the Mauritius coast at sunrise" fill preload sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/[0.88] via-black/15 to-black/5" />
          <div className="absolute inset-x-0 bottom-0 z-10 p-6 text-white sm:p-10 lg:p-12">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.15em] backdrop-blur-xl"><ShieldCheck className="h-3.5 w-3.5" /> Built for Suzuki owners</div>
            <h1 className="max-w-2xl text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-[3.55rem]">The direct line to the right Suzuki part.</h1>
            <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-white/72 sm:text-base">Your private owner network for genuine parts, vehicle support, and dealer inquiries across Mauritius—without carts, checkout, or online payments.</p>
            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              {networkHighlights.map((item) => {
                const Icon = item.icon;
                return <div key={item.title} className="rounded-2xl border border-white/15 bg-black/15 p-3.5 backdrop-blur-xl"><Icon className="mb-2 h-4 w-4 text-[#ff6b75]" /><h2 className="text-[11px] font-extrabold">{item.title}</h2><p className="mt-1 hidden text-[10px] leading-4 text-white/55 sm:block">{item.description}</p></div>;
              })}
            </div>
          </div>
        </section>

        <section className="auth-card rounded-[30px] p-6 sm:p-8 lg:p-9" aria-labelledby="sign-in-title">
          <div className="mb-7 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#e30613]">
                Member access
              </p>
              <h2 id="sign-in-title" className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#14161a]">
                Welcome to the network
              </h2>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f0f2f4] text-[#171a1f]">
              <ShieldCheck className="h-5 w-5" />
            </span>
          </div>

          <p className="mb-6 text-sm leading-6 text-[#676d75]">
            Sign in with Google to open your personal dashboard, garage, parts catalog, and inquiry history.
          </p>

          {errorKey && (
            <div
              className="mb-5 flex items-start gap-2.5 rounded-2xl border border-[#e30613]/20 bg-[#e30613]/[0.055] p-3.5 text-xs leading-5 text-[#b4000d]"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span className="font-semibold">
                {errorDescriptions[errorKey] || "Sign-in failed. Please try again."}
              </span>
            </div>
          )}

          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="auth-google-button flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-3 rounded-2xl px-5 py-3 text-sm font-bold"
            >
              <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15Z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
              </svg>
              <span>Continue with Google</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 space-y-2.5 border-t border-[#e5e7e9] pt-5">
            {["Google is the only sign-in method", "Secure access to your own dashboard", "No payments or checkout anywhere"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-[11px] font-semibold text-[#656b73]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#24a148]" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <p className="mt-6 text-[10px] leading-5 text-[#858a91]">
            By continuing, you agree to use this private dealer network for legitimate vehicle support and parts inquiries.
          </p>
        </section>
      </main>

      <footer className="border-t border-black/[0.06] bg-white/65 px-5 py-4 text-center text-[10px] text-[#7b8087] backdrop-blur-sm sm:text-[11px]">
        © {new Date().getFullYear()} Suzuki Mauritius Parts &amp; Owner Network · Phoenix · Port Louis
      </footer>
    </div>
  );
}
