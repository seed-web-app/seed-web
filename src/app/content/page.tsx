import { redirect } from "next/navigation";
import { getCurrentProfile, getUserVehicles, createSupabaseServerClient } from "@/lib/supabase/server";
import { CustomerNavbar } from "@/components/customer/Navbar";
import type { ContentPost } from "@/lib/types";
import { Video, Calendar, Sparkles, Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

function getEmbedUrl(url: string) {
  if (!url) return null;
  // The original seed data used this well-known demo URL. Keep the post copy,
  // but never present unrelated demo media as official dealer content.
  if (url.includes("dQw4w9WgXcQ")) return null;
  // If YouTube watch URL
  if (url.includes("youtube.com/watch?v=")) {
    const videoId = url.split("v=")[1]?.split("&")[0];
    return `https://www.youtube-nocookie.com/embed/${videoId}`;
  }
  if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1]?.split("?")[0];
    return `https://www.youtube-nocookie.com/embed/${videoId}`;
  }
  return url;
}

export default async function ContentFeedPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const vehicles = await getUserVehicles(profile.id);
  const supabase = await createSupabaseServerClient();

  const { data: rawPosts } = supabase
    ? await supabase
        .from("content_posts")
        .select("*")
        .order("published_at", { ascending: false })
    : { data: [] };

  const posts = (rawPosts as ContentPost[]) || [];

  return (
    <div className="min-h-screen bg-carbon-pattern flex flex-col selection:bg-suzuki-red selection:text-white">
      <CustomerNavbar profile={profile} vehicleCount={vehicles.length} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-suzuki-red/10 border border-suzuki-red/25 text-suzuki-brightred text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dealer Insights & Maintenance Academy</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Suzuki Technical Care Feed
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Official dealership video tips (~2x per week) covering hybrid systems, turbo servicing, primer paint prep, and 4WD operation.
            </p>
          </div>
        </div>

        {/* Video Posts List */}
        {posts.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-glass border border-white/5 p-8">
            <Video className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No Care Videos Published Yet</h3>
            <p className="text-sm text-slate-400 mt-1">
              The dealer team will post new car care guides shortly.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => {
              const embedUrl = getEmbedUrl(post.video_url);
              const formattedDate = new Date(post.published_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <article
                  key={post.id}
                  className="rounded-3xl bg-glass-card border border-white/10 overflow-hidden shadow-2xl transition-all duration-200"
                >
                  {/* Video Player Section */}
                  <div className="relative aspect-video w-full bg-suzuki-black border-b border-white/10">
                    {embedUrl?.includes("youtube-nocookie.com/embed") ? (
                      <iframe
                        src={embedUrl}
                        title={post.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    ) : embedUrl ? (
                      <video
                        controls
                        src={embedUrl}
                        className="w-full h-full object-contain bg-black"
                      >
                        Your browser does not support HTML video.
                      </video>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-[#1f242b] to-[#111419] px-6 text-center">
                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-suzuki-brightred">
                          <Video className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-bold text-white">Dealer video update in progress</p>
                        <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                          The guide notes are available below. A verified Suzuki video will appear here when the dealer publishes it.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Post Content */}
                  <div className="p-6 sm:p-8 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                      <div className="inline-flex items-center gap-1.5 font-semibold text-suzuki-brightred">
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Master Technician Guide</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                      {post.title}
                    </h2>

                    {post.caption && (
                      <p className="text-sm text-slate-300 leading-relaxed font-normal">
                        {post.caption}
                      </p>
                    )}

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                      <span>Authorized Suzuki Parts Network</span>
                      <span>Published for verified owners</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
