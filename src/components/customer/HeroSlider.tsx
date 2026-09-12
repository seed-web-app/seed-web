"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CarFront, ChevronLeft, ChevronRight, ShieldCheck, Wrench } from "lucide-react";

const slides = [
  {
    eyebrow: "Made for Mauritius",
    title: "Everything your Suzuki needs, one request away.",
    description: "Discover genuine parts, check reference pricing, and speak directly with a local parts advisor—without carts or checkout.",
    image: "/brand/coastal-hero.jpg",
    imagePosition: "center",
    primary: { label: "Explore parts", href: "/home#all-parts" },
    secondary: { label: "My garage", href: "/profile#garage" },
    icon: ShieldCheck,
  },
  {
    eyebrow: "Dealer-verified parts",
    title: "Clear condition notes. Confident fitment.",
    description: "Body panels, lighting, brakes, and service parts with transparent primer notes and support from the dealer team.",
    image: "/brand/parts-studio.jpg",
    imagePosition: "center",
    primary: { label: "Browse catalog", href: "/home#all-parts" },
    secondary: { label: "Care guides", href: "/content" },
    icon: Wrench,
  },
  {
    eyebrow: "Your owner network",
    title: "Built around your Suzuki, not a shopping cart.",
    description: "Save your vehicle, find compatible parts, follow requests, and connect with other Suzuki owners in one private space.",
    image: "/brand/vehicle-lineup.jpg",
    imagePosition: "center",
    primary: { label: "View vehicles", href: "/cars" },
    secondary: { label: "Join community", href: "/forum" },
    icon: CarFront,
  },
];

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const next = useCallback(() => setIndex((current) => (current + 1) % slides.length), []);
  const previous = () => setIndex((current) => (current - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(next, 7000);
    return () => window.clearInterval(timer);
  }, [next, paused]);

  const slide = slides[index];
  const Icon = slide.icon;

  return (
    <section
      className="relative overflow-hidden rounded-[30px] bg-[#111113] shadow-[0_24px_70px_rgba(17,17,19,0.16)] sm:rounded-[38px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Suzuki owner network highlights"
    >
      <div className="relative min-h-[500px] sm:min-h-[540px] lg:min-h-[570px]">
        <AnimatePresence mode="wait">
          <motion.div key={slide.image} initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.55, ease: "easeOut" }} className="absolute inset-0">
            <Image
              src={slide.image}
              alt=""
              fill
              preload={index === 0}
              sizes="(max-width: 1440px) 100vw, 1380px"
              className="object-cover"
              style={{ objectPosition: slide.imagePosition }}
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-r from-black/[0.86] via-black/[0.48] to-black/[0.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

        <div className="relative z-10 flex min-h-[500px] max-w-2xl flex-col justify-end px-6 pb-20 pt-12 text-white sm:min-h-[540px] sm:px-10 sm:pb-20 lg:min-h-[570px] lg:px-14">
          <AnimatePresence mode="wait">
            <motion.div key={index} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.45, ease: "easeOut" }}>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur-xl">
                <Icon className="h-3.5 w-3.5" /> {slide.eyebrow}
              </div>
              <h1 className="max-w-xl text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-[3.65rem]">{slide.title}</h1>
              <p className="mt-5 max-w-lg text-sm font-medium leading-6 text-white/78 sm:text-base sm:leading-7">{slide.description}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href={slide.primary.href} className="flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#1d1d1f] shadow-xl transition hover:-translate-y-0.5 hover:bg-[#f5f5f7]">{slide.primary.label}<ArrowRight className="h-4 w-4" /></Link>
                <Link href={slide.secondary.href} className="flex min-h-12 items-center rounded-full border border-white/25 bg-white/10 px-6 text-sm font-bold text-white backdrop-blur-xl transition hover:bg-white/20">{slide.secondary.label}</Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute bottom-6 left-6 right-6 z-20 flex items-center justify-between sm:left-10 sm:right-10 lg:left-14 lg:right-14">
          <div className="flex gap-2" aria-label="Choose slide">
            {slides.map((item, slideIndex) => (
              <button key={item.title} onClick={() => setIndex(slideIndex)} aria-label={`Show slide ${slideIndex + 1}`} aria-current={slideIndex === index} className={`h-1.5 rounded-full transition-all ${slideIndex === index ? "w-9 bg-white" : "w-4 bg-white/35 hover:bg-white/65"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={previous} aria-label="Previous slide" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/15 text-white backdrop-blur-xl transition hover:bg-white hover:text-black"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={next} aria-label="Next slide" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/15 text-white backdrop-blur-xl transition hover:bg-white hover:text-black"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
