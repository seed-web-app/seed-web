"use client";

import { createBrowserClient } from "@supabase/ssr";
import { appConfig } from "@/lib/config";

export function createSupabaseBrowserClient() {
  if (!appConfig.supabaseUrl || !appConfig.supabaseKey) return null;
  return createBrowserClient(appConfig.supabaseUrl, appConfig.supabaseKey);
}
