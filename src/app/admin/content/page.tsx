import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createContentPost, updateContentPost, deleteContentPost } from "./actions";
import type { ContentPost } from "@/lib/types";
import {
  Video,
  Plus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  Edit3,
  Trash2,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface AdminContentPageProps {
  searchParams: Promise<{
    add?: string;
    edit?: string;
    saved?: string;
    error?: string;
  }>;
}

export default async function AdminContentPage({ searchParams }: AdminContentPageProps) {
  const { add, edit, saved, error } = await searchParams;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data: rawPosts } = await supabase
    .from("content_posts")
    .select("*")
    .order("published_at", { ascending: false });

  const posts = (rawPosts as ContentPost[]) || [];

  let postToEdit: ContentPost | null = null;
  if (edit) {
    const { data } = await supabase.from("content_posts").select("*").eq("id", edit).maybeSingle();
    postToEdit = data as ContentPost | null;
  }

  return (
    <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-7xl w-full mx-auto">
      {/* Notifications */}
      {saved && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>
            {saved === "created"
              ? "Video guide published successfully."
              : saved === "updated"
              ? "Video post updated successfully."
              : "Post deleted from feed."}
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>Failed to perform content update. Please check all fields.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Video className="w-7 h-7 text-suzuki-red" />
            <span>Content & Video Management</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Publish weekly technical explainers (~2x/week), hybrid maintenance walkthroughs, and primer paint prep tips for customers.
          </p>
        </div>

        <Link
          href="/admin/content?add=true"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-suzuki-red hover:bg-suzuki-brightred text-white text-xs font-bold shadow-lg shadow-suzuki-red/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Video Post</span>
        </Link>
      </div>

      {/* Content List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.length === 0 ? (
          <div className="col-span-full py-16 text-center rounded-3xl bg-glass border border-white/5 p-8">
            <Video className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No Video Posts Published</h3>
            <p className="text-xs text-slate-400 mt-1">
              Add your first technical guide or YouTube walkthrough.
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="rounded-3xl bg-glass-card border border-white/10 p-6 flex flex-col justify-between space-y-4 shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-slate-400 mb-2">
                  <span className="flex items-center gap-1 text-[11px] font-mono">
                    <Calendar className="w-3.5 h-3.5 text-suzuki-brightred" />
                    {new Date(post.published_at).toLocaleDateString()}
                  </span>
                  <a
                    href={post.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-white"
                  >
                    <span>Open URL</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <h3 className="text-base font-bold text-white line-clamp-2 leading-snug">
                  {post.title}
                </h3>

                {post.caption && (
                  <p className="text-xs text-slate-300 line-clamp-3 mt-2 leading-relaxed">
                    {post.caption}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono truncate max-w-xs">
                  {post.video_url}
                </span>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/admin/content?edit=${post.id}`}
                    className="p-2 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-white/5 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Link>

                  <form action={deleteContentPost}>
                    <input type="hidden" name="id" value={post.id} />
                    <button
                      type="submit"
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Video Modal */}
      {add === "true" && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-suzuki-carbon border border-white/10 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-suzuki-red" />
                <span>Publish Video Guide</span>
              </h2>
              <Link href="/admin/content" className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </Link>
            </div>

            <form action={createContentPost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Post Title <span className="text-suzuki-red">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Jimny AllGrip 4L Transfer Case Operation"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Video URL (YouTube or direct MP4) <span className="text-suzuki-red">*</span>
                </label>
                <input
                  type="url"
                  name="video_url"
                  required
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Technical Explanation / Caption
                </label>
                <textarea
                  name="caption"
                  rows={4}
                  placeholder="Describe key tips, tools required, or maintenance precautions..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <Link
                  href="/admin/content"
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-suzuki-red hover:bg-suzuki-brightred text-white text-xs font-bold shadow-lg shadow-suzuki-red/30 cursor-pointer"
                >
                  Publish Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {postToEdit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-suzuki-carbon border border-white/10 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <span>Edit Video Guide</span>
              </h2>
              <Link href="/admin/content" className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </Link>
            </div>

            <form action={updateContentPost} className="space-y-4">
              <input type="hidden" name="id" value={postToEdit.id} />

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Post Title <span className="text-suzuki-red">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={postToEdit.title}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Video URL <span className="text-suzuki-red">*</span>
                </label>
                <input
                  type="url"
                  name="video_url"
                  required
                  defaultValue={postToEdit.video_url}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Technical Explanation / Caption
                </label>
                <textarea
                  name="caption"
                  rows={4}
                  defaultValue={postToEdit.caption || ""}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <Link
                  href="/admin/content"
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-suzuki-red hover:bg-suzuki-brightred text-white text-xs font-bold shadow-lg shadow-suzuki-red/30 cursor-pointer"
                >
                  Update Video Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
