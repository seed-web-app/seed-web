"use client";
import { createBrowserClient } from "@supabase/ssr";
import { seedConfig } from "@/lib/config";

export function createSupabaseBrowserClient() {
  if (!seedConfig.supabaseUrl || !seedConfig.supabaseKey) return null;
  return createBrowserClient(seedConfig.supabaseUrl, seedConfig.supabaseKey);
}
