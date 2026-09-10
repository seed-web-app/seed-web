"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import type { Part } from "@/lib/types";
import { EnquireButton } from "@/components/customer/EnquireButton";
import { getOptimizedImageUrl } from "@/lib/images";

interface DealOfTheDayProps {
  dealPart?: Part | null;
}

export function DealOfTheDay({ dealPart }: DealOfTheDayProps) {
  // Client-side live countdown timer
  const [timeLeft, setTimeLeft] = useState({
    hours: 5,
    minutes: 42,
    seconds: 19,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!dealPart) return null;

  const originalPrice = Math.round(dealPart.price * 1.2);

  return (
    <div className="amazon-card bg-gradient-to-r from-[#fffbf0] via-white to-white p-4 sm:p-6 border-2 border-[#fbd88e] rounded-lg relative overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left: Deal Info & Live Timer */}
        <div className="space-y-3 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-[#b12704] text-white text-xs font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Deal of the Day
            </span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#131921] text-white text-xs font-mono font-bold">
              <Clock className="w-3.5 h-3.5 text-[#febd69]" />
              <span>
                Ends in {String(timeLeft.hours).padStart(2, "0")}:
                {String(timeLeft.minutes).padStart(2, "0")}:
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
            </div>
            <span className="text-xs font-semibold text-[#007185]">
              Dealership Special • Limited Allocation
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-[#0f1111] leading-tight">
            {dealPart.name}
          </h3>

          <p className="text-xs text-[#565959] leading-relaxed line-clamp-2">
            {dealPart.condition_note ||
              "Genuine Suzuki replacement component. Verified OEM fitment for Mauritius registered models."}
          </p>

          <div className="flex items-baseline gap-3">
            <span className="px-2 py-0.5 rounded bg-[#cc0c39] text-white text-xs font-bold">
              17% OFF Reference
            </span>
            <span className="text-2xl font-black text-[#b12704]">
              Rs {Number(dealPart.price).toLocaleString()}
            </span>
            <span className="text-xs text-[#565959] line-through">
              Rs {originalPrice.toLocaleString()} MUR
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <EnquireButton
              partId={dealPart.id}
              partName={dealPart.name}
              partPrice={Number(dealPart.price)}
              label="Enquire Deal Price"
              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-full btn-amazon-primary text-xs sm:text-sm font-bold text-[#0f1111] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            />

            <Link
              href={`/parts/${dealPart.id}`}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-full bg-[#f0f2f2] hover:bg-[#e3e6e6] border border-[#d5d9d9] text-xs font-semibold text-[#0f1111] transition-all flex items-center justify-center gap-1"
            >
              <span>View Specs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right: Part Photo with Quality Guarantee */}
        <div className="w-full lg:w-72 flex-shrink-0 flex flex-col items-center">
          <Link
            href={`/parts/${dealPart.id}`}
            className="w-full aspect-[4/3] bg-white rounded-lg border border-[#e7e7e7] p-3 flex items-center justify-center hover:border-[#f08804] transition-all"
          >
            {dealPart.photos && dealPart.photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getOptimizedImageUrl(dealPart.photos[0], 500, 80)}
                alt={dealPart.name}
                loading="lazy"
                decoding="async"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-xs text-[#565959]">Deal Part Photo</div>
            )}
          </Link>
          <div className="mt-2 text-[11px] text-[#565959] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2b8a3e]" />
            <span>Authorized Dealership Stock in Phoenix Depot</span>
          </div>
        </div>
      </div>
    </div>
  );
}
