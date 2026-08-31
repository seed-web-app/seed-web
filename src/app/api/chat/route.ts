import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { getProjectMemory } from "@/lib/project-memory";
import { resolveProjectState } from "@/lib/project-state";
import { decryptCredential } from "@/lib/security/crypto";
import OpenAI from "openai";

const chatSchema = z.object({
  projectId: z.string().uuid(),
  message: z.string().trim().min(1).max(2000),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ message: "projectId is required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) return NextResponse.json({ message: "Database unconfigured" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  // Get or create conversation
  let { data: conversation } = await admin
    .from("project_conversations")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();

  if (!conversation) {
    const { data: project } = await admin.from("projects").select("workspace_id").eq("id", projectId).single();
    if (!project) return NextResponse.json({ message: "Project not found" }, { status: 404 });

    const { data: created } = await admin
      .from("project_conversations")
      .insert({ project_id: projectId, workspace_id: project.workspace_id })
      .select("id")
      .single();
    conversation = created;
  }

  const { data: messages } = await admin
    .from("project_messages")
    .select("id,sender,content,plan_json,seed_run_id,created_at")
    .eq("conversation_id", conversation?.id)
    .order("created_at", { ascending: true })
    .limit(100);

  return NextResponse.json({
    conversationId: conversation?.id,
    messages: messages ?? [],
  });
}

export async function POST(request: Request) {
  const parsed = chatSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: "Invalid chat message" }, { status: 400 });

  const { projectId, message } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) return NextResponse.json({ message: "Database unconfigured" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { data: project } = await admin
    .from("projects")
    .select("id,name,slug,workspace_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return NextResponse.json({ message: "Project not found" }, { status: 404 });

  // Get or create conversation
  let { data: conversation } = await admin
    .from("project_conversations")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();

  if (!conversation) {
    const { data: created } = await admin
      .from("project_conversations")
      .insert({ project_id: projectId, workspace_id: project.workspace_id })
      .select("id")
      .single();
    conversation = created;
  }

  // 1. Save user message
  await admin.from("project_messages").insert({
    conversation_id: conversation?.id,
    project_id: projectId,
    sender: "user",
    content: message,
  });

  // 2. Load project memory and reconciled live state
  const [memory, state] = await Promise.all([
    getProjectMemory(projectId, project.workspace_id),
    resolveProjectState(projectId, project.workspace_id),
  ]);

  // 3. Load recent chat history (last 10 messages)
  const { data: history } = await admin
    .from("project_messages")
    .select("sender,content")
    .eq("conversation_id", conversation?.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const formattedHistory = (history ?? []).reverse().map((m) => ({
    role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
    content: m.content,
  }));

  // 4. Retrieve OpenAI API key from user's provider connection
  const { data: aiConn } = await admin
    .from("provider_connections")
    .select("encrypted_access_data")
    .eq("workspace_id", project.workspace_id)
    .eq("provider", "openai")
    .eq("status", "connected")
    .maybeSingle();

  let aiResponse = "";
  if (aiConn?.encrypted_access_data) {
    try {
      const creds = JSON.parse(decryptCredential(aiConn.encrypted_access_data)) as { apiKey?: string };
      if (creds.apiKey) {
        const client = new OpenAI({ apiKey: creds.apiKey });
        const systemPrompt = `You are Seed, an expert AI website builder and assistant for ${project.name}.
You are conversing with the owner. Be concise, polite, and helpful.

PROJECT MEMORY:
- Business: ${memory.businessName} (${memory.businessType})
- Summary: ${memory.summary}
- Style: ${memory.stylePreferences}
- Pages: ${memory.pages.join(", ")}
- User Decisions: ${memory.userDecisions.join("; ")}

LIVE RECONCILED STATE:
- Website Status: ${state?.status ?? "draft"}
- Preview URL: ${state?.previewUrl ?? "None yet"}
- Production URL: ${state?.productionUrl ?? "None yet"}
- Live Customer Records: ${state?.counts.customers ?? 0}
- Live Booking Requests: ${state?.counts.bookings ?? 0}
- GitHub Repository: ${state?.github.repoUrl ?? "Connected"}

GUIDELINES:
- Distinguish between:
  1. Question / Inquiry: Answer directly and accurately using LIVE RECONCILED STATE and PROJECT MEMORY.
  2. Requested Website Change: Formulate a clear, concise plan of what will be changed in the website files and state that the plan is ready for them to review and click 'Apply Changes' on the right panel to execute.
- IMPORTANT: DO NOT claim or say "I will implement these changes now!", "I've implemented it", or "Would you like to proceed?" in chat text. Instead, say: "Here is the change plan. Click 'Apply Changes' in the Build Plan panel to inspect and deploy the updates."
- Never claim that files were updated or commits were pushed until an execution run actually starts and finishes.`;

        const completion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...formattedHistory,
          ],
        });
        aiResponse = completion.choices[0]?.message?.content ?? "";
      }
    } catch {
      // Fallback if AI provider call fails
    }
  }

  if (!aiResponse) {
    // Helpful deterministic response if OpenAI is not connected or fails
    if (message.toLowerCase().includes("page")) {
      aiResponse = `Your website currently has the following pages: ${memory.pages.join(", ")}. Would you like to edit or add any pages?`;
    } else if (message.toLowerCase().includes("url") || message.toLowerCase().includes("link")) {
      aiResponse = state?.effectiveUrl
        ? `Your website is available at ${state.effectiveUrl}.`
        : "Your website has not been deployed yet. You can build it by asking me to start!";
    } else if (message.toLowerCase().includes("booking")) {
      aiResponse = `You currently have ${state?.counts.bookings ?? 0} booking request(s).`;
    } else {
      aiResponse = `I received your request: "${message}". I will inspect the current website files and apply the change incrementally to keep everything safe and working.`;
    }
  }

  // 5. Store Seed assistant response
  const { data: savedMsg } = await admin
    .from("project_messages")
    .insert({
      conversation_id: conversation?.id,
      project_id: projectId,
      sender: "seed",
      content: aiResponse,
    })
    .select("id,sender,content,created_at")
    .single();

  return NextResponse.json({
    message: savedMsg,
  });
}
