"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, getCurrentProfile } from "@/lib/supabase/server";

export async function createForumThread(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const title = formData.get("title")?.toString().trim();
  const category = formData.get("category")?.toString().trim();
  const content = formData.get("content")?.toString().trim();

  if (!title || !category || !content) {
    redirect("/forum?error=missing_fields");
  }

  const author_name =
    profile.full_name?.replace(/\s+/g, "_") || profile.email?.split("@")[0] || "SuzukiOwner";

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/forum?error=auth");

  const { error } = await supabase.from("forum_threads").insert({
    title,
    category,
    content,
    author_name,
    author_id: profile.id,
    replies_count: 0,
    likes_count: 0,
  });

  if (error) {
    console.error("Failed to create thread:", error);
    redirect("/forum?error=thread_failed");
  }

  revalidatePath("/forum");
  revalidatePath("/home");
  redirect("/forum?saved=thread_created");
}

export async function createForumReply(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const thread_id = formData.get("thread_id")?.toString();
  const content = formData.get("content")?.toString().trim();

  if (!thread_id || !content) {
    redirect("/forum");
  }

  const author_name =
    profile.full_name?.replace(/\s+/g, "_") || profile.email?.split("@")[0] || "SuzukiDriver";

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/forum?error=auth");

  // 1. Insert reply
  const { error: replyError } = await supabase.from("forum_replies").insert({
    thread_id,
    content,
    author_name,
    author_id: profile.id,
  });

  if (replyError) {
    console.error("Failed to post reply:", replyError);
    redirect("/forum?error=reply_failed");
  }

  // 2. Increment replies count on thread
  const { data: thread } = await supabase
    .from("forum_threads")
    .select("replies_count")
    .eq("id", thread_id)
    .single();

  if (thread) {
    await supabase
      .from("forum_threads")
      .update({ replies_count: (thread.replies_count || 0) + 1 })
      .eq("id", thread_id);
  }

  revalidatePath("/forum");
  revalidatePath("/home");
  redirect(`/forum?thread=${thread_id}&saved=reply_posted`);
}
