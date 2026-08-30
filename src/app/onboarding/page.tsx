import { getSeedIdentity } from "@/lib/supabase/server";
import { OnboardingFlow } from "@/components/onboarding-flow";
export const dynamic="force-dynamic";

export default async function OnboardingPage() { const identity = await getSeedIdentity(); return <OnboardingFlow name={identity?.name ?? "there"}/>; }
