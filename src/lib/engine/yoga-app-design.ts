import type { GeneratedFile } from "@/lib/engine/booking-app-template";
import yogaSkill from "../../../skills/yoga-studio/skill.json";

/** Presentation overlay: keeps the existing booking API, admin and database files. */
export function applyYogaDesign(files: GeneratedFile[], projectName: string): GeneratedFile[] {
  const name = JSON.stringify(projectName);
  const tokens = yogaSkill.designTokens;
  const replacements: GeneratedFile[] = [
    {
      path: "src/app/layout.tsx",
      content: `import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

const studioName = ${name};
export const metadata: Metadata = { title: { default: studioName, template: "%s | " + studioName }, description: "Make space for your yoga practice. Explore the studio and request your next class." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header"><nav className="site-nav" aria-label="Main navigation">
      <Link className="studio-brand" href="/"><span aria-hidden="true">✳</span> {studioName}</Link>
      <div className="nav-links"><Link href="/about">Our practice</Link><Link href="/services">Classes</Link><Link href="/contact">Get in touch</Link></div>
      <Link className="button button-small" href="/book">Request a class <span aria-hidden="true">↗</span></Link>
    </nav></header>
    <main id="main-content">{children}</main>
    <footer className="site-footer"><div><Link className="studio-brand" href="/">{studioName}</Link><p>A little space for yourself.</p></div><div className="footer-links"><Link href="/services">Explore classes</Link><Link href="/book">Request a class</Link><Link href="/admin">Studio sign in</Link></div><p className="footer-note">Move gently. Breathe deeply. Begin where you are.</p></footer>
  </body></html>;
}
`,
    },
    {
      path: "src/app/page.tsx",
      content: `import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return <>
    <section className="yoga-hero section-shell" aria-labelledby="hero-heading">
      <div className="hero-copy"><p className="eyebrow">A moment to come back to yourself</p><h1 id="hero-heading">A little space.<br /><em>A deeper breath.</em></h1><p className="hero-description">Make room for movement, stillness, and a practice that feels like you. Your next chapter can begin with one class.</p><div className="hero-actions"><Link className="button" href="/book">Request a class <span aria-hidden="true">↗</span></Link><Link className="text-link" href="#practice">Explore the practice <span aria-hidden="true">↓</span></Link></div><p className="hero-footnote">New to yoga? Start with curiosity. We'll take it from there.</p></div>
      <div className="hero-art"><Image src="/images/yoga-garden.svg" alt="" width={640} height={760} priority sizes="(max-width: 760px) 92vw, 45vw" /><div className="art-caption"><span>Find your own rhythm.</span><span aria-hidden="true">01 — ∞</span></div></div>
    </section>
    <div className="practice-strip" aria-label="Our approach"><span>Move with intention</span><span aria-hidden="true">✳</span><span>Make room to breathe</span><span aria-hidden="true">✳</span><span>Begin where you are</span></div>
    <section id="practice" className="section-shell practice-section"><div><p className="eyebrow">More than a moment on the mat</p><h2>A practice.<br /><em>Not a performance.</em></h2></div><div><p className="large-copy">Some days call for movement. Others ask for a slower pace. Yoga offers a place to explore both.</p><p>You don't need to arrive flexible, experienced, or with everything figured out. Tell us what you're looking for, and ask about a class that suits your experience.</p><Link className="text-link" href="/about">Get to know the practice <span aria-hidden="true">↗</span></Link></div></section>
    <section className="offerings section-shell"><div className="section-heading"><div><p className="eyebrow">Find your starting point</p><h2>What brings you <em>to the mat?</em></h2></div><Link className="text-link" href="/services">Explore classes ↗</Link></div><div className="intention-grid"><article><span className="chapter">01 / BEGIN</span><h3>A fresh start</h3><p>New to the practice? Share your experience when requesting a class so the studio can help you find your starting point.</p></article><article><span className="chapter">02 / MOVE</span><h3>Room to explore</h3><p>Curious about movement and breath? Ask which classes fit the pace and style you enjoy.</p></article><article><span className="chapter">03 / PAUSE</span><h3>A gentler rhythm</h3><p>Looking for a quieter session? Let the studio know you'd like to explore slower-paced options.</p></article></div></section>
    <section className="section-shell first-visit"><div><p className="eyebrow">Your first visit</p><h2>Come as <em>you are.</em></h2><p>A few small things to make getting started feel easier.</p></div><div className="faq-list"><details><summary>Do I need experience?</summary><p>Include your experience level in your request. The studio can help you choose an appropriate class before confirming.</p></details><details><summary>What should I bring?</summary><p>Wear clothing you can move in. Ask the studio about mats, props, and any other class-specific details before your visit.</p></details><details><summary>How does booking work?</summary><p>Send your preferred time and class interest. This is a request, not a confirmed reservation. The studio will review the details with you.</p></details></div></section>
    <section className="closing-note section-shell"><p className="eyebrow">Your practice begins with a small step</p><h2>Make space <em>for yourself.</em></h2><Link className="button" href="/book">Let's find your class <span aria-hidden="true">↗</span></Link></section>
  </>;
}
`,
    },
    {
      path: "src/app/about/page.tsx",
      content: `import Link from "next/link";
export default function AboutPage() { return <section className="section-shell editorial-page"><p className="eyebrow">Our practice</p><h1>Less expectation.<br /><em>More exploration.</em></h1><div className="reading-column"><p className="large-copy">A space to meet yourself where you are, one practice at a time.</p><p>Yoga can look different from day to day. Begin with your experience, your curiosity, and a pace that feels right for you.</p><p>Use your class request to tell the studio what you're looking for. Ask about the teacher, class format, and what to expect before your visit.</p><Link className="button" href="/book">Find your starting point ↗</Link></div></section>; }
`,
    },
    {
      path: "src/app/services/page.tsx",
      content: `"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
type Service = { id: string; name: string; description: string | null; duration_minutes: number };
export default function ClassesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => { let active = true;
    async function load() { try {
      const result = await supabase.from("services").select("id,name,description,duration_minutes").order("name");
      if (!active) return;
      if (result.error) { setStatus("error"); return; }
      setServices(result.data ?? []); setStatus("ready");
    } catch { if (active) setStatus("error"); } }
    void load(); return () => { active = false; };
  }, []);
  return <section className="section-shell editorial-page"><p className="eyebrow">Explore the practice</p><h1>Find your <em>rhythm.</em></h1><p className="reading-column">Discover classes listed by the studio, or send a request and ask which practice is right for you. All times are confirmed by the studio.</p>
    {status === "loading" && <p role="status">Loading classes…</p>}
    {status === "error" && <p role="alert">We couldn't load the class list. You can still send a request to the studio.</p>}
    {status === "ready" && services.length === 0 && <p className="notice">The studio hasn't listed its classes yet. Tell us what you're looking for in your request.</p>}
    <div className="intention-grid">{services.map(service => <article key={service.id}><h2>{service.name}</h2>{service.description && <p>{service.description}</p>}<p>{service.duration_minutes} minutes</p><Link className="text-link" href="/book">Request this class ↗</Link></article>)}</div>
    <Link className="button" href="/book">Request a class ↗</Link>
  </section>;
}
`,
    },
    {
      path: "src/app/contact/page.tsx",
      content: `import Link from "next/link";
export default function ContactPage() { return <section className="section-shell editorial-page"><p className="eyebrow">Let's begin a conversation</p><h1>A question?<br /><em>You're welcome here.</em></h1><div className="reading-column"><p className="large-copy">Looking for the right place to start?</p><p>Send a class request and include your questions in the notes. Ask about the style, teacher, location, or what to bring before confirming your visit.</p><Link className="button" href="/book">Send a class request ↗</Link></div></section>; }
`,
    },
    {
      // Preserve the old route without generating a fictitious interior portfolio.
      path: "src/app/projects/page.tsx",
      content: `export { default } from "../about/page";\n`,
    },
    {
      path: "public/images/yoga-garden.svg",
      content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 760"><rect width="640" height="760" rx="280" fill="#dce4d6"/><path d="M50 760V330a270 270 0 01540 0v430" fill="#c2ceb8"/><path d="M100 760V335a220 220 0 01440 0v425" fill="#ebdfcc"/><circle cx="380" cy="250" r="102" fill="#a65d45"/><path d="M0 585Q210 450 640 590v170H0" fill="#aebda6"/><path d="M0 665Q260 505 640 690v70H0" fill="#81947c"/><g fill="none" stroke="#253e35" stroke-width="4" stroke-linecap="round"><path d="M335 724Q270 485 196 272M308 620Q429 480 500 464M265 470Q159 423 111 365M297 573Q330 440 379 389"/></g><g fill="#536d57"><ellipse cx="221" cy="352" rx="20" ry="61" transform="rotate(-30 221 352)"/><ellipse cx="162" cy="416" rx="22" ry="61" transform="rotate(-55 162 416)"/><ellipse cx="280" cy="484" rx="21" ry="62" transform="rotate(28 280 484)"/><ellipse cx="350" cy="459" rx="22" ry="67" transform="rotate(33 350 459)"/><ellipse cx="439" cy="514" rx="23" ry="72" transform="rotate(55 439 514)"/><ellipse cx="280" cy="603" rx="22" ry="61" transform="rotate(-44 280 603)"/></g><path d="M109 152h44m-22-22v44M484 348h30m-15-15v30" stroke="#f6f3eb" stroke-width="2"/></svg>`,
    },
    {
      path: "src/app/globals.css",
      content: `:root { --paper: ${tokens.background}; --ink: ${tokens.ink}; --muted: ${tokens.muted}; --sage: ${tokens.sage}; --clay: ${tokens.clay}; --heading: ${tokens.headingFont}; --body: ${tokens.bodyFont}; }
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; scroll-padding-top: 2rem; }
body { margin: 0; background: var(--paper); color: var(--ink); font: 16px/1.65 var(--body); }
a { color: inherit; text-decoration: none; }
button, input, select, textarea { font: inherit; }
button, a, summary { -webkit-tap-highlight-color: transparent; }
:focus-visible { outline: 3px solid var(--clay); outline-offset: 5px; }
h1, h2, h3 { font-family: var(--heading); font-weight: 400; line-height: 1.08; letter-spacing: -.045em; margin: 0 0 1.5rem; overflow-wrap: anywhere; }
h1 { font-size: clamp(3rem, 6.5vw, 6.3rem); } h2 { font-size: clamp(2.35rem, 4vw, 4rem); } h3 { font-size: 2.1rem; }
em { font-weight: 400; } p { margin: 0 0 1.5rem; color: var(--muted); } img { display: block; max-width: 100%; height: auto; }
.section-shell, .site-nav, .site-footer { width: min(1260px, 90%); margin-inline: auto; }
.site-header { border-bottom: 1px solid #253e3526; }
.site-nav { min-height: 108px; display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap; padding-block: 1.3rem; }
.studio-brand { font: 1.8rem/1.2 var(--heading); letter-spacing: -.04em; overflow-wrap: anywhere; max-width: 100%; }
.studio-brand span { color: var(--clay); padding-right: .4rem; }
.nav-links, .footer-links { display: flex; flex-wrap: wrap; gap: 1.5rem; }
.nav-links a, .footer-links a { padding-block: .5rem; }
.nav-links a:hover, .footer-links a:hover { text-decoration: underline; text-underline-offset: 5px; }
.button, .cta { display: inline-flex; justify-content: center; align-items: center; gap: 1.8rem; background: var(--ink); color: var(--paper); padding: 1rem 1.7rem; min-height: 48px; border: 1px solid var(--ink); border-radius: 100px; cursor: pointer; text-align: center; line-height: 1.5; }
.button:hover, .cta:hover { background: #385548; } .button-small { padding: .7rem 1.3rem; font-size: .9rem; } button:disabled { opacity: .6; cursor: wait; }
.text-link { display: inline-block; padding-block: .75rem; text-decoration: underline; text-underline-offset: 6px; }
.yoga-hero { display: grid; grid-template-columns: 1.2fr 1fr; gap: clamp(2rem, 5vw, 6rem); align-items: center; padding-block: 4.5rem 5.5rem; }
.eyebrow { color: var(--ink); text-transform: uppercase; letter-spacing: .17em; font-size: .7rem; font-weight: 600; margin-bottom: 2rem; }
.hero-description { max-width: 430px; font-size: 1.1rem; }
.hero-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 1.3rem; margin-top: 2rem; }
.hero-footnote { margin: 2.5rem 0 0; font-size: .8rem; max-width: 25rem; }
.hero-art img { width: 100%; max-height: 600px; object-fit: contain; }
.art-caption { display: flex; justify-content: space-between; gap: 1rem; padding: 1rem .5rem 0; font-size: .72rem; letter-spacing: .04em; }
.practice-strip { display: flex; justify-content: center; gap: clamp(1rem, 4vw, 4rem); flex-wrap: wrap; border-block: 1px solid #253e3526; padding: 1.5rem; font-size: .82rem; }
.practice-strip [aria-hidden] { color: var(--clay); }
.practice-section, .first-visit { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; padding-block: 6rem; }
.large-copy { font-family: var(--heading); font-size: 1.85rem; line-height: 1.4; color: var(--ink); letter-spacing: -.02em; }
.offerings { padding-block: 2rem 5rem; }
.section-heading { display: flex; justify-content: space-between; align-items: end; gap: 2rem; margin-bottom: 2rem; }
.section-heading h2 { max-width: 650px; margin-bottom: 0; }
.intention-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; margin-block: 2rem; }
.intention-grid article { border-top: 1px solid #253e3540; padding: 2rem 1.5rem; background: #dce4d64d; }
.intention-grid article:nth-child(2) { background: #e7ddcf; }.intention-grid article:nth-child(3) { background: var(--sage); }
.intention-grid article h2 { font-size: 2rem; } .intention-grid article p:last-child { margin-bottom: 0; }
.chapter { display: block; font-size: .7rem; letter-spacing: .12em; margin-bottom: 3rem; }
.first-visit { border-top: 1px solid #253e3526; }
details { border-bottom: 1px solid #253e3540; padding-block: 1.2rem; } summary { cursor: pointer; padding: .4rem 0; } details p { padding-top: 1rem; }
.closing-note { background: var(--sage); text-align: center; padding: 4.5rem 2rem; margin-bottom: 5rem; border-radius: 180px 180px 4px 4px; }
.site-footer { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 2rem; border-top: 1px solid #253e3526; padding-block: 3rem; }
.site-footer p { font-size: .8rem; margin: .75rem 0 0; }.footer-note { flex-basis: 100%; }
.editorial-page { padding-block: 5rem; min-height: 60vh; }.reading-column { max-width: 660px; }
.container { width: min(900px, 90%); margin: auto; padding-block: 4rem; min-height: 60vh; overflow-x: auto; }
.container h1 { font-size: clamp(2.8rem, 5vw, 4rem); }.container h2 { font-size: 2rem; }
form { max-width: 580px; } label { display: block; margin-top: 1.3rem; } input, textarea, select { display: block; width: 100%; background: #fffdf7; border: 1px solid #52635a88; border-radius: 8px; padding: .85rem; margin-top: .4rem; color: var(--ink); min-height: 48px; } textarea { resize: vertical; }
.notice, .error { padding: 1.2rem; border-radius: 8px; }.notice { background: var(--sage); color: var(--ink); }.error { background: #fbe6df; color: #822f25; }
table { width: 100%; border-collapse: collapse; } th, td { text-align: left; padding: 1rem; border-bottom: 1px solid #253e3526; }.badge { padding: .2rem .6rem; border-radius: 4px; }.badge-pending { background: #f7e6bd; }.badge-confirmed { background: var(--sage); }
.skip-link { position: absolute; top: -100px; left: 1rem; z-index: 10; background: var(--ink); color: white; padding: 1rem; }.skip-link:focus { top: 1rem; }
@media (max-width: 1000px) { .nav-links { gap: 1rem; }.yoga-hero { gap: 2rem; }.practice-section, .first-visit { gap: 2.5rem; } }
@media (max-width: 760px) { .site-nav { gap: 1rem; }.studio-brand { font-size: 1.5rem; }.nav-links { order: 3; width: 100%; justify-content: space-between; gap: .6rem; font-size: .85rem; }.button-small { font-size: .78rem; gap: .5rem; }.yoga-hero { grid-template-columns: 1fr; padding-block: 3rem; }.hero-art { width: min(440px, 100%); margin-inline: auto; }.hero-art img { max-height: 460px; }.hero-footnote { margin-top: 1.5rem; }.practice-strip { font-size: .7rem; gap: .8rem; }.practice-section, .first-visit { grid-template-columns: 1fr; padding-block: 3.5rem; gap: 1rem; }.section-heading { display: block; }.section-heading .text-link { margin-top: 1rem; }.intention-grid { grid-template-columns: 1fr; }.chapter { margin-bottom: 1.5rem; }.offerings { padding-bottom: 2rem; }.closing-note { border-radius: 80px 80px 4px 4px; padding: 3.5rem 1.2rem; margin-bottom: 3rem; }.editorial-page { padding-block: 3rem; } }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
`,
    },
  ];

  // Keep the working form/API contract, replacing only its presentation and copy.
  const bookingPage = files.find(file => file.path === "src/app/book/page.tsx");
  if (bookingPage) replacements.push({ ...bookingPage, content: bookingPage.content
    .replace(/<nav>[\s\S]*?<\/nav>/, "")
    .replace("Book a Session</h1>", "Request a class</h1><p>Share your class interest and preferred time. Your request is only confirmed once the studio approves it.</p>")
    .replace("Your booking request was received! We'll confirm by email.", "Your class request has been received. It is awaiting confirmation from the studio.")
    .replace(/Service \*[\s\S]*?<\/select>/, 'Class interest *<input name="service" required placeholder="A class name, or help me choose" />')
    .replace('placeholder="+1 555 000 0000"', 'placeholder="Your contact number"')
    .replace('{status === "success" && <p className="notice">', '{status === "success" && <p role="status" className="notice">')
    .replace('{status === "error" && <p className="error">', '{status === "error" && <p role="alert" className="error">'),
  });
  const result = new Map(files.map(file => [file.path, file]));
  for (const file of replacements) result.set(file.path, file);
  return [...result.values()];
}
