const required=["NEXT_PUBLIC_APP_URL","NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY","SUPABASE_SERVICE_ROLE_KEY","SEED_CREDENTIAL_ENCRYPTION_KEY","GITHUB_APP_ID","GITHUB_APP_SLUG","GITHUB_APP_PRIVATE_KEY","GITHUB_APP_CLIENT_ID","GITHUB_APP_CLIENT_SECRET","SUPABASE_OAUTH_CLIENT_ID","SUPABASE_OAUTH_CLIENT_SECRET","VERCEL_CLIENT_ID","VERCEL_CLIENT_SECRET","VERCEL_INTEGRATION_SLUG"];
const missing=required.filter(key=>!process.env[key]);
const invalid=[];
if(process.env.SEED_DEMO_MODE!=="false")invalid.push("SEED_DEMO_MODE must be false");
if(process.env.NEXT_PUBLIC_APP_URL&&!process.env.NEXT_PUBLIC_APP_URL.startsWith("https://"))invalid.push("NEXT_PUBLIC_APP_URL must use https://");
if(process.env.SEED_CREDENTIAL_ENCRYPTION_KEY){try{if(Buffer.from(process.env.SEED_CREDENTIAL_ENCRYPTION_KEY,"base64").length!==32)invalid.push("SEED_CREDENTIAL_ENCRYPTION_KEY must decode to 32 bytes");}catch{invalid.push("SEED_CREDENTIAL_ENCRYPTION_KEY is not valid base64");}}
if(missing.length||invalid.length){console.error("Seed is not production-ready.");if(missing.length)console.error(`Missing: ${missing.join(", ")}`);for(const issue of invalid)console.error(issue);process.exit(1);}console.log("Seed production environment is complete.");
