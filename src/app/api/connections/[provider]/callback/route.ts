import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { z } from "zod";
import { storeProviderConnection } from "@/lib/connections/store";
import { seedLog } from "@/lib/logger";

const providerSchema=z.enum(["github","supabase","vercel"]);
const oauthCookieSchema=z.object({state:z.string().min(20),workspaceId:z.string().uuid(),installationId:z.string().optional()});
type TokenPayload={access_token:string;refresh_token?:string;expires_in?:number;token_type?:string;team_id?:string|null;user_id?:string;installation_id?:string};
const callbackUrl=(origin:string,provider:string)=>`${origin}/api/connections/${provider}/callback`;
const dashboard=(origin:string,result:string)=>NextResponse.redirect(new URL(`/dashboard?connection=${encodeURIComponent(result)}`,origin));
function formBody(values:Record<string,string>){return new URLSearchParams(values).toString();}
async function exchange(url:string,values:Record<string,string>){const response=await fetch(url,{method:"POST",headers:{Accept:"application/json","Content-Type":"application/x-www-form-urlencoded"},body:formBody(values),cache:"no-store"});if(!response.ok)throw new Error(`OAuth token exchange failed (${response.status}).`);return response.json()as Promise<TokenPayload>;}

export async function GET(request:Request,{params}:{params:Promise<{provider:string}>}){
  const parsedProvider=providerSchema.safeParse((await params).provider);const url=new URL(request.url);if(!parsedProvider.success)return dashboard(url.origin,"invalid");const provider=parsedProvider.data;const cookieStore=await cookies();const rawCookie=cookieStore.get(`seed_oauth_${provider}`)?.value;let oauth:z.infer<typeof oauthCookieSchema>|null=null;try{oauth=oauthCookieSchema.parse(JSON.parse(rawCookie??""));}catch{return dashboard(url.origin,"expired");}
  const state=url.searchParams.get("state");if(!state||state!==oauth.state)return dashboard(url.origin,"csrf");const code=url.searchParams.get("code");
  try{
    if(provider==="github"){
      const installationId=url.searchParams.get("installation_id")??oauth.installationId;
      if(!installationId)return dashboard(url.origin,"github-cancelled");
      if(!code){const clientId=process.env.GITHUB_APP_CLIENT_ID;if(!clientId)throw new Error("GitHub user authorization is not configured.");const nextState=randomBytes(24).toString("hex");cookieStore.set("seed_oauth_github",JSON.stringify({state:nextState,workspaceId:oauth.workspaceId,installationId}),{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:600,path:"/"});const authorize=`https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(callbackUrl(url.origin,"github"))}&state=${nextState}`;return NextResponse.redirect(authorize);}
      const clientId=process.env.GITHUB_APP_CLIENT_ID;const clientSecret=process.env.GITHUB_APP_CLIENT_SECRET;if(!clientId||!clientSecret)throw new Error("GitHub OAuth credentials are missing.");const token=await exchange("https://github.com/login/oauth/access_token",{client_id:clientId,client_secret:clientSecret,code,redirect_uri:callbackUrl(url.origin,"github")});const installationsResponse=await fetch("https://api.github.com/user/installations",{headers:{Accept:"application/vnd.github+json",Authorization:`Bearer ${token.access_token}`,"X-GitHub-Api-Version":"2022-11-28"},cache:"no-store"});if(!installationsResponse.ok)throw new Error("GitHub installation validation failed.");const installations=await installationsResponse.json()as{installations:Array<{id:number;account:{login:string;type:string}}>};const installation=installations.installations.find(item=>String(item.id)===installationId);if(!installation)throw new Error("This GitHub installation does not belong to the authorized user.");await storeProviderConnection(oauth.workspaceId,"github",{installationId,accountLogin:installation.account.login,accountType:installation.account.type},["contents:write","metadata:read"]);
    }
    if(provider==="supabase"){
      if(!code)throw new Error("Supabase authorization was cancelled.");const clientId=process.env.SUPABASE_OAUTH_CLIENT_ID;const clientSecret=process.env.SUPABASE_OAUTH_CLIENT_SECRET;if(!clientId||!clientSecret)throw new Error("Supabase OAuth credentials are missing.");const token=await exchange("https://api.supabase.com/v1/oauth/token",{grant_type:"authorization_code",client_id:clientId,client_secret:clientSecret,code,redirect_uri:callbackUrl(url.origin,"supabase")});await storeProviderConnection(oauth.workspaceId,"supabase",token,(process.env.SUPABASE_OAUTH_SCOPES??"").split(" ").filter(Boolean));
    }
    if(provider==="vercel"){
      if(!code)throw new Error("Vercel authorization was cancelled.");const clientId=process.env.VERCEL_CLIENT_ID;const clientSecret=process.env.VERCEL_CLIENT_SECRET;if(!clientId||!clientSecret)throw new Error("Vercel OAuth credentials are missing.");const token=await exchange("https://api.vercel.com/v2/oauth/access_token",{client_id:clientId,client_secret:clientSecret,code,redirect_uri:callbackUrl(url.origin,"vercel")});await storeProviderConnection(oauth.workspaceId,"vercel",token,["project:read-write","deployment:read-write"]);
    }
    cookieStore.delete(`seed_oauth_${provider}`);return dashboard(url.origin,`${provider}-connected`);
  }catch(error){seedLog("error","provider_connection_failed",{provider,error:error instanceof Error?error.message:"unknown"});cookieStore.delete(`seed_oauth_${provider}`);return dashboard(url.origin,`${provider}-failed`);}
}
