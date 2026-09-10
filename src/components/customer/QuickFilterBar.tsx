"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Car, Wrench, Flame, Tag, Check } from "lucide-react";

const POPULAR_MODELS = [
  "All",
  "Swift",
  "Jimny",
  "Vitara",
  "Dzire",
  "Ertiga",
  "Baleno",
  "S-Presso",
];

const POPULAR_CATEGORIES = [
  { label: "All Parts", value: "All", icon: Wrench },
  { label: "⚡ Featured Deals", value: "Offers", icon: Flame },
  { label: "Body Panels", value: "Body Panels", icon: Tag },
  { label: "Engine & Service", value: "Engine & Drivetrain", icon: Sparkles },
  { label: "Brakes & Wheels", value: "Brakes & Wheels", icon: Sparkles },
  { label: "Electrical & Lighting", value: "Electrical & Lighting", icon: Sparkles },
  { label: "Suspension", value: "Suspension & Steering", icon: Sparkles },
];

export function QuickFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentModel = searchParams.get("model") || "All";
  const currentCategory = searchParams.get("category") || "All";
  const currentOffers = searchParams.get("offers") === "true";

  const handleModelChange = (model: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (model === "All") {
      params.delete("model");
    } else {
      params.set("model", model);
    }
    router.push(`/home?${params.toString()}`);
  };

  const handleCategoryChange = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === "Offers") {
      params.set("offers", "true");
      params.delete("category");
    } else if (cat === "All") {
      params.delete("category");
      params.delete("offers");
    } else {
      params.delete("offers");
      params.set("category", cat);
    }
    router.push(`/home?${params.toString()}`);
  };

  return (
    <div className="bg-white border border-[#e7e7e7] rounded-2xl p-3 sm:p-4 shadow-xs space-y-3 select-none">
      {/* 1. Model Selector Strip */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0f1111] flex-shrink-0 mr-1">
          <Car className="w-4 h-4 text-[#febd69]" />
          <span className="hidden sm:inline">Filter by</span> Model:
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto horizontal-scroll py-1 -my-1">
          {POPULAR_MODELS.map((model) => {
            const isActive =
              (model === "All" && currentModel === "All") ||
              currentModel.toLowerCase() === model.toLowerCase();

            return (
              <button
                key={model}
                type="button"
                onClick={() => handleModelChange(model)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                  isActive
                    ? "bg-[#ffd814] text-[#0f1111] border border-[#fcd200] shadow-xs font-bold"
                    : "bg-[#f0f2f2] text-[#0f1111] hover:bg-[#e3e6e6] border border-transparent"
                }`}
              >
                {isActive && <Check className="w-3 h-3 text-[#0f1111]" />}
                <span>{model === "All" ? "All Models" : model}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Fast Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto horizontal-scroll pt-2 border-t border-[#f0f0f0] -mb-1 pb-1">
        {POPULAR_CATEGORIES.map((cat) => {
          const isCatActive =
            cat.value === "Offers"
              ? currentOffers
              : cat.value === "All"
              ? currentCategory === "All" && !currentOffers
              : currentCategory === cat.value;

          return (
            <button
              key={cat.label}
              type="button"
              onClick={() => handleCategoryChange(cat.value)}
              className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                isCatActive
                  ? "bg-[#131921] text-white font-bold shadow-xs"
                  : "bg-white text-[#565959] hover:text-[#0f1111] hover:bg-[#f7f7f7] border border-[#d5d9d9]"
              }`}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
