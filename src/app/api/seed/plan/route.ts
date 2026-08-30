import { NextResponse } from "next/server";
import { seedRequestSchema, validateProposal } from "@/lib/seed-guard";
import { OpenAISeedProvider } from "@/lib/ai/openai-provider";
import { z } from "zod";
import { seedConfig } from "@/lib/config";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { decryptCredential } from "@/lib/security/crypto";
import { randomUUID } from "crypto";
import { seedLog } from "@/lib/logger";
const planRequestSchema=seedRequestSchema.extend({projectId:z.string().uuid().optional()});
function skillsFor(request: string) { const lower = request.toLowerCase(); return ["base-app", ...(lower.includes("booking") || lower.includes("book ") ? ["booking", "admin-panel", "database"] : lower.includes("lead") || lower.includes("contact") ? ["business-website", "lead-form"] : ["business-website"])]; }
export async function POST(request: Request) {
  const parsed=planRequestSchema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({message:"Please describe what you would like Seed to build."},{status:400});
  const guard=validateProposal({request:parsed.data.request});if(!guard.passed)return NextResponse.json({message:"Seed paused this request because it needs a safety review."},{status:422});
  const skills=skillsFor(parsed.data.request);let plan={summary:`Safely update the project using ${skills.slice(1).join(", ")||"the business website"} skill.`,skills,steps:[{title:"Read the latest code, database, and hosting state",kind:"inspect" as const},{title:"Compare it with Seed's last snapshot",kind:"inspect" as const},{title:"Prepare the smallest safe change",kind:"generate" as const},{title:"Run Seed Guard, type checks, build, and tests",kind:"validate" as const},{title:"Create a private preview for approval",kind:"deploy" as const}]};
  let apiKey=seedConfig.demoMode?process.env.OPENAI_API_KEY:undefined;let liveContext:{admin:NonNullable<ReturnType<typeof createSupabaseAdminClient>>;profileId:string;workspaceId:string;projectId:string}|null=null;
  if(!seedConfig.demoMode){
    if(!parsed.data.projectId)return NextResponse.json({message:"Select a project before asking Seed."},{status:400});
    const supabase=await createSupabaseServerClient();const admin=createSupabaseAdminClient();if(!supabase||!admin)return NextResponse.json({message:"Seed's production services are not configured."},{status:503});
    const{data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({message:"Sign in again to continue."},{status:401});
    const{data:project}=await supabase.from("projects").select("id,workspace_id").eq("id",parsed.data.projectId).maybeSingle();if(!project)return NextResponse.json({message:"You do not have access to this project."},{status:403});
    const{data:profile}=await admin.from("profiles").select("id").eq("auth_user_id",user.id).maybeSingle();if(!profile)return NextResponse.json({message:"Seed profile not found."},{status:409});liveContext={admin,profileId:profile.id,workspaceId:project.workspace_id,projectId:project.id};
    const{data:connection}=await admin.from("provider_connections").select("encrypted_access_data,status").eq("workspace_id",project.workspace_id).eq("provider","openai").eq("status","connected").maybeSingle();
    if(connection){try{apiKey=(JSON.parse(decryptCredential(connection.encrypted_access_data))as{apiKey?:string}).apiKey;}catch{return NextResponse.json({message:"Seed AI needs to be reconnected."},{status:409});}}
  }
  let message=apiKey?"Seed prepared a safe plan. Review it before creating a preview.":"A safe plan is ready. Activate Seed AI for a project-specific AI plan.";if(apiKey){try{plan=await new OpenAISeedProvider(apiKey).plan({request:parsed.data.request,skills});}catch(error){message="Seed AI could not be reached, so a safe fallback plan was prepared.";seedLog("warn","seed_ai_fallback",{projectId:parsed.data.projectId,error:error instanceof Error?error.message:"unknown"});}}
  const runId=randomUUID();if(liveContext){const{admin,profileId,workspaceId,projectId}=liveContext;const{error:runError}=await admin.from("seed_runs").insert({id:runId,project_id:projectId,user_request:parsed.data.request,status:"waiting_for_user"});if(!runError){await admin.from("seed_run_steps").insert(plan.steps.map((step,index)=>({seed_run_id:runId,step_type:`${index+1}_${step.kind}`,status:"pending",input_summary:step.title})));await admin.from("audit_events").insert({actor_user_id:profileId,workspace_id:workspaceId,project_id:projectId,seed_run_id:runId,tool_name:"plan_seed_run",metadata:{skills,guardPassed:true}});}}
  return NextResponse.json({runId,skills,guard,plan,message});
}
