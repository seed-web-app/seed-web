import { getSeedIdentity } from "@/lib/supabase/server";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSeedProfile } from "@/lib/supabase/server";
import { dashboardUrl, rootUrl, usernameFromHost } from "@/lib/tenancy";
import { getDashboardContext } from "@/lib/dashboard-context";
export const dynamic="force-dynamic";

export default async function OnboardingPage() {
  const [identity, profile, requestHeaders, context] = await Promise.all([
    getSeedIdentity(),
    getSeedProfile(),
    headers(),
    getDashboardContext(),
  ]);
  if (!identity) redirect(rootUrl("/login"));
  if (!profile?.username) redirect(rootUrl("/setup/username"));

  const tenant = usernameFromHost(requestHeaders.get("host"));
  if (tenant && tenant !== profile.username) {
    redirect(dashboardUrl(profile.username, "/dashboard"));
  }

  return <OnboardingFlow name={identity.name} context={context} />;
}
