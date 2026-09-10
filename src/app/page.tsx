import Link from "next/link";

export default function Home() {
  return (
    <main className="home-shell">
      <nav className="site-nav" aria-label="Main navigation">
        <Link className="wordmark" href="/">
          new<span>/</span>app
        </Link>
        <Link className="nav-action" href="/login">
          Sign in
        </Link>
      </nav>

      <section className="home-hero">
        <div className="status-pill">
          <span aria-hidden="true" /> Clean environment
        </div>
        <h1>
          A clean place
          <br />
          <em>to begin.</em>
        </h1>
        <p>
          The old application is gone. This is a fresh foundation with Google
          login, Supabase, and your personal subdomain ready for whatever comes
          next.
        </p>
        <Link className="primary-action" href="/login">
          Enter the new app <span aria-hidden="true">↗</span>
        </Link>
      </section>

      <section className="foundation" aria-label="Preserved foundation">
        <p>Foundation kept intentionally small</p>
        <div>
          <span>Google login</span>
          <span>Supabase</span>
          <span>Private subdomains</span>
          <span>Vercel + GitHub</span>
        </div>
      </section>
    </main>
  );
}
