import Link from "next/link";

export const dynamic = "force-static";

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <Link className="brand" href="/">
        seed<span>.</span>
      </Link>
      <article>
        <p className="eyebrow">Privacy</p>
        <h1>Privacy Policy</h1>
        <p>
          At Seed, your privacy and data ownership are our foundational principles. This Privacy Policy explains how Seed Web Builder (&quot;Seed&quot;, &quot;we&quot;, &quot;us&quot;) collects, uses, and protects your information when using our application and integration services.
        </p>

        <h2>1. Information We Collect</h2>
        <p>We collect only the minimum information required to manage projects you explicitly authorize:</p>
        <ul>
          <li><strong>Account Information:</strong> Your name, email address, and profile picture provided through Google Authentication.</li>
          <li><strong>Workspace & Project Metadata:</strong> Workspace name, project names, and feature configuration settings.</li>
          <li><strong>Encrypted Authorization Credentials:</strong> OAuth tokens and installation IDs for GitHub, Supabase, Vercel, and OpenAI. All credentials are encrypted at rest using AES-256-GCM and are never sent to the browser or logged.</li>
          <li><strong>Audit Trail:</strong> Timestamps and actions performed by Seed on your behalf to maintain complete operational transparency.</li>
        </ul>

        <h2>2. Information We Do NOT Collect</h2>
        <ul>
          <li>We never request or store your GitHub, Vercel, Supabase, or Google passwords.</li>
          <li>We do not sell, rent, or monetize your personal data, source code, or application content.</li>
          <li>We do not train public AI models on your private application code or customer database records.</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <p>Your information is used strictly to:</p>
        <ul>
          <li>Authenticate your identity and maintain workspace tenancy.</li>
          <li>Provision repositories, database tables, and deployments in accounts you own.</li>
          <li>Communicate system notices and deployment run statuses.</li>
        </ul>

        <h2>4. Data Storage and Security</h2>
        <p>
          Sensitive credentials (such as GitHub App installation identifiers, Vercel tokens, and OpenAI API keys) are stored encrypted using industry-standard AES-256-GCM cryptography. Encryption keys are managed independently in server-side environments.
        </p>

        <h2>5. Your Rights & Data Deletion</h2>
        <p>
          You have full control over your data. You can disconnect your third-party accounts at any time from your Seed project settings. Because your code, database, and deployments reside in accounts you own, disconnecting Seed leaves your live website and customer data completely intact and under your direct control.
        </p>

        <h2>6. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy or our security practices, please contact our support team at{" "}
          <a className="text-link" href="mailto:support@bestmodel.fun">
            support@bestmodel.fun
          </a>.
        </p>
      </article>
    </main>
  );
}
