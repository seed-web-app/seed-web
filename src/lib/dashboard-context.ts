import "server-only";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { seedConfig } from "@/lib/config";
import type { ProviderName } from "@/lib/providers/contracts";

export type DashboardContext={workspaceId:string;projectId:string;projectName:string;connections:Partial<Record<ProviderName,"Connected"|"Connecting"|"Needs attention">>;demo:boolean};
export async function getDashboardContext():Promise<DashboardContext>{
  if(seedConfig.demoMode)return{workspaceId:"demo-workspace",projectId:"demo-project",projectName:"Shikha Yoga",connections:{},demo:true};
  const supabase=await createSupabaseServerClient();const admin=createSupabaseAdminClient();if(!supabase||!admin)throw new Error("Seed's production database is not configured.");
  const{data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Authentication required.");
  const{data:profile}=await supabase.from("profiles").select("id").eq("auth_user_id",user.id).single();if(!profile)throw new Error("Seed profile not found.");
  const{data:workspace}=await supabase.from("workspaces").select("id").eq("owner_user_id",profile.id).order("created_at").limit(1).single();if(!workspace)throw new Error("Seed workspace not found.");
  const[{data:project},{data:rows}]=await Promise.all([supabase.from("projects").select("id,name").eq("workspace_id",workspace.id).order("updated_at",{ascending:false}).limit(1).maybeSingle(),admin.from("provider_connections").select("provider,status").eq("workspace_id",workspace.id)]);
  const connections:DashboardContext["connections"]={};for(const row of rows??[]){const status=row.status==="connected"?"Connected":row.status==="needs_attention"?"Needs attention":"Connecting";connections[row.provider as ProviderName]=status;}
  return{workspaceId:workspace.id,projectId:project?.id??"",projectName:project?.name??"My first project",connections,demo:false};
}
