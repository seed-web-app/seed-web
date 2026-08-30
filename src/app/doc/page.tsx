import Link from "next/link";

export const dynamic = "force-static";

export default function DocsPage() {
  return (
    <main className="legal-page">
      <Link className="brand" href="/">
        seed<span>.</span>
      </Link>
      <article>
        <p className="eyebrow">Documentation</p>
        <h1>Seed Web Builder Integration Guide</h1>
        <p>
          Seed is an AI-powered technical manager and application builder for beginners, founders, and business owners.
          Seed allows users to create, deploy, and update production web applications completely within their own infrastructure accounts.
        </p>

        <h2>Core Architecture: User-Owned Infrastructure</h2>
        <p>
          Unlike traditional website builders that lock your business into proprietary hosting platforms, Seed acts strictly as an authorized management layer:
        </p>
        <ul>
          <li><strong>GitHub:</strong> Your code repositories are created and committed directly in your personal or organization GitHub account.</li>
          <li><strong>Supabase:</strong> Dedicated PostgreSQL databases, tables, auth schemas, and row-level policies run inside your own Supabase project.</li>
          <li><strong>Vercel:</strong> Global edge hosting, serverless functions, and SSL certificates are provisioned directly in your Vercel account.</li>
          <li><strong>OpenAI:</strong> Planning and code generation are powered directly by your OpenAI API key with zero markup.</li>
        </ul>

        <h2>Official Integrations</h2>
        <h3>1. Vercel Integration</h3>
        <p>
          Seed connects to your Vercel account via official OAuth 2.0. Once authorized, Seed can:
        </p>
        <ul>
          <li>Create new production projects linked directly to your GitHub repository.</li>
          <li>Configure required environment variables (e.g., Supabase database URLs, publishable keys).</li>
          <li>Trigger automatic deployments on code updates and monitor live deployment health.</li>
          <li>Assign production domains and manage SSL certification.</li>
        </ul>

        <h3>2. GitHub App Integration</h3>
        <p>
          Seed uses the official <strong>Seed Web Builder GitHub App</strong>. When you install the app on your account or organization, Seed receives an installation identifier. When changes are requested:
        </p>
        <ul>
          <li>Seed generates short-lived RS256 JWT installation tokens in-memory with a 1-hour maximum lifespan.</li>
          <li>Initializes clean Next.js, React, and Tailwind applications.</li>
          <li>Commits code changes and features directly to your repository branches.</li>
        </ul>

        <h3>3. Supabase Integration</h3>
        <p>
          Seed connects via Supabase OAuth with Management API scopes. Seed provisions tables, runs schema migrations, configures Row Level Security (RLS), and sets up authentication settings automatically.
        </p>

        <h3>4. Seed AI (OpenAI)</h3>
        <p>
          Seed accepts your OpenAI API key, verifies model availability, and encrypts the key server-side using AES-256-GCM. Seed translates natural language requests into structured, verified execution plans.
        </p>

        <h2>Security & Governance</h2>
        <p>
          All provider credentials and tokens are encrypted at rest with AES-256-GCM. Seed Guard enforces structural security rules, and every action is logged to an immutable audit trail.
        </p>

        <h2>Revoking Access</h2>
        <p>
          You can disconnect any integration at any time from your Seed project settings or directly from the respective provider’s authorized applications dashboard. If Seed is ever offline, your live websites and databases remain 100% online and operational.
        </p>
      </article>
    </main>
  );
}
