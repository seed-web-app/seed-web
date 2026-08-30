import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { seedConfig } from "@/lib/config";

export const dynamic="force-dynamic";
export async function GET(){const started=Date.now();let database:"ok"|"unconfigured"|"error"="unconfigured";const admin=createSupabaseAdminClient();if(admin){const{error}=await admin.from("profiles").select("id",{head:true,count:"exact"}).limit(1);database=error?"error":"ok";}const ready=seedConfig.demoMode||database==="ok";return NextResponse.json({status:ready?"ok":"not_ready",mode:seedConfig.demoMode?"demo":"live",checks:{database},latencyMs:Date.now()-started},{status:ready?200:503,headers:{"Cache-Control":"no-store"}});}
