import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardRedirectPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  if (profile.role === "admin") {
    redirect("/admin");
  }

  redirect("/home");
}
