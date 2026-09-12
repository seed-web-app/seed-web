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
  { label: "Offers", value: "Offers", icon: Flame },
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
    router.push(`/home${params.size ? `?${params.toString()}` : ""}#all-parts`);
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
    router.push(`/home${params.size ? `?${params.toString()}` : ""}#all-parts`);
  };

  return (
    <div className="ios-card space-y-3 rounded-[24px] p-3 select-none sm:p-4">
      {/* 1. Model Selector Strip */}
      <div className="flex items-center gap-2">
        <div className="mr-1 flex flex-shrink-0 items-center gap-1.5 text-xs font-bold text-[#1d1d1f]">
          <Car className="h-4 w-4 text-[#e30613]" />
          <span className="hidden sm:inline">Your</span> model
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
                className={`flex min-h-8 cursor-pointer items-center gap-1 whitespace-nowrap rounded-full px-3 text-[11px] font-semibold transition-all active:scale-95 ${
                  isActive
                    ? "bg-[#e30613] text-white shadow-[0_6px_14px_rgba(227,6,19,0.16)] font-bold"
                    : "bg-[#f2f2f4] text-[#6e6e73] hover:bg-[#e9e9ec] hover:text-[#1d1d1f]"
                }`}
              >
                {isActive && <Check className="w-3 h-3 text-white" />}
                <span>{model === "All" ? "All Models" : model}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Fast Category Pills */}
      <div className="horizontal-scroll -mb-1 flex items-center gap-1.5 overflow-x-auto border-t border-black/[0.06] pb-1 pt-3">
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
              className={`flex min-h-8 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[11px] transition-all active:scale-95 ${
                isCatActive
                  ? "bg-[#1d1d1f] text-white font-bold shadow-sm"
                  : "bg-white text-[#6e6e73] hover:text-[#1d1d1f] border border-black/[0.07]"
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
