import Link from "next/link";
import { signInWithGoogle } from "@/app/auth/actions";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  auth: "Authentication is not configured yet.",
  oauth: "Google sign-in could not be started. Please try again.",
  no_code: "Google did not return a sign-in code.",
  exchange_failed: "The sign-in session could not be completed.",
  user_verification_failed: "Your Google account could not be verified.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="auth-shell">
      <Link className="wordmark auth-wordmark" href="/">
        new<span>/</span>app
      </Link>
      <section className="auth-card">
        <div className="auth-index">01</div>
        <p className="section-label">Welcome</p>
        <h1>Continue to your clean workspace.</h1>
        <p className="auth-copy">
          Google is the only sign-in method. No password or additional account
          setup is needed.
        </p>
        {error ? (
          <p className="form-error" role="alert">
            {errorMessages[error] ?? "Sign-in failed. Please try again."}
          </p>
        ) : null}
        <form action={signInWithGoogle}>
          <button className="google-button" type="submit">
            <span className="google-mark" aria-hidden="true">
              G
            </span>
            Continue with Google
            <span aria-hidden="true">→</span>
          </button>
        </form>
        <small>Authentication is securely handled by Google and Supabase.</small>
      </section>
      <aside className="auth-aside" aria-hidden="true">
        <span>YOUR SPACE</span>
        <div className="orb" />
        <p>
          One login.
          <br />
          One private address.
        </p>
      </aside>
    </main>
  );
}
