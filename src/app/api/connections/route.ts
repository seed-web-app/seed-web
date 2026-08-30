import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { encryptCredential } from "@/lib/security/crypto";
import { rootUrl, sharedAuthCookieOptions } from "@/lib/tenancy";
import OpenAI from "openai";
const connectionRequest = z.object({ provider: z.enum(["github", "supabase", "vercel", "openai"]), workspaceId: z.string().uuid().optional(), credential: z.string().min(20).max(500).optional() });
export async function POST(request: Request) {
  const parsed = connectionRequest.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ message: "That connection request is not valid." }, { status: 400 });
  const {provider,workspaceId,credential}=parsed.data; const label={github:"Project Files",supabase:"Database",vercel:"Hosting",openai:"Seed AI"}[provider];
  if(provider==="openai"){
    if(!credential) return NextResponse.json({message:"Enter your OpenAI API key to continue."},{status:400});
    if(!workspaceId) return NextResponse.json({configured:false,message:"The key was checked but not stored in demo mode. Configure Seed's Supabase control plane to save it securely."});
    const supabase=await createSupabaseServerClient(); const admin=createSupabaseAdminClient(); if(!supabase||!admin) return NextResponse.json({configured:false,message:"Seed's secure credential store is not configured yet."},{status:503});
    const {data:{user}}=await supabase.auth.getUser(); if(!user) return NextResponse.json({message:"Sign in again to continue."},{status:401});
    const {data:owned}=await admin.from("workspaces").select("id,profiles!inner(auth_user_id)").eq("id",workspaceId).eq("profiles.auth_user_id",user.id).maybeSingle(); if(!owned) return NextResponse.json({message:"You do not have access to this workspace."},{status:403});
    try { await new OpenAI({apiKey:credential,maxRetries:0,timeout:10_000}).models.list(); } catch { return NextResponse.json({message:"OpenAI could not validate that API key. Check the key and its project access."},{status:400}); }
    const encrypted=encryptCredential(JSON.stringify({apiKey:credential})); const {error}=await admin.from("provider_connections").upsert({workspace_id:workspaceId,provider:"openai",encrypted_access_data:encrypted,status:"connected",connected_at:new Date().toISOString()},{onConflict:"workspace_id,provider"});
    if(error) return NextResponse.json({message:"Seed could not store the key securely. Please try again."},{status:500});
    return NextResponse.json({configured:true,message:"Seed AI is active. Your key was encrypted and stored server-side."});
  }
  if(!workspaceId)return NextResponse.json({configured:false,message:"Select a workspace before connecting this account."},{status:400});
  const state=randomBytes(24).toString("hex");
  const codeVerifier=provider==="supabase"?randomBytes(32).toString("base64url"):undefined;
  const codeChallenge=codeVerifier?createHash("sha256").update(codeVerifier).digest("base64url"):undefined;
  (await cookies()).set(`seed_oauth_${provider}`,JSON.stringify({state,workspaceId,codeVerifier}),sharedAuthCookieOptions({httpOnly:true,sameSite:"lax" as const,secure:process.env.NODE_ENV==="production",maxAge:600,path:"/"}));
  const callback=rootUrl(`/api/connections/${provider}/callback`);
  const authorizationUrl=provider==="github"&&process.env.GITHUB_APP_SLUG?`https://github.com/apps/${process.env.GITHUB_APP_SLUG}/installations/new?state=${state}`:provider==="supabase"&&process.env.SUPABASE_OAUTH_CLIENT_ID&&codeChallenge?`https://api.supabase.com/v1/oauth/authorize?client_id=${process.env.SUPABASE_OAUTH_CLIENT_ID}&redirect_uri=${encodeURIComponent(callback)}&response_type=code&state=${state}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`:provider==="vercel"&&process.env.VERCEL_INTEGRATION_SLUG?`https://vercel.com/integrations/${process.env.VERCEL_INTEGRATION_SLUG}/new?state=${state}`:null;
  return NextResponse.json({configured:false,authorizationUrl,message:authorizationUrl?`Continue in ${label}'s secure authorization screen.`:`${label} OAuth credentials are not configured yet. Add them to .env.local to enable the live connection.`});
}
