export const seedConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  demoMode: false,
  openAIModel: process.env.OPENAI_MODEL ?? "gpt-5-mini",
} as const;

export function hasSupabaseConfig() {
  return Boolean(seedConfig.supabaseUrl && seedConfig.supabaseKey);
}
