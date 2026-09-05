import { getSeedIdentity } from "@/lib/supabase/server";
import { SeedBuilderWorkspace } from "@/components/seed-builder-workspace";
import { getDashboardContext } from "@/lib/dashboard-context";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { dashboardUrl, rootUrl, usernameFromHost } from "@/lib/tenancy";
export const dynamic="force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project } = await searchParams;
  const [identity, context, requestHeaders] = await Promise.all([
    getSeedIdentity(),
    getDashboardContext(project),
    headers(),
  ]);

  if (!identity) redirect(rootUrl("/login"));
  if (!context.username) redirect(rootUrl("/setup/username"));

  const host = requestHeaders.get("host");
  const tenant = usernameFromHost(host);

  // If visiting from a subdomain and it does NOT match the authenticated user's username,
  // reject access to prevent User A accessing User B's dashboard.
  if (tenant && tenant !== context.username) {
    // Redirect to the user's own authorized dashboard
    redirect(dashboardUrl(context.username, "/dashboard"));
  }

  // If on the root domain, redirect to their private subdomain dashboard
  if (!tenant && context.username) {
    const suffix = project ? `?project=${encodeURIComponent(project)}` : "";
    redirect(dashboardUrl(context.username, `/dashboard${suffix}`));
  }

  if (!context.projectId) redirect(rootUrl("/onboarding"));

  return <SeedBuilderWorkspace identity={identity} context={context} />;
}
