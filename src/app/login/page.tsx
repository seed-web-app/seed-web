import Link from "next/link";
import { signInWithGoogle } from "@/app/auth/actions";
export const dynamic="force-dynamic";

export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  void searchParams;
  return (
    <main className="auth-page">
      <Link className="brand auth-brand" href="/">
        seed<span>.</span>
      </Link>
      <section className="auth-card">
        <div className="seed-mark">✦</div>
        <p className="eyebrow">Welcome to Seed</p>
        <h1>
          Let’s build something
          <br />
          <em>useful together.</em>
        </h1>
        <p>Sign in to create and manage websites in accounts you own.</p>
        <form action={signInWithGoogle}>
          <button className="google-button" type="submit">
            <span className="google-g">G</span>
            Continue with Google
          </button>
        </form>
        <small>
          By continuing, you agree that Seed will only access projects you explicitly authorize.
        </small>
      </section>
      <aside className="auth-quote">
        <p>
          “Your code. Your database.
          <br />
          Your hosting.”
        </p>
        <span>Seed just makes them easy.</span>
      </aside>
    </main>
  );
}
