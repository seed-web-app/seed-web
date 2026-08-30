import { getSeedIdentity } from "@/lib/supabase/server";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { seedConfig } from "@/lib/config";
import { getSeedProfile } from "@/lib/supabase/server";
import { dashboardUrl, rootUrl, usernameFromHost } from "@/lib/tenancy";
export const dynamic="force-dynamic";

export default async function OnboardingPage() {
  const [identity, profile, requestHeaders] = await Promise.all([
    getSeedIdentity(),
    getSeedProfile(),
    headers(),
  ]);
  if (!identity) redirect(rootUrl("/login"));
  if (!seedConfig.demoMode) {
    if (!profile?.username) redirect(rootUrl("/setup/username"));
    if (usernameFromHost(requestHeaders.get("host")) !== profile.username) {
      redirect(dashboardUrl(profile.username, "/onboarding"));
    }
  }
  return <OnboardingFlow name={identity.name}/>;
}
