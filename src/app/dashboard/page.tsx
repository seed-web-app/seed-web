import { getSeedIdentity } from "@/lib/supabase/server";
import { SeedDashboard } from "@/components/seed-dashboard";
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
  if (!context.demo) {
    if (!context.username) redirect(rootUrl("/setup/username"));
    const tenant = usernameFromHost(requestHeaders.get("host"));
    if (tenant !== context.username) {
      const suffix = project ? `?project=${encodeURIComponent(project)}` : "";
      redirect(dashboardUrl(context.username, `/dashboard${suffix}`));
    }
  }
  if (!context.demo && !context.projectId) redirect("/onboarding");

  return <SeedDashboard identity={identity} context={context} />;
}
