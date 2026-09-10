"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X, ShieldCheck } from "lucide-react";

interface PartGalleryProps {
  photos: string[];
  name: string;
}

const PHOTO_LABELS = [
  "1. Component Overview",
  "2. Detail & Finish",
  "3. Mounting & Hardware",
  "4. OEM Packaging & Seal",
];

export function PartGallery({ photos, name }: PartGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  if (!photos || photos.length === 0) {
    return (
      <div className="border border-[#e7e7e7] rounded-2xl p-6 bg-[#fcfcfc] flex items-center justify-center aspect-[4/3]">
        <span className="text-xs text-[#565959]">No photo available</span>
      </div>
    );
  }

  const currentPhoto = photos[selectedIndex] || photos[0];

  const prevPhoto = () => {
    setSelectedIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const nextPhoto = () => {
    setSelectedIndex((prev) => (prev + 1) % photos.length);
  };

  return (
    <div className="space-y-3 lg:sticky lg:top-20 select-none">
      {/* Main Large Photo */}
      <div className="border border-[#e7e7e7] rounded-2xl p-4 bg-white flex items-center justify-center aspect-[4/3] relative overflow-hidden shadow-xs group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentPhoto}
          alt={`${name} - View ${selectedIndex + 1}`}
          className="max-h-full max-w-full object-contain transition-all duration-300 group-hover:scale-105 cursor-zoom-in"
          onClick={() => setIsZoomOpen(true)}
        />

        {/* OEM Authenticity Badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#131921]/90 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
          <ShieldCheck className="w-3 h-3 text-[#2b8a3e]" />
          <span>Genuine Suzuki OEM</span>
        </div>

        {/* Photo Counter Badge */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#d5d9d9] text-[#0f1111] text-[11px] font-bold shadow-xs">
          {selectedIndex + 1} / {photos.length}
        </div>

        {/* Zoom Trigger Button */}
        <button
          type="button"
          onClick={() => setIsZoomOpen(true)}
          className="absolute bottom-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-md border border-[#d5d9d9] text-[#0f1111] hover:bg-white shadow-xs cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
          title="Click to expand high-resolution view"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Next / Prev Navigation Buttons */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevPhoto}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-[#d5d9d9] text-[#0f1111] flex items-center justify-center shadow-md hover:bg-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextPhoto}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-[#d5d9d9] text-[#0f1111] flex items-center justify-center shadow-md hover:bg-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Label of active photo */}
      <div className="text-center text-[11px] font-medium text-[#565959]">
        {PHOTO_LABELS[selectedIndex] || `Angle ${selectedIndex + 1}`}
      </div>

      {/* Thumbnails Row */}
      {photos.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((photo, i) => {
            const isActive = selectedIndex === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedIndex(i)}
                className={`relative aspect-square border-2 rounded-xl p-1 bg-white cursor-pointer transition-all overflow-hidden flex items-center justify-center ${
                  isActive
                    ? "border-[#f08804] ring-2 ring-[#f08804]/30 shadow-xs scale-102"
                    : "border-[#e7e7e7] hover:border-[#888c8c]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={`Thumbnail ${i + 1}`}
                  className="w-full h-full object-contain"
                />
                <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-[#131921]/80 text-white px-1 rounded">
                  {i + 1}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-4xl flex items-center justify-between text-white pb-3 border-b border-white/20">
            <div>
              <h3 className="font-bold text-sm sm:text-base">{name}</h3>
              <p className="text-xs text-[#cccccc]">
                {PHOTO_LABELS[selectedIndex] || `Angle ${selectedIndex + 1}`} • High-Resolution Official EPC Spec
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex-1 w-full max-w-4xl flex items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentPhoto}
              alt={name}
              className="max-h-[75vh] max-w-full object-contain rounded-lg"
            />

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails Strip in Modal */}
          <div className="flex gap-2 pb-2">
            {photos.map((photo, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedIndex(i)}
                className={`w-14 h-14 rounded-lg overflow-hidden border-2 bg-white cursor-pointer ${
                  selectedIndex === i ? "border-[#ffd814]" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="" className="w-full h-full object-contain p-1" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
