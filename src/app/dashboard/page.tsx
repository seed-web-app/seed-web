import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { getAppIdentity, getAppProfile } from "@/lib/supabase/server";
import {
  dashboardUrl,
  isRootHost,
  rootDomain,
  rootUrl,
  usernameFromHost,
} from "@/lib/tenancy";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [identity, profile, requestHeaders] = await Promise.all([
    getAppIdentity(),
    getAppProfile(),
    headers(),
  ]);

  if (!identity || !profile) redirect(rootUrl("/login"));
  if (!profile.username) redirect(rootUrl("/setup/username"));

  const host = requestHeaders.get("host");
  const tenant = usernameFromHost(host);

  if (tenant && tenant !== profile.username) {
    redirect(dashboardUrl(profile.username));
  }

  if (rootDomain() && isRootHost(host)) {
    redirect(dashboardUrl(profile.username));
  }

  const address = rootDomain()
    ? `${profile.username}.${rootDomain()}`
    : profile.username;

  return (
    <main className="dashboard-shell">
      <nav className="dashboard-nav">
        <a className="wordmark wordmark-light" href={rootUrl("/")}>
          new<span>/</span>app
        </a>
        <form action={signOut}>
          <button className="sign-out" type="submit">
            Sign out
          </button>
        </form>
      </nav>

      <section className="dashboard-content">
        <div className="dashboard-heading">
          <p className="section-label">Clean workspace</p>
          <h1>Ready for the new idea.</h1>
          <p>
            Everything from the previous app has been removed. This page is the
            starting point for what you build next.
          </p>
        </div>

        <div className="dashboard-grid">
          <article className="address-card">
            <p>Your private address</p>
            <strong>{address}</strong>
            <span>
              <i /> Active
            </span>
          </article>
          <article className="identity-card">
            <p>Signed in with Google</p>
            <strong>{identity.name}</strong>
            <span>{identity.email}</span>
          </article>
          <article className="blank-card">
            <span>00</span>
            <div>
              <p>Features</p>
              <strong>Intentionally empty</strong>
            </div>
          </article>
        </div>
      </section>

      <footer className="dashboard-footer">
        <span>Supabase connected</span>
        <span>Deployed with Vercel</span>
        <span>Source on GitHub</span>
      </footer>
    </main>
  );
}
