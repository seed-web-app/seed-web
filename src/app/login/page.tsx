import Link from "next/link";
import { signInWithGoogle } from "@/app/auth/actions";
import { ArrowLeft, AlertCircle } from "lucide-react";

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
    <main className="min-h-screen bg-[#eaeded] flex flex-col justify-between p-4 font-sans selection:bg-[#ffd814] selection:text-black">
      {/* Top Header Logo */}
      <div className="w-full max-w-sm mx-auto flex flex-col items-center pt-8 pb-4">
        <Link href="/" className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded bg-suzuki-red flex items-center justify-center font-black text-white text-xl shadow-sm">
            S
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-[#131921]">
            suzuki<span className="text-[#c7511f]">.mu</span>
          </span>
        </Link>
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#565959]">
          Mauritius Owners Portal
        </span>
      </div>

      {/* Center Amazon-Style Sign-In Card */}
      <div className="w-full max-w-sm mx-auto my-6">
        <div className="amazon-card p-6 sm:p-7 bg-white shadow-md border border-[#d5d9d9]">
          <h1 className="text-2xl font-normal text-[#0f1111] mb-3">
            Sign In
          </h1>
          <p className="text-xs text-[#565959] mb-5 leading-relaxed">
            Use your verified Google account to access parts catalogs, submit offline leads, or join community discussions.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded bg-[#fdf3f2] border border-[#d9381e] flex items-start gap-2 text-[#d9381e] text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorDescriptions[error] || "Sign-in failed. Please try again."}</span>
            </div>
          )}

          <form action={signInWithGoogle} className="space-y-4">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-full btn-amazon-primary text-xs font-semibold cursor-pointer shadow-sm text-[#0f1111]"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
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

          <div className="mt-6 pt-4 border-t border-[#e7e7e7] text-[11px] text-[#565959] leading-relaxed">
            By continuing, you agree to the Suzuki Mauritius Customer Network Terms of Service and Privacy Notice.
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#007185] hover:text-[#c7511f] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Homepage</span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-[#565959] border-t border-[#d5d9d9]">
        <p>© {new Date().getFullYear()} Suzuki Mauritius Parts & Owner Network. All rights reserved.</p>
      </footer>
    </main>
  );
}
