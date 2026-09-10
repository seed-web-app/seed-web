import Link from "next/link";
import { getCurrentProfile, getUserVehicles, createSupabaseServerClient } from "@/lib/supabase/server";
import { CustomerNavbar } from "@/components/customer/Navbar";
import { createForumThread, createForumReply } from "./actions";
import type { ForumThread, ForumReply } from "@/lib/types";
import {
  MessageSquare,
  Plus,
  Heart,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  MessageCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface ForumPageProps {
  searchParams: Promise<{
    category?: string;
    thread?: string;
    new_thread?: string;
    saved?: string;
    error?: string;
  }>;
}

export default async function ForumPage({ searchParams }: ForumPageProps) {
  const profile = await getCurrentProfile();
  const vehicles = profile ? await getUserVehicles(profile.id) : [];
  const supabase = await createSupabaseServerClient();
  const { category, thread: activeThreadId, new_thread, saved, error } = await searchParams;

  let query = supabase
    ? supabase.from("forum_threads").select("*").order("created_at", { ascending: false })
    : null;

  if (query && category && category !== "All") {
    query = query.eq("category", category);
  }

  const { data: rawThreads } = query ? await query : { data: [] };
  const threads = (rawThreads as ForumThread[]) || [];

  // Active thread details and replies if selected
  let activeThread: ForumThread | null = null;
  let activeReplies: ForumReply[] = [];
  if (activeThreadId && supabase) {
    const { data: threadData } = await supabase
      .from("forum_threads")
      .select("*")
      .eq("id", activeThreadId)
      .maybeSingle();

    if (threadData) {
      activeThread = threadData as ForumThread;
      const { data: repliesData } = await supabase
        .from("forum_replies")
        .select("*")
        .eq("thread_id", activeThreadId)
        .order("created_at", { ascending: true });
      activeReplies = (repliesData as ForumReply[]) || [];
    }
  }

  const forumCategories = [
    "All",
    "Jimny 4x4 & Off-Roading Mauritius",
    "Swift Performance & Tuning",
    "Maintenance & Garages",
    "General Discussion",
  ];

  return (
    <div className="min-h-screen bg-[#eaeded] flex flex-col font-sans selection:bg-[#ffd814] selection:text-black">
      <CustomerNavbar profile={profile} vehicleCount={vehicles.length} />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Notifications */}
        {saved && (
          <div className="p-3.5 rounded-md bg-[#e7f4e4] border border-[#2b8a3e] text-xs text-[#2b8a3e] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {saved === "thread_created"
                ? "Your discussion topic has been published to the community."
                : "Your reply was posted successfully."}
            </span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-md bg-[#fdf3f2] border border-[#d9381e] text-xs text-[#d9381e] flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>Could not process discussion request. Please check required fields.</span>
          </div>
        )}

        {/* Banner Header */}
        <div className="amazon-card p-6 sm:p-8 bg-gradient-to-r from-[#131921] to-[#232f3e] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block bg-[#f08804] text-[#111111] font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded mb-1">
              Mauritius Suzuki Owners Community
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Owner Discussion & Technical Forum
            </h1>
            <p className="text-xs sm:text-sm text-[#cccccc] mt-1">
              Connect with fellow island drivers. Share off-road trail reports, fuel economy stats, and garage paint reviews.
            </p>
          </div>

          <Link
            href={profile ? "/forum?new_thread=true" : "/login"}
            className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-full btn-amazon-primary text-xs font-semibold cursor-pointer flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Start Discussion</span>
          </Link>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
          {forumCategories.map((cat) => {
            const isActive = (category || "All") === cat;
            return (
              <Link
                key={cat}
                href={cat === "All" ? "/forum" : `/forum?category=${encodeURIComponent(cat)}`}
                className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-[#131921] text-white font-bold"
                    : "bg-white border border-[#d5d9d9] text-[#0f1111] hover:bg-[#f7fafa]"
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>

        {/* Threads List */}
        <div className="space-y-3.5">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className="amazon-card bg-white p-5 hover:border-[#888c8c] transition-colors"
            >
              <div className="flex items-center justify-between gap-2 text-xs text-[#565959] mb-1.5">
                <span className="px-2 py-0.5 rounded bg-[#f3f3f3] text-[#0f1111] font-bold text-[10px] uppercase tracking-wider">
                  {thread.category}
                </span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(thread.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <Link
                href={`/forum?thread=${thread.id}${category ? `&category=${category}` : ""}`}
                className="block group"
              >
                <h2 className="text-base sm:text-lg font-bold text-[#0f1111] group-hover:text-[#c7511f] leading-snug">
                  {thread.title}
                </h2>
                <p className="text-xs text-[#565959] mt-1.5 line-clamp-2 leading-relaxed">
                  {thread.content}
                </p>
              </Link>

              <div className="mt-3 pt-3 border-t border-[#f0f0f0] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#febd69] text-[#111111] flex items-center justify-center font-bold text-[10px]">
                    {thread.author_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-[#0f1111] text-[11px]">
                    @{thread.author_name}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[#565959]">
                  <Link
                    href={`/forum?thread=${thread.id}`}
                    className="flex items-center gap-1 text-[#007185] hover:text-[#c7511f] font-semibold text-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{thread.replies_count} replies</span>
                  </Link>

                  <span className="flex items-center gap-1 text-xs">
                    <Heart className="w-3.5 h-3.5 text-[#cc0c39]" />
                    <span>{thread.likes_count}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Thread Details & Replies Modal */}
        {activeThread && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 sm:p-8 max-w-2xl w-full my-8 shadow-2xl space-y-6">
              <div className="flex items-start justify-between pb-3 border-b border-[#f0f0f0]">
                <div>
                  <span className="px-2 py-0.5 rounded bg-[#f3f3f3] text-[#0f1111] font-bold text-[10px] uppercase tracking-wider block w-max mb-1">
                    {activeThread.category}
                  </span>
                  <h2 className="text-xl font-bold text-[#0f1111] leading-snug">
                    {activeThread.title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-[#565959] mt-1">
                    <span>Posted by <strong className="text-[#0f1111]">@{activeThread.author_name}</strong></span>
                    <span>•</span>
                    <span>{new Date(activeThread.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <Link href="/forum" className="p-1 text-[#565959] hover:text-[#0f1111]">
                  <X className="w-5 h-5" />
                </Link>
              </div>

              {/* Thread Content */}
              <div className="text-xs sm:text-sm text-[#0f1111] leading-relaxed bg-[#f7fafa] p-4 rounded-lg border border-[#e7e7e7]">
                {activeThread.content}
              </div>

              {/* Replies Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase text-[#565959] tracking-wider flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-[#c7511f]" />
                  <span>Replies ({activeReplies.length})</span>
                </h3>

                {activeReplies.length === 0 ? (
                  <p className="text-xs text-[#565959] italic">
                    No replies yet. Be the first to share your thoughts!
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    {activeReplies.map((r) => (
                      <div key={r.id} className="p-3 rounded-lg bg-white border border-[#e7e7e7] text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-[#565959]">
                          <span className="font-bold text-[#0f1111]">@{r.author_name}</span>
                          <span>{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[#0f1111]">{r.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reply Form or Sign In */}
              {profile ? (
                <form action={createForumReply} className="space-y-3 pt-4 border-t border-[#f0f0f0]">
                  <input type="hidden" name="thread_id" value={activeThread.id} />
                  <div>
                    <label className="block text-xs font-bold text-[#0f1111] mb-1">
                      Post your reply (as @{profile.full_name?.replace(/\s+/g, "_") || "SuzukiOwner"}):
                    </label>
                    <textarea
                      name="content"
                      rows={3}
                      required
                      placeholder="Type your response or advice for fellow Mauritian owners..."
                      className="w-full text-xs p-2.5 rounded border border-[#888c8c] focus:ring-1 focus:ring-[#e77600] resize-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="py-2 px-5 rounded-full btn-amazon-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post Reply</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="pt-4 border-t border-[#f0f0f0] text-center py-4 bg-[#f7fafa] rounded-lg">
                  <p className="text-xs text-[#565959] mb-2 font-medium">
                    Sign in with Google to post your reply in this discussion
                  </p>
                  <Link
                    href="/login"
                    className="px-5 py-2 rounded-full btn-amazon-primary text-xs font-bold text-[#0f1111] inline-block shadow-xs"
                  >
                    Sign In to Reply
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Start New Thread Modal */}
        {new_thread === "true" && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 sm:p-8 max-w-xl w-full my-8 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
                <h2 className="text-lg font-bold text-[#0f1111] flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#f08804]" />
                  <span>Start a New Discussion</span>
                </h2>
                <Link href="/forum" className="p-1 text-[#565959] hover:text-[#0f1111]">
                  <X className="w-5 h-5" />
                </Link>
              </div>

              <form action={createForumThread} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#0f1111] mb-1">
                    Category:
                  </label>
                  <select
                    name="category"
                    required
                    defaultValue="General Discussion"
                    className="w-full text-xs p-2 rounded border border-[#888c8c] bg-white focus:ring-1 focus:ring-[#e77600]"
                  >
                    {forumCategories.filter((c) => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0f1111] mb-1">
                    Topic Title:
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="e.g. Recommended Jimny tire pressure for sand driving in Le Morne"
                    className="w-full text-xs p-2 rounded border border-[#888c8c] focus:ring-1 focus:ring-[#e77600]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0f1111] mb-1">
                    Discussion Content:
                  </label>
                  <textarea
                    name="content"
                    rows={4}
                    required
                    placeholder="Share details, questions, or garage experiences with the community..."
                    className="w-full text-xs p-2.5 rounded border border-[#888c8c] focus:ring-1 focus:ring-[#e77600] resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Link
                    href="/forum"
                    className="py-2 px-4 rounded-full btn-amazon-outline text-xs font-semibold"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="py-2 px-5 rounded-full btn-amazon-primary text-xs font-semibold cursor-pointer"
                  >
                    Publish Discussion
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
