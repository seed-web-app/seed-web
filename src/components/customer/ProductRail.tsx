"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, AlertTriangle } from "lucide-react";
import type { Part } from "@/lib/types";
import { EnquireButton } from "@/components/customer/EnquireButton";
import { getOptimizedImageUrl } from "@/lib/images";

interface ProductRailProps {
  title: string;
  subtitle?: string;
  parts: Part[];
  viewAllLink?: string;
}

export function ProductRail({ title, subtitle, parts, viewAllLink }: ProductRailProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === "left" ? -400 : 400;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  if (!parts || parts.length === 0) return null;

  return (
    <div className="amazon-card bg-white p-4 sm:p-5 relative group">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#0f1111] leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-[#565959] mt-0.5">{subtitle}</p>
          )}
        </div>

        {viewAllLink && (
          <Link
            href={viewAllLink}
            className="text-xs font-semibold text-[#007185] hover:text-[#c7511f] hover:underline flex-shrink-0"
          >
            See all ({parts.length}) →
          </Link>
        )}
      </div>

      {/* Left Scroll Button */}
      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="Scroll left"
        className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-9 h-16 bg-white/90 hover:bg-white text-[#0f1111] border border-[#d5d9d9] shadow-md flex items-center justify-center rounded-r opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Right Scroll Button */}
      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="Scroll right"
        className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-9 h-16 bg-white/90 hover:bg-white text-[#0f1111] border border-[#d5d9d9] shadow-md flex items-center justify-center rounded-l opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto horizontal-scroll scroll-smooth py-2 px-1"
      >
        {parts.map((part) => {
          const isBodyPanel = part.category === "Body Panels";

          return (
            <div
              key={part.id}
              className="flex-shrink-0 w-60 sm:w-64 border border-[#e7e7e7] rounded-lg p-3 bg-white hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Photo with Prime/Stock Badge */}
                <Link
                  href={`/parts/${part.id}`}
                  className="block relative aspect-[4/3] bg-[#f7f7f7] rounded-md overflow-hidden mb-2.5 p-2 flex items-center justify-center"
                >
                  {part.photos && part.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getOptimizedImageUrl(part.photos[0], 360, 75)}
                      alt={part.name}
                      loading="lazy"
                      decoding="async"
                      className="max-h-full max-w-full object-contain transition-transform hover:scale-105 duration-300"
                    />
                  ) : (
                    <div className="text-xs text-[#565959]">OEM Part Photo</div>
                  )}

                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-[#007185] text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                      Authorized
                    </span>
                    {part.is_offer && (
                      <span className="px-1.5 py-0.5 rounded bg-[#b12704] text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                        Featured Offer
                      </span>
                    )}
                  </div>
                </Link>

                {/* Rating Stars */}
                <div className="flex items-center gap-1 mb-1">
                  <div className="flex text-[#ffa41c]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                  <span className="text-[11px] text-[#007185] font-medium">4.8 (24)</span>
                </div>

                {/* Title */}
                <Link
                  href={`/parts/${part.id}`}
                  className="text-xs font-bold text-[#0f1111] hover:text-[#c7511f] line-clamp-2 leading-snug mb-1"
                >
                  {part.name}
                </Link>

                {/* OEM Code & Compatible Models */}
                <p className="text-[10px] font-mono text-[#565959] truncate mb-1">
                  {part.part_number ? `OEM #${part.part_number}` : "OEM Spec Verified"}
                </p>

                {/* Primer condition note for body parts */}
                {isBodyPanel && (
                  <div className="flex items-center gap-1 text-[10px] text-[#c7511f] bg-[#fff8e7] px-1.5 py-0.5 rounded mb-2 border border-[#fbd88e]">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">Factory gray primer</span>
                  </div>
                )}
              </div>

              {/* Price & Action */}
              <div className="pt-2 border-t border-[#f0f0f0] mt-2">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-xs text-[#565959]">Ref:</span>
                  <span className="text-base font-extrabold text-[#b12704]">
                    Rs {Number(part.price || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#565959]">MUR</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <EnquireButton
                    partId={part.id}
                    partName={part.name}
                    partPrice={Number(part.price || 0)}
                    label="Enquire"
                    className="py-1.5 px-2 rounded-full btn-amazon-primary text-[11px] font-bold text-[#0f1111] text-center shadow-xs hover:shadow transition-all flex items-center justify-center gap-1 cursor-pointer"
                  />

                  <Link
                    href={`/parts/${part.id}`}
                    className="py-1.5 px-2 rounded-full bg-[#f0f2f2] hover:bg-[#e3e6e6] border border-[#d5d9d9] text-[11px] font-semibold text-[#0f1111] text-center transition-all"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
