import { getSeedIdentity } from "@/lib/supabase/server";
import { SeedDashboard } from "@/components/seed-dashboard";
import { getDashboardContext } from "@/lib/dashboard-context";
export const dynamic="force-dynamic";
export default async function DashboardPage() { const [identity,context]=await Promise.all([getSeedIdentity(),getDashboardContext()]); return <SeedDashboard identity={identity??{id:"demo-user",name:"Shikha",email:"demo@seed.local",avatarUrl:null,demo:true}} context={context}/>; }
