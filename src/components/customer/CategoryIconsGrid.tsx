"use client";

import Link from "next/link";
import { Activity, Armchair, ArrowUpRight, Car, Disc3, Wrench, Zap } from "lucide-react";

const categories = [
  { name: "Body panels", detail: "Primer-ready", query: "Body Panels", icon: Car, tone: "bg-[#eaf3ff] text-[#087cf0]" },
  { name: "Engine", detail: "Drive & service", query: "Engine & Drivetrain", icon: Wrench, tone: "bg-[#fff3df] text-[#d46b08]" },
  { name: "Electrical", detail: "Lights & hybrid", query: "Electrical & Lighting", icon: Zap, tone: "bg-[#fff8d8] text-[#a56a00]" },
  { name: "Suspension", detail: "Steering & ride", query: "Suspension & Steering", icon: Activity, tone: "bg-[#e8f8ef] text-[#138a51]" },
  { name: "Brakes", detail: "Wheels & ABS", query: "Brakes & Wheels", icon: Disc3, tone: "bg-[#fff0f1] text-[#e30613]" },
  { name: "Interior", detail: "Cabin accessories", query: "Interior & Accessories", icon: Armchair, tone: "bg-[#f3edff] text-[#7f52c5]" },
];

interface CategoryIconsGridProps {
  activeCategory?: string;
}

export function CategoryIconsGrid({ activeCategory }: CategoryIconsGridProps) {
  return (
    <section aria-labelledby="category-title">
      <div className="mb-4 flex items-end justify-between gap-4 px-1">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#e30613]">Quick access</p>
          <h2 id="category-title" className="ios-section-title text-2xl sm:text-3xl">Find your part</h2>
        </div>
        <Link href="/home#all-parts" className="hidden items-center gap-1 text-xs font-bold text-[#087cf0] sm:flex">View catalog <ArrowUpRight className="h-3.5 w-3.5" /></Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((category) => {
          const Icon = category.icon;
          const active = activeCategory === category.query;
          return (
            <Link
              key={category.name}
              href={`/home?category=${encodeURIComponent(category.query)}`}
              aria-current={active ? "page" : undefined}
              className={`group relative overflow-hidden rounded-[22px] p-4 transition duration-200 hover:-translate-y-1 ${active ? "bg-[#1d1d1f] text-white shadow-xl" : "ios-card text-[#1d1d1f]"}`}
            >
              <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-2xl ${active ? "bg-white/12 text-white" : category.tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-extrabold tracking-[-0.02em]">{category.name}</p>
              <p className={`mt-1 text-[10px] font-semibold ${active ? "text-white/55" : "text-[#8e8e93]"}`}>{category.detail}</p>
              <ArrowUpRight className={`absolute right-4 top-4 h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${active ? "text-white/60" : "text-[#c7c7cc]"}`} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
