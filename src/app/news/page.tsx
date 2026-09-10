import { redirect } from "next/navigation";
import { getCurrentProfile, getUserVehicles, createSupabaseServerClient } from "@/lib/supabase/server";
import { CustomerNavbar } from "@/components/customer/Navbar";
import type { NewsArticle } from "@/lib/types";
import {
  Calendar,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewsFeedPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const vehicles = await getUserVehicles(profile.id);
  const supabase = await createSupabaseServerClient();

  const { data: rawNews } = supabase
    ? await supabase
        .from("news_articles")
        .select("*")
        .order("published_at", { ascending: false })
    : { data: [] };

  const articles = (rawNews as NewsArticle[]) || [];

  return (
    <div className="min-h-screen bg-[#eaeded] flex flex-col font-sans selection:bg-[#ffd814] selection:text-black">
      <CustomerNavbar profile={profile} vehicleCount={vehicles.length} />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner Header */}
        <div className="amazon-card p-6 sm:p-8 bg-gradient-to-r from-[#131921] to-[#232f3e] text-white">
          <div className="max-w-3xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#febd69] text-[#111111] font-bold text-[10px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Dealership Press & Technical Desk</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Suzuki Mauritius News, Policies & EV/Hybrid Technology
            </h1>
            <p className="text-xs sm:text-sm text-[#cccccc] leading-relaxed">
              Stay updated with the latest Suzuki Motors regulatory announcements, Mauritius carbon duty exemptions, upcoming eVX electric SUV timelines, and technical vehicle maintenance advisories.
            </p>
          </div>
        </div>

        {/* Articles List */}
        <div className="space-y-5">
          {articles.map((article) => (
            <article
              key={article.id}
              className="amazon-card bg-white p-5 sm:p-6 flex flex-col md:flex-row gap-6 items-start"
            >
              {/* Thumbnail */}
              <div className="w-full md:w-72 aspect-[16/10] bg-[#f7f7f7] rounded-lg overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content Body */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="px-2 py-0.5 rounded bg-[#fff8e7] border border-[#fbd88e] text-[#b12704] font-bold text-[10px] uppercase tracking-wider">
                    {article.category}
                  </span>
                  <div className="flex items-center gap-1 text-[#565959] text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-[#565959]" />
                    <span>{new Date(article.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-[#0f1111] leading-snug">
                  {article.title}
                </h2>

                <p className="text-xs sm:text-sm font-semibold text-[#565959] leading-relaxed">
                  {article.summary}
                </p>

                <p className="text-xs text-[#0f1111] leading-relaxed pt-2 border-t border-[#f0f0f0]">
                  {article.content}
                </p>

                <div className="pt-2 flex items-center justify-between text-[11px] text-[#565959]">
                  <span className="flex items-center gap-1 text-[#2b8a3e] font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified Suzuki Mauritius Advisory</span>
                  </span>
                  <span>Published for Registered Owners</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
