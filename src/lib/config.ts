export const seedConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  demoMode: process.env.SEED_DEMO_MODE === "true" || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  openAIModel: process.env.OPENAI_MODEL ?? "gpt-5-mini",
} as const;

export function hasSupabaseConfig() {
  return Boolean(seedConfig.supabaseUrl && seedConfig.supabaseKey);
}
