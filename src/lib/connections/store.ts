import "server-only";

import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { encryptCredential, decryptCredential } from "@/lib/security/crypto";
import type { ProviderName } from "@/lib/providers/contracts";

export async function assertWorkspaceOwner(workspaceId: string) {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) throw new Error("Seed's credential store is not configured.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!profile) throw new Error("Seed profile not found.");

  const { data: workspace } = await admin
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .eq("owner_user_id", profile.id)
    .maybeSingle();
  if (!workspace) throw new Error("Workspace access denied.");

  return { admin, user, profile };
}

export async function storeProviderConnection(
  workspaceId: string,
  provider: ProviderName,
  accessData: Record<string, unknown>,
  scopes: string[] = [],
) {
  const { admin, profile } = await assertWorkspaceOwner(workspaceId);
  const encrypted_access_data = encryptCredential(JSON.stringify(accessData));

  const { error } = await admin.from("provider_connections").upsert(
    {
      workspace_id: workspaceId,
      provider,
      encrypted_access_data,
      scopes,
      status: "connected",
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id,provider" },
  );

  if (error) throw new Error("Seed could not save the provider connection.");

  await admin.from("audit_events").insert({
    actor_user_id: profile.id,
    workspace_id: workspaceId,
    tool_name: `connect_${provider}`,
    metadata: { provider, status: "connected" },
  });
}

export async function removeProviderConnection(
  workspaceId: string,
  provider: ProviderName,
) {
  const { admin, profile } = await assertWorkspaceOwner(workspaceId);

  // Read current connection to revoke at provider if possible
  const { data: conn } = await admin
    .from("provider_connections")
    .select("encrypted_access_data")
    .eq("workspace_id", workspaceId)
    .eq("provider", provider)
    .maybeSingle();

  if (conn?.encrypted_access_data) {
    try {
      const data = JSON.parse(decryptCredential(conn.encrypted_access_data)) as Record<string, unknown>;
      
      // Best-effort provider revocation
      if (provider === "vercel" && data.access_token) {
        // Vercel token deletion
        await fetch("https://api.vercel.com/v2/oauth/tokens/current", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${data.access_token}` },
        }).catch(() => null);
      }
    } catch {
      // Non-fatal
    }
  }

  const { error } = await admin
    .from("provider_connections")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("provider", provider);

  if (error) throw new Error("Could not remove connection.");

  await admin.from("audit_events").insert({
    actor_user_id: profile.id,
    workspace_id: workspaceId,
    tool_name: `disconnect_${provider}`,
    metadata: { provider },
  });
}
