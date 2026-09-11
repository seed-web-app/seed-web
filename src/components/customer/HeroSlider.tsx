"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { getOptimizedImageUrl } from "@/lib/images";

interface Slide {
  id: number;
  title: string;
  badge: string;
  subtitle: string;
  imageUrl: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
}

const slides: Slide[] = [
  {
    id: 1,
    badge: "Official Dealership Inventory • Mauritius",
    title: "Genuine Suzuki Spare Parts & Service Components",
    subtitle: "Direct authorized inventory. Upgrade or maintain your Suzuki with authentic water pumps, flywheels, cylinder heads, starter motors, and body panels.",
    imageUrl: "/suzuki-parts/imgi_104_banner3-2.jpg",
    primaryCtaText: "Browse Spare Parts",
    primaryCtaLink: "/home#all-parts",
    secondaryCtaText: "Explore Models",
    secondaryCtaLink: "/cars",
  },
  {
    id: 2,
    badge: "Official Workshop Engineering",
    title: "Boosterjet & Dualjet Engine Assemblies & Kits",
    subtitle: "Precision forged crankshafts, MLS head gaskets, intercooler pumps, and heavy-duty timing belts engineered for tropical reliability.",
    imageUrl: "/suzuki-parts/imgi_2_engine-1-v2.png",
    primaryCtaText: "Browse Engine Parts",
    primaryCtaLink: "/home?category=Engine+%26+Drivetrain",
    secondaryCtaText: "Read Maintenance Guide",
    secondaryCtaLink: "/news",
  },
  {
    id: 3,
    badge: "Dealership Direct Quality",
    title: "Authorized Suzuki Genuine Spares Warehouse",
    subtitle: "Rapid fulfillment from Phoenix Central Depot & Port Louis Harbour. Verified chassis fitment with direct WhatsApp inquiry desk.",
    imageUrl: "/suzuki-parts/imgi_40_KM-Home-05-Filler-Image-02.png",
    primaryCtaText: "View Genuine Parts",
    primaryCtaLink: "/home",
    secondaryCtaText: "Read Government Policy",
    secondaryCtaLink: "/news",
  },
  {
    id: 4,
    badge: "Dealership Direct Network",
    title: "Direct Offline Quotation via WhatsApp or Phone",
    subtitle: "No online checkout hassle. Inquire about any part and our certified Suzuki specialists in Phoenix & Port Louis will verify VIN fitment directly.",
    imageUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1800&q=80",
    primaryCtaText: "Manage My Garage",
    primaryCtaLink: "/profile",
    secondaryCtaText: "Join Owner Forum",
    secondaryCtaLink: "/forum",
  },
];

export function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  const current = slides[currentIndex];

  return (
    <div
      className="relative w-full overflow-hidden rounded-b-lg shadow-sm select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image Container */}
      <div className="relative h-[280px] sm:h-[360px] md:h-[420px] lg:h-[460px] w-full bg-[#131921]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getOptimizedImageUrl(current.imageUrl, 1200, 75)}
          alt={current.title}
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 opacity-80"
        />

        {/* Gradient Overlay for Amazon Content Blend */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#131921] via-[#131921]/75 to-transparent sm:w-2/3" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#f5f6f7] via-[#f5f6f7]/50 to-transparent" />

        {/* Content Box */}
        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-8 flex flex-col justify-center max-w-2xl text-white pb-12 sm:pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 text-[#17191d] text-[11px] font-extrabold uppercase tracking-wider mb-3 shadow-sm w-fit backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#e30613]" />
            <span>{current.badge}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-md">
            {current.title}
          </h1>

          <p className="mt-2.5 text-xs sm:text-sm text-[#e3e6e6] leading-relaxed line-clamp-3 drop-shadow">
            {current.subtitle}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={current.primaryCtaLink}
              className="px-6 py-2.5 rounded-full btn-amazon-primary text-xs sm:text-sm font-bold text-[#0f1111] shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
            >
              <span>{current.primaryCtaText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href={current.secondaryCtaLink}
              className="px-5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 text-xs sm:text-sm font-semibold text-white transition-all flex items-center gap-1.5"
            >
              <span>{current.secondaryCtaText}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Prev Navigation Arrow */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Previous Slide"
        className="absolute left-2 sm:left-4 top-1/3 -translate-y-1/2 w-10 h-16 sm:w-11 sm:h-20 bg-black/30 hover:bg-black/60 text-white flex items-center justify-center rounded-r transition-all z-20 backdrop-blur-xs cursor-pointer"
      >
        <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
      </button>

      {/* Next Navigation Arrow */}
      <button
        type="button"
        onClick={nextSlide}
        aria-label="Next Slide"
        className="absolute right-2 sm:right-4 top-1/3 -translate-y-1/2 w-10 h-16 sm:w-11 sm:h-20 bg-black/30 hover:bg-black/60 text-white flex items-center justify-center rounded-l transition-all z-20 backdrop-blur-xs cursor-pointer"
      >
        <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
      </button>

      {/* Slide Indicators Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`transition-all rounded-full cursor-pointer ${
              currentIndex === i
                ? "w-8 h-2.5 bg-[#e30613]"
                : "w-2.5 h-2.5 bg-white/60 hover:bg-white"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
