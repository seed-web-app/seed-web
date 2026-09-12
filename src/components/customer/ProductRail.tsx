"use client";

import Link from "next/link";
import { useRef } from "react";
import { AlertTriangle, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
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
  const rail = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    rail.current?.scrollBy({ left: direction === "left" ? -560 : 560, behavior: "smooth" });
  };

  if (!parts.length) return null;

  return (
    <section className="relative" aria-label={title}>
      <div className="mb-4 flex items-end justify-between gap-4 px-1">
        <div>
          <h2 className="ios-section-title text-2xl sm:text-3xl">{title}</h2>
          {subtitle ? <p className="mt-1 max-w-2xl text-xs leading-5 text-[#6e6e73] sm:text-sm">{subtitle}</p> : null}
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          {viewAllLink ? <Link href={viewAllLink} className="mr-2 flex items-center gap-1 text-xs font-bold text-[#087cf0]">See all <ArrowRight className="h-3.5 w-3.5" /></Link> : null}
          <button type="button" onClick={() => scroll("left")} aria-label={`Scroll ${title} left`} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1d1d1f] shadow-sm ring-1 ring-black/[0.07] transition hover:bg-[#1d1d1f] hover:text-white"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" onClick={() => scroll("right")} aria-label={`Scroll ${title} right`} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1d1d1f] shadow-sm ring-1 ring-black/[0.07] transition hover:bg-[#1d1d1f] hover:text-white"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      <div ref={rail} className="horizontal-scroll -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-1">
        {parts.map((part) => {
          const bodyPanel = part.category === "Body Panels";
          return (
            <article key={part.id} className="ios-card flex w-[78vw] max-w-[290px] flex-none snap-start flex-col overflow-hidden rounded-[26px] transition duration-200 hover:-translate-y-1">
              <Link href={`/parts/${part.id}`} className="group relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-white to-[#f1f1f3] p-5">
                {part.photos?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getOptimizedImageUrl(part.photos[0], 480, 80)} alt={part.name} loading="lazy" decoding="async" className="h-full w-full object-contain transition duration-500 group-hover:scale-105" />
                ) : <span className="text-xs font-semibold text-[#8e8e93]">Photo coming soon</span>}
                <div className="absolute left-3 top-3 flex gap-1.5">
                  <span className="rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-bold text-[#1d1d1f] shadow-sm backdrop-blur">{part.status === "available" ? "Available" : part.status}</span>
                  {part.is_offer ? <span className="rounded-full bg-[#e30613] px-2.5 py-1 text-[9px] font-bold text-white shadow-sm">Offer</span> : null}
                </div>
              </Link>

              <div className="flex flex-1 flex-col p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.11em] text-[#8e8e93]">{part.category}</p>
                <Link href={`/parts/${part.id}`} className="mt-1.5 line-clamp-2 text-[15px] font-extrabold leading-5 tracking-[-0.02em] text-[#1d1d1f] hover:text-[#e30613]">{part.name}</Link>
                <p className="mt-1 text-[10px] font-medium text-[#8e8e93]">{part.part_number ? `OEM ${part.part_number}` : "Fitment verified on request"}</p>
                {bodyPanel ? <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-[#fff6e8] px-2.5 py-2 text-[10px] font-semibold text-[#a45c08]"><AlertTriangle className="h-3.5 w-3.5" /> Factory gray primer</p> : null}

                <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                  <div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#8e8e93]">Reference</p><p className="mt-0.5 text-lg font-black tracking-[-0.035em] text-[#1d1d1f]">Rs {Number(part.price || 0).toLocaleString()}</p></div>
                  <EnquireButton partId={part.id} partName={part.name} partPrice={Number(part.price || 0)} label="Request" className="flex min-h-10 items-center justify-center rounded-full bg-[#e30613] px-4 text-xs font-bold text-white shadow-[0_7px_18px_rgba(227,6,19,0.18)] transition hover:bg-[#c90010]" />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
