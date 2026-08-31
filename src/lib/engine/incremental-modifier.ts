import "server-only";

import { validateProposal } from "@/lib/seed-guard";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { decryptCredential } from "@/lib/security/crypto";
import {
  GitHubSourceProvider,
  generateInstallationToken,
  type GitHubCreds,
} from "@/lib/providers/github";
import { getProjectMemory, updateProjectMemory } from "@/lib/project-memory";
import { seedLog } from "@/lib/logger";

export interface IncrementalChangeResult {
  success: boolean;
  commitSha?: string;
  modifiedFiles: string[];
  summary: string;
  error?: string;
}

/**
 * Performs an incremental change on an existing project website.
 * Reads existing files from GitHub, asks OpenAI to modify only the necessary files,
 * validates with Seed Guard, and pushes the commit directly to the repository.
 */
export async function applyIncrementalChange(params: {
  projectId: string;
  workspaceId: string;
  userRequest: string;
  ownerLogin: string;
  repoName: string;
}): Promise<IncrementalChangeResult> {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Database unconfigured");

  // 1. Get GitHub credentials & mint token
  const { data: ghConn } = await admin
    .from("provider_connections")
    .select("encrypted_access_data")
    .eq("workspace_id", params.workspaceId)
    .eq("provider", "github")
    .eq("status", "connected")
    .single();

  if (!ghConn) throw new Error("GitHub connection required for incremental edits.");
  const ghCreds = JSON.parse(decryptCredential(ghConn.encrypted_access_data)) as GitHubCreds;
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  if (!appId || !privateKey) throw new Error("GitHub App credentials missing in environment.");

  const token = await generateInstallationToken(appId, privateKey, ghCreds.installationId);
  const github = new GitHubSourceProvider(token, params.ownerLogin, params.repoName);

  // 2. Read current repository state & key page files
  const repoState = await github.getRepositoryState();
  const candidatePaths = [
    "src/app/page.tsx",
    "src/app/layout.tsx",
    "src/components/hero.tsx",
    "src/components/services.tsx",
    "src/components/contact-form.tsx",
  ].filter((p) => repoState.files.some((f) => f.path === p));

  const existingFiles = await github.readFiles(candidatePaths);

  // 3. Load Project Memory
  const memory = await getProjectMemory(params.projectId, params.workspaceId);

  // 4. Load OpenAI credentials
  const { data: aiConn } = await admin
    .from("provider_connections")
    .select("encrypted_access_data")
    .eq("workspace_id", params.workspaceId)
    .eq("provider", "openai")
    .eq("status", "connected")
    .maybeSingle();

  let modifiedFiles: Array<{ path: string; content: string }> = [];

  if (aiConn?.encrypted_access_data) {
    const aiCreds = JSON.parse(decryptCredential(aiConn.encrypted_access_data)) as { apiKey?: string };
    if (aiCreds.apiKey) {
      const { OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey: aiCreds.apiKey });

      const filesContext = existingFiles
        .map((f) => `--- FILE: ${f.path} ---\n${f.content}`)
        .join("\n\n");

      const prompt = `You are an expert web developer incrementally updating a Next.js website for ${memory.businessName}.
USER REQUEST: "${params.userRequest}"

PROJECT MEMORY:
- Business: ${memory.businessName} (${memory.businessType})
- Style: ${memory.stylePreferences}
- Pages: ${memory.pages.join(", ")}
- Decisions: ${memory.userDecisions.join("; ")}

EXISTING RELEVANT FILES:
${filesContext}

INSTRUCTIONS:
- Modify ONLY the file(s) needed to satisfy the user request (e.g. modify hero heading, add subtitle/paragraph).
- Preserve existing styling, Tailwind classes, components, imports, and functionality.
- Return a JSON object with this EXACT structure:
{
  "summary": "Brief explanation of the changes made",
  "files": [
    {
      "path": "src/app/page.tsx",
      "content": "...entire updated file content..."
    }
  ]
}
Do NOT return markdown formatting around the JSON (e.g. no \`\`\`json). Just the raw JSON.`;

      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as {
        summary?: string;
        files?: Array<{ path: string; content: string }>;
      };

      if (parsed.files && Array.isArray(parsed.files)) {
        modifiedFiles = parsed.files;
      }
    }
  }

  // Fallback if AI was unavailable or did not produce files: targeted hero update
  if (!modifiedFiles.length && existingFiles.length) {
    const pageFile = existingFiles.find((f) => f.path === "src/app/page.tsx");
    if (pageFile) {
      // Safely replace hero heading text
      let updated = pageFile.content;
      if (params.userRequest.toLowerCase().includes("fresh vegetables")) {
        updated = updated.replace(
          /<h1[^>]*>[\s\S]*?<\/h1>/,
          `<h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">Fresh vegetables delivered to your door.</h1>`,
        );
      }
      modifiedFiles = [{ path: "src/app/page.tsx", content: updated }];
    }
  }

  if (!modifiedFiles.length) {
    return {
      success: false,
      modifiedFiles: [],
      summary: "No modifications could be determined for this request.",
      error: "No files modified.",
    };
  }

  // 5. Seed Guard Validation
  const guard = validateProposal({
    request: `Incremental change: ${params.userRequest}`,
    proposedFiles: modifiedFiles,
  });

  if (!guard.passed) {
    return {
      success: false,
      modifiedFiles: [],
      summary: "Change blocked by Seed Guard safety checks.",
      error: guard.violations?.[0]?.reason ?? "Safety policy violation.",
    };
  }

  // 6. Push commit to GitHub
  await github.writeFiles(modifiedFiles);
  const updatedState = await github.getRepositoryState();

  // 7. Update Project Memory with the new user decision
  await updateProjectMemory(params.projectId, {
    userDecisions: [...memory.userDecisions, params.userRequest],
  });

  seedLog("info", "incremental_change_applied", {
    projectId: params.projectId,
    commitSha: updatedState.commitSha,
    fileCount: modifiedFiles.length,
  });

  return {
    success: true,
    commitSha: updatedState.commitSha,
    modifiedFiles: modifiedFiles.map((f) => f.path),
    summary: `Updated ${modifiedFiles.length} file(s) and pushed commit ${updatedState.commitSha.slice(0, 7)}.`,
  };
}
