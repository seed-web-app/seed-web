import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <Link className="brand" href="/">seed<span>.</span></Link>
        <Link className="button button-dark" href="/dashboard">Open Seed</Link>
      </nav>
      <section className="hero">
        <div className="eyebrow">Your technical manager</div>
        <h1>Build the business. <em>Seed handles the tech.</em></h1>
        <p>Describe the website you need in plain language. Seed safely manages code, database, and deployment in accounts you own.</p>
        <div className="hero-actions"><Link className="button button-dark" href="/dashboard">Start building <span>→</span></Link><a className="text-link" href="#how-it-works">See how it works</a></div>
      </section>
      <section className="principle" id="how-it-works"><div><strong>Your code.</strong><strong>Your database.</strong><strong>Your hosting.</strong></div><p>Seed is a management layer, never a dependency of your live website. If Seed is offline, your site stays online.</p></section>
      <section className="steps"><article><b>01</b><h2>Tell Seed what you need</h2><p>“I need a booking website for my yoga studio.” No technical forms or jargon.</p></article><article><b>02</b><h2>Approve a safe plan</h2><p>Seed checks its build skills and security rules before making a change.</p></article><article><b>03</b><h2>Own everything</h2><p>Your GitHub, Supabase and Vercel accounts contain the finished work.</p></article></section>
    </main>
  );
}
