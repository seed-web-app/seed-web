import Link from "next/link";
import { redirect } from "next/navigation";
import { UsernameSetupForm } from "@/components/username-setup-form";
import { getAppIdentity, getAppProfile } from "@/lib/supabase/server";
import { appUrl, dashboardUrl, rootDomain, rootUrl } from "@/lib/tenancy";

export const dynamic = "force-dynamic";

export default async function UsernameSetupPage() {
  const [identity, profile] = await Promise.all([
    getAppIdentity(),
    getAppProfile(),
  ]);

  if (!identity || !profile) redirect(rootUrl("/login"));
  if (profile.username) redirect(dashboardUrl(profile.username));

  return (
    <main className="auth-shell setup-shell">
      <Link className="wordmark auth-wordmark" href={rootUrl("/")}>
        new<span>/</span>app
      </Link>
      <section className="auth-card setup-card">
        <div className="auth-index">02</div>
        <p className="section-label">One last step</p>
        <h1>Choose your private address.</h1>
        <p className="auth-copy">
          Welcome, {identity.name}. Pick the subdomain for your new workspace.
        </p>
        <UsernameSetupForm
          rootDomain={rootDomain() || new URL(appUrl()).host}
        />
      </section>
      <aside className="auth-aside setup-aside" aria-hidden="true">
        <span>MAKE IT YOURS</span>
        <div className="address-preview">you.bestmodel.fun</div>
        <p>
          Short. Personal.
          <br />
          Uniquely yours.
        </p>
      </aside>
    </main>
  );
}
