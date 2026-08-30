import Link from "next/link";

export const dynamic = "force-static";

export default function SupportPage() {
  return (
    <main className="legal-page">
      <Link className="brand" href="/">
        seed<span>.</span>
      </Link>
      <article>
        <p className="eyebrow">Help &amp; Support</p>
        <h1>Seed Support Center</h1>
        <p>
          Need help setting up your integrations, planning a new website, or managing your custom domain? Our team and documentation are here to assist you.
        </p>

        <h2>Quick Troubleshooting</h2>
        <h3>GitHub App Authorization</h3>
        <p>
          If your repository changes are not appearing or your GitHub connection shows <em>Needs attention</em>:
        </p>
        <ul>
          <li>Open your <strong>Settings &gt; Connections</strong> in the Seed dashboard.</li>
          <li>Click <strong>Reconnect</strong> next to GitHub to re-verify your installation permissions.</li>
          <li>Ensure you granted repository access to the organization or personal account where your project resides.</li>
        </ul>

        <h3>Vercel Deployment Issues</h3>
        <p>
          If your live website does not build or shows errors:
        </p>
        <ul>
          <li>Check that your Vercel project has the required Supabase environment variables configured.</li>
          <li>Visit your project overview to review recent Seed run logs and error messages.</li>
          <li>Verify your custom domain DNS records in Vercel.</li>
        </ul>

        <h3>Supabase Database Connectivity</h3>
        <p>
          Ensure your Supabase project is active and that your API keys have not been regenerated or rotated manually without updating Seed.
        </p>

        <h2>Contact Support</h2>
        <p>
          For technical assistance, security inquiries, or account questions:
        </p>
        <ul>
          <li><strong>Email:</strong> <a className="text-link" href="mailto:support@bestmodel.fun">support@bestmodel.fun</a></li>
          <li><strong>Documentation:</strong> <Link className="text-link" href="/doc">Integration Documentation</Link></li>
          <li><strong>Terms &amp; EULA:</strong> <Link className="text-link" href="/eula">End User License Agreement</Link></li>
          <li><strong>Privacy Policy:</strong> <Link className="text-link" href="/privacy">Privacy Policy</Link></li>
        </ul>

        <h2>System Status</h2>
        <p>
          Live API health checks can be verified at any time at{" "}
          <a className="text-link" href="/api/health" target="_blank" rel="noopener noreferrer">
            /api/health
          </a>.
        </p>
      </article>
    </main>
  );
}
