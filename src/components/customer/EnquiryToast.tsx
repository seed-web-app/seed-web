"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, X, ArrowRight, ClipboardList } from "lucide-react";

interface ToastItem {
  id: string;
  partName?: string;
  partPrice?: number;
}

export function EnquiryToast() {
  const [toast, setToast] = useState<ToastItem | null>(null);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{
        partId?: string;
        partName?: string;
        partPrice?: number;
      }>;
      if (customEvent.detail) {
        setToast({
          id: customEvent.detail.partId || Date.now().toString(),
          partName: customEvent.detail.partName || "Genuine Suzuki Component",
          partPrice: customEvent.detail.partPrice,
        });
      }
    };

    window.addEventListener("inquiries-updated", handleUpdate);
    return () => window.removeEventListener("inquiries-updated", handleUpdate);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <aside
      aria-label="Enquiry Notification"
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-auto bg-[#131921] text-white border border-[#3a4553] rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-5 duration-300 select-none"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#007600]/20 border border-[#007600]/50 flex items-center justify-center flex-shrink-0 mt-0.5">
          <CheckCircle2 className="w-5 h-5 text-[#25d366]" />
        </div>

        <div className="flex-1 min-w-0 pr-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#febd69] block">
            Added to Dealership Enquiry
          </span>
          <p className="text-xs font-bold text-white truncate mt-0.5">
            {toast.partName}
          </p>
          {toast.partPrice !== undefined && toast.partPrice > 0 && (
            <p className="text-[11px] text-[#cccccc] mt-0.5">
              Ref Price:{" "}
              <strong className="text-white">
                Rs {Number(toast.partPrice).toLocaleString()} MUR
              </strong>
            </p>
          )}

          <div className="flex items-center gap-3 mt-2.5">
            <Link
              href="/profile#inquiries"
              onClick={() => setToast(null)}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#111111] bg-[#ffd814] hover:bg-[#f7ca00] px-3 py-1.5 rounded-full transition-all shadow-xs active:scale-95"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>View Portal</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </Link>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-xs text-[#a0a0a0] hover:text-white underline cursor-pointer"
            >
              Keep browsing
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setToast(null)}
          className="text-[#888888] hover:text-white p-1 rounded-md transition-colors cursor-pointer flex-shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
