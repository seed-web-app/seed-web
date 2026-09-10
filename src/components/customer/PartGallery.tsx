"use client";

import { useState } from "react";

interface PartGalleryProps {
  photos: string[];
  name: string;
}

export function PartGallery({ photos, name }: PartGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState(photos[0] || "");

  if (!photos || photos.length === 0) {
    return (
      <div className="border border-[#e7e7e7] rounded-lg p-6 bg-[#fcfcfc] flex items-center justify-center aspect-[4/3]">
        <span className="text-xs text-[#565959]">No photo available</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 sticky top-20">
      {/* Main Large Photo */}
      <div className="border border-[#e7e7e7] rounded-lg p-4 bg-white flex items-center justify-center aspect-[4/3] relative overflow-hidden shadow-xs">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={selectedPhoto || photos[0]}
          alt={name}
          className="max-h-full max-w-full object-contain transition-all duration-200 hover:scale-105"
        />
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#131921] text-white text-[10px] font-bold">
          Genuine OEM
        </div>
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, i) => {
            const isActive = selectedPhoto === photo;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedPhoto(photo)}
                className={`w-16 h-16 border rounded p-1 bg-white cursor-pointer transition-all flex-shrink-0 ${
                  isActive
                    ? "border-[#f08804] ring-2 ring-[#f08804]/40 shadow-xs"
                    : "border-[#d5d9d9] hover:border-[#888c8c]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={`Thumbnail ${i + 1}`}
                  className="w-full h-full object-contain"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
