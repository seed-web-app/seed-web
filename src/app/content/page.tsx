import Image from "next/image";
import { redirect } from "next/navigation";
import { Calendar, Play, Sparkles, Video, Wrench } from "lucide-react";
import { CustomerNavbar } from "@/components/customer/Navbar";
import { createSupabaseServerClient, getCurrentProfile, getUserVehicles } from "@/lib/supabase/server";
import type { ContentPost } from "@/lib/types";

export const dynamic = "force-dynamic";

function getEmbedUrl(url: string) {
  if (!url || url.includes("dQw4w9WgXcQ")) return null;
  if (url.includes("youtube.com/watch?v=")) return `https://www.youtube-nocookie.com/embed/${url.split("v=")[1]?.split("&")[0]}`;
  if (url.includes("youtu.be/")) return `https://www.youtube-nocookie.com/embed/${url.split("youtu.be/")[1]?.split("?")[0]}`;
  return url;
}

export default async function ContentFeedPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/");

  const [vehicles, supabase] = await Promise.all([getUserVehicles(profile.id), createSupabaseServerClient()]);
  const { data } = supabase ? await supabase.from("content_posts").select("*").order("published_at", { ascending: false }) : { data: [] };
  const posts = (data as ContentPost[]) || [];

  return (
    <div className="app-canvas min-h-screen text-[#1d1d1f]">
      <CustomerNavbar profile={profile} vehicleCount={vehicles.length} />
      <main className="mx-auto max-w-6xl space-y-9 px-4 pb-24 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-16">
        <section className="relative min-h-[430px] overflow-hidden rounded-[30px] bg-[#1d1d1f] shadow-[0_24px_70px_rgba(17,17,19,0.15)] sm:min-h-[500px] sm:rounded-[38px]">
          <Image src="/brand/parts-studio.jpg" alt="Genuine replacement parts arranged in a clean service studio" fill preload sizes="(max-width: 1200px) 100vw, 1150px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/[0.86] via-black/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 z-10 max-w-3xl p-6 text-white sm:p-10 lg:p-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur-xl"><Sparkles className="h-3.5 w-3.5" /> Dealer knowledge</span>
            <h1 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-5xl">Care, explained simply.</h1>
            <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-white/70 sm:text-base">Short guidance from the dealer team on hybrid systems, tropical maintenance, primer preparation, and everyday Suzuki ownership.</p>
          </div>
        </section>

        <section>
          <div className="mb-5 px-1"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#e30613]">Latest from the workshop</p><h2 className="ios-section-title mt-1 text-3xl">Owner care feed</h2></div>
          {!posts.length ? (
            <div className="ios-card rounded-[30px] px-6 py-20 text-center"><Video className="mx-auto h-10 w-10 text-[#c7c7cc]" /><h3 className="mt-4 text-lg font-black">New guides are on the way</h3><p className="mt-1 text-sm text-[#6e6e73]">The dealer team will publish the next care video here.</p></div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {posts.map((post) => {
                const embedUrl = getEmbedUrl(post.video_url);
                return (
                  <article key={post.id} className="ios-card overflow-hidden rounded-[30px]">
                    <div className="relative aspect-video overflow-hidden bg-[#1d1d1f]">
                      {embedUrl?.includes("youtube-nocookie.com/embed") ? <iframe src={embedUrl} title={post.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full border-0" /> : embedUrl ? <video controls src={embedUrl} className="h-full w-full object-contain" /> : <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-[#28282b] to-[#111113] px-6 text-center text-white"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10"><Play className="ml-0.5 h-5 w-5" /></span><p className="mt-4 text-sm font-bold">Video update in progress</p><p className="mt-1 max-w-xs text-xs leading-5 text-white/50">The written guide is available below while the verified video is prepared.</p></div>}
                    </div>
                    <div className="p-5 sm:p-7">
                      <div className="flex items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.12em]"><span className="flex items-center gap-1.5 text-[#e30613]"><Wrench className="h-3.5 w-3.5" /> Workshop guide</span><span className="flex items-center gap-1.5 text-[#8e8e93]"><Calendar className="h-3.5 w-3.5" /> {new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></div>
                      <h2 className="mt-4 text-2xl font-black leading-tight tracking-[-0.035em]">{post.title}</h2>
                      {post.caption ? <p className="mt-3 text-sm leading-6 text-[#6e6e73]">{post.caption}</p> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
