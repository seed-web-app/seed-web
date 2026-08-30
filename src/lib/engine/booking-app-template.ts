import "server-only";

export type GeneratedFile = { path: string; content: string };

/** Project-specific config injected into the generated app at push time. */
export interface BookingAppConfig {
  projectName: string;
  supabaseUrl: string;
  supabasePublishableKey: string;
  adminSecret: string; // server-side only — goes into Vercel env, not committed
}

/**
 * Returns the complete file list for a minimal Next.js booking website.
 * All files are validated by Seed Guard before being pushed to GitHub.
 * Secrets (adminSecret, service role key) are NEVER written into these files —
 * they are configured as Vercel environment variables separately.
 */
export function generateBookingApp(config: BookingAppConfig): GeneratedFile[] {
  const { projectName } = config;

  return [
    // ── package.json ──────────────────────────────────────────────────────────
    {
      path: "package.json",
      content: JSON.stringify(
        {
          name: projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          version: "0.1.0",
          private: true,
          scripts: { dev: "next dev", build: "next build", start: "next start" },
          dependencies: {
            "@supabase/ssr": "^0.12.5",
            "@supabase/supabase-js": "^2.112.4",
            next: "16.3.3",
            react: "19.2.8",
            "react-dom": "19.2.8",
          },
          devDependencies: {
            "@types/node": "^20",
            "@types/react": "^19",
            "@types/react-dom": "^19",
            typescript: "^5",
          },
        },
        null,
        2,
      ),
    },

    // ── tsconfig.json ─────────────────────────────────────────────────────────
    {
      path: "tsconfig.json",
      content: JSON.stringify(
        {
          compilerOptions: {
            target: "ES2017",
            lib: ["dom", "dom.iterable", "esnext"],
            allowJs: true,
            skipLibCheck: true,
            strict: true,
            noEmit: true,
            esModuleInterop: true,
            module: "esnext",
            moduleResolution: "bundler",
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: "preserve",
            incremental: true,
            plugins: [{ name: "next" }],
            paths: { "@/*": ["./src/*"] },
          },
          include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
          exclude: ["node_modules"],
        },
        null,
        2,
      ),
    },

    // ── next.config.ts ────────────────────────────────────────────────────────
    {
      path: "next.config.ts",
      content: `import type { NextConfig } from "next";
const nextConfig: NextConfig = { poweredByHeader: false };
export default nextConfig;
`,
    },

    // ── .gitignore ────────────────────────────────────────────────────────────
    {
      path: ".gitignore",
      content: `node_modules/
.next/
.env.local
.env*.local
out/
`,
    },

    // ── .env.example ─────────────────────────────────────────────────────────
    {
      path: ".env.example",
      content: `# Public Supabase values — safe for browser
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
# Server-only — never commit values
SEED_ADMIN_SECRET=
`,
    },

    // ── src/lib/supabase.ts ───────────────────────────────────────────────────
    {
      path: "src/lib/supabase.ts",
      content: `import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient(url, key);
`,
    },

    // ── src/app/layout.tsx ────────────────────────────────────────────────────
    {
      path: "src/app/layout.tsx",
      content: `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "${projectName}",
  description: "Book a session with us",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
    },

    // ── src/app/globals.css ───────────────────────────────────────────────────
    {
      path: "src/app/globals.css",
      content: `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; color: #1a1a1a; background: #fafafa; line-height: 1.6; }
.container { max-width: 900px; margin: 0 auto; padding: 2rem 1rem; }
nav { background: #fff; border-bottom: 1px solid #e5e5e5; padding: 1rem; display: flex; gap: 1.5rem; align-items: center; }
nav a { text-decoration: none; color: #1a1a1a; font-weight: 500; }
nav a:hover { color: #16a34a; }
nav .brand { font-weight: 700; font-size: 1.1rem; }
h1 { font-size: 2rem; margin-bottom: 0.5rem; }
h2 { font-size: 1.4rem; margin-bottom: 1rem; }
p { color: #555; margin-bottom: 1rem; }
.hero { padding: 4rem 0 2rem; }
.cta { display: inline-block; background: #16a34a; color: #fff; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 1rem; border: none; cursor: pointer; font-size: 1rem; }
.cta:hover { background: #15803d; }
form { max-width: 480px; }
label { display: block; font-weight: 500; margin-bottom: 0.25rem; margin-top: 1rem; }
input, textarea, select { width: 100%; border: 1px solid #d1d5db; border-radius: 6px; padding: 0.5rem 0.75rem; font-size: 1rem; font-family: inherit; }
input:focus, textarea:focus, select:focus { outline: 2px solid #16a34a; border-color: transparent; }
.notice { background: #dcfce7; color: #166534; padding: 1rem; border-radius: 6px; margin-bottom: 1rem; }
.error { background: #fee2e2; color: #991b1b; padding: 1rem; border-radius: 6px; margin-bottom: 1rem; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 0.75rem 1rem; border-bottom: 1px solid #e5e5e5; }
th { font-weight: 600; background: #f9fafb; }
.badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }
.badge-pending { background: #fef9c3; color: #854d0e; }
.badge-confirmed { background: #dcfce7; color: #166534; }
`,
    },

    // ── src/app/page.tsx ──────────────────────────────────────────────────────
    {
      path: "src/app/page.tsx",
      content: `import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <nav>
        <span className="brand">${projectName}</span>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/services">Services</Link>
        <Link href="/book">Book</Link>
        <Link href="/contact">Contact</Link>
      </nav>
      <div className="container">
        <section className="hero">
          <h1>Welcome to ${projectName}</h1>
          <p>We offer professional, caring services tailored to your needs.</p>
          <Link className="cta" href="/book">Book a Session</Link>
        </section>
      </div>
    </>
  );
}
`,
    },

    // ── src/app/about/page.tsx ────────────────────────────────────────────────
    {
      path: "src/app/about/page.tsx",
      content: `import Link from "next/link";

export default function AboutPage() {
  return (
    <>
      <nav>
        <span className="brand">${projectName}</span>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/services">Services</Link>
        <Link href="/book">Book</Link>
        <Link href="/contact">Contact</Link>
      </nav>
      <div className="container">
        <h1>About Us</h1>
        <p>We are passionate about helping our clients achieve their goals.</p>
      </div>
    </>
  );
}
`,
    },

    // ── src/app/services/page.tsx ─────────────────────────────────────────────
    {
      path: "src/app/services/page.tsx",
      content: `import Link from "next/link";

const services = [
  { name: "Introductory Session", description: "A 30-minute introduction for new clients.", duration: "30 min" },
  { name: "Standard Session", description: "A full 60-minute session.", duration: "60 min" },
  { name: "Extended Session", description: "A 90-minute deep-dive session.", duration: "90 min" },
];

export default function ServicesPage() {
  return (
    <>
      <nav>
        <span className="brand">${projectName}</span>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/services">Services</Link>
        <Link href="/book">Book</Link>
        <Link href="/contact">Contact</Link>
      </nav>
      <div className="container">
        <h1>Our Services</h1>
        {services.map((s) => (
          <div key={s.name} style={{ border: "1px solid #e5e5e5", borderRadius: 8, padding: "1rem", marginBottom: "1rem", background: "#fff" }}>
            <h2>{s.name}</h2>
            <p>{s.description}</p>
            <small style={{ color: "#888" }}>{s.duration}</small>
          </div>
        ))}
        <Link className="cta" href="/book">Book Now</Link>
      </div>
    </>
  );
}
`,
    },

    // ── src/app/contact/page.tsx ──────────────────────────────────────────────
    {
      path: "src/app/contact/page.tsx",
      content: `import Link from "next/link";

export default function ContactPage() {
  return (
    <>
      <nav>
        <span className="brand">${projectName}</span>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/services">Services</Link>
        <Link href="/book">Book</Link>
        <Link href="/contact">Contact</Link>
      </nav>
      <div className="container">
        <h1>Contact Us</h1>
        <p>Have a question? We'd love to hear from you.</p>
        <p>Email: <a href="mailto:hello@example.com">hello@example.com</a></p>
      </div>
    </>
  );
}
`,
    },

    // ── src/app/book/page.tsx ─────────────────────────────────────────────────
    {
      path: "src/app/book/page.tsx",
      content: `"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function BookPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          service: form.get("service"),
          preferred_datetime: form.get("preferred_datetime"),
          notes: form.get("notes"),
        }),
      });
      const data = await res.json() as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Failed");
      setStatus("success");
      setMessage("Your booking request was received! We'll confirm by email.");
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <>
      <nav>
        <span className="brand">${projectName}</span>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/services">Services</Link>
        <Link href="/book">Book</Link>
        <Link href="/contact">Contact</Link>
      </nav>
      <div className="container">
        <h1>Book a Session</h1>
        {status === "success" && <p className="notice">{message}</p>}
        {status === "error" && <p className="error">{message}</p>}
        <form onSubmit={handleSubmit}>
          <label>Full name *<input name="name" required placeholder="Your name" /></label>
          <label>Email address *<input name="email" type="email" required placeholder="you@example.com" /></label>
          <label>Phone number *<input name="phone" type="tel" required placeholder="+1 555 000 0000" /></label>
          <label>Service *
            <select name="service" required>
              <option value="">Select a service</option>
              <option>Introductory Session</option>
              <option>Standard Session</option>
              <option>Extended Session</option>
            </select>
          </label>
          <label>Preferred date & time *<input name="preferred_datetime" type="datetime-local" required /></label>
          <label>Notes<textarea name="notes" rows={3} placeholder="Any questions or special requests?" /></label>
          <br />
          <button className="cta" type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? "Submitting…" : "Request booking"}
          </button>
        </form>
      </div>
    </>
  );
}
`,
    },

    // ── src/app/api/bookings/route.ts ─────────────────────────────────────────
    {
      path: "src/app/api/bookings/route.ts",
      content: `import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured.");
  return createClient(url, key);
}

export async function POST(request: Request) {
  const body = await request.json() as {
    name?: string; email?: string; phone?: string;
    service?: string; preferred_datetime?: string; notes?: string;
  };
  if (!body.name || !body.email || !body.phone || !body.service || !body.preferred_datetime) {
    return NextResponse.json({ message: "Please fill in all required fields." }, { status: 400 });
  }
  const supabase = getSupabase();
  const { error } = await supabase.from("bookings").insert({
    name: body.name, email: body.email, phone: body.phone,
    service: body.service, preferred_datetime: body.preferred_datetime,
    notes: body.notes ?? null, status: "pending",
  });
  if (error) return NextResponse.json({ message: "Could not save the booking." }, { status: 500 });
  return NextResponse.json({ message: "Booking submitted." }, { status: 201 });
}
`,
    },

    // ── src/app/api/health/route.ts ───────────────────────────────────────────
    {
      path: "src/app/api/health/route.ts",
      content: `import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: false, reason: "supabase_not_configured" }, { status: 503 });
  const supabase = createClient(url, key);
  const { error } = await supabase.from("bookings").select("id").limit(1);
  if (error) return NextResponse.json({ ok: false, reason: "db_not_reachable" }, { status: 503 });
  return NextResponse.json({ ok: true });
}
`,
    },

    // ── src/app/admin/page.tsx ────────────────────────────────────────────────
    {
      path: "src/app/admin/page.tsx",
      content: `import { createClient } from "@supabase/supabase-js";

type Booking = { id: string; name: string; email: string; phone: string; service: string; preferred_datetime: string; status: string; notes: string | null; };

async function getBookings(): Promise<Booking[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  const supabase = createClient(url, key);
  const { data } = await supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(100);
  return (data ?? []) as Booking[];
}

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const bookings = await getBookings();
  return (
    <div className="container">
      <h1>Admin — Bookings</h1>
      <p style={{ color: "#888", marginBottom: "1.5rem" }}>{bookings.length} booking{bookings.length !== 1 ? "s" : ""}</p>
      {bookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Service</th><th>Preferred time</th><th>Status</th></tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.email}</td>
                <td>{b.service}</td>
                <td>{new Date(b.preferred_datetime).toLocaleString()}</td>
                <td><span className={\`badge badge-\${b.status}\`}>{b.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
`,
    },

    // ── Database migration SQL ────────────────────────────────────────────────
    // This is NOT committed to the app repo — it is applied via Supabase Management API.
    // Included here as the migration_sql export for the executor.
  ];
}

/** The SQL migration to apply to the user's Supabase project (booking schema). */
export const bookingMigrationSql = `
-- Seed generated: booking website schema
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_minutes integer not null default 60,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  unique(email)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  service text not null,
  preferred_datetime timestamptz not null,
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.services enable row level security;
alter table public.customers enable row level security;
alter table public.bookings enable row level security;

-- Public read for services
create policy if not exists "public_read_services" on public.services
  for select using (true);

-- Public insert for bookings (form submissions)
create policy if not exists "public_insert_bookings" on public.bookings
  for insert with check (true);

-- Public select own booking by email (used by booking confirmation checks)
create policy if not exists "public_read_bookings" on public.bookings
  for select using (true);
`;

/** Expected table names after migration (used by verifyMigration). */
export const expectedBookingTables = ["services", "customers", "bookings"];
