import { getCurrentProfile, getUserVehicles, createSupabaseServerClient } from "@/lib/supabase/server";
import { CustomerNavbar } from "@/components/customer/Navbar";
import { NewsArticleModal } from "@/components/customer/NewsArticleModal";
import type { NewsArticle } from "@/lib/types";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewsFeedPage() {
  const profile = await getCurrentProfile();
  const vehicles = profile ? await getUserVehicles(profile.id) : [];
  const supabase = await createSupabaseServerClient();

  const { data: rawNews } = supabase
    ? await supabase
        .from("news_articles")
        .select("*")
        .order("published_at", { ascending: false })
    : { data: [] };

  const articles = (rawNews as NewsArticle[]) || [];

  return (
    <div className="app-canvas min-h-screen flex flex-col font-sans text-[#1d1d1f]">
      <CustomerNavbar profile={profile} vehicleCount={vehicles.length} />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8 space-y-6">
        {/* Banner Header */}
        <div className="amazon-card p-7 sm:p-10 bg-gradient-to-br from-[#1d1d1f] to-[#3a3a3f] text-white rounded-[30px]">
          <div className="max-w-3xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#febd69] text-[#111111] font-bold text-[10px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Dealership Press & Technical Desk</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Suzuki Mauritius News, Policies & EV/Hybrid Technology
            </h1>
            <p className="text-xs sm:text-sm text-[#cccccc] leading-relaxed">
              Stay updated with the latest Suzuki Motors regulatory announcements, Mauritius carbon duty exemptions, upcoming eVX electric SUV timelines, and technical vehicle maintenance advisories. Click any article to open the full technical briefing.
            </p>
          </div>
        </div>

        {/* Interactive Articles Grid with Reader Modal */}
        <NewsArticleModal articles={articles} />
      </main>
    </div>
  );
}
