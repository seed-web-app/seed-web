import Link from "next/link";
import { redirect } from "next/navigation";
import { UsernameSetupForm } from "@/components/username-setup-form";
import { seedConfig } from "@/lib/config";
import { getSeedIdentity, getSeedProfile } from "@/lib/supabase/server";
import { dashboardUrl, rootDomain, rootUrl } from "@/lib/tenancy";

export const dynamic = "force-dynamic";

export default async function UsernameSetupPage() {
  if (seedConfig.demoMode) redirect("/onboarding?demo=1");

  const [identity, profile] = await Promise.all([
    getSeedIdentity(),
    getSeedProfile(),
  ]);
  if (!identity || !profile) redirect(rootUrl("/login"));
  if (profile.username) redirect(dashboardUrl(profile.username));

  return (
    <main className="auth-page username-page">
      <Link className="brand auth-brand" href={rootUrl("/")}>
        seed<span>.</span>
      </Link>
      <section className="auth-card username-card">
        <div className="seed-mark">✦</div>
        <p className="eyebrow">One last step</p>
        <h1>
          Name your Seed
          <br />
          <em>workspace.</em>
        </h1>
        <p>
          Hi {identity.name}. Choose the unique address you will use for your
          Seed dashboard.
        </p>
        <UsernameSetupForm rootDomain={rootDomain()} />
      </section>
      <aside className="auth-quote username-quote">
        <p>
          One name.
          <br />
          Your own dashboard.
        </p>
        <span>Your client work stays inside the workspace you own.</span>
      </aside>
    </main>
  );
}
