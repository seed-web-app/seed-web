"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Check, Loader2 } from "lucide-react";

interface EnquireButtonProps {
  partId: string;
  partName?: string;
  partPrice?: number;
  className?: string;
  label?: string;
  redirectToPortal?: boolean;
  showIcon?: boolean;
}

export function EnquireButton({
  partId,
  partName,
  partPrice,
  className = "",
  label = "Enquire",
  redirectToPortal = false,
  showIcon = true,
}: EnquireButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const handleEnquire = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;
    setLoading(true);

    try {
      // 1. Call the API to save inquiry in DB or guest cookie
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partId, partName, partPrice }),
      });

      if (res.ok) {
        setAdded(true);
        // Dispatch event so Navbar, BottomBar, and Toast immediately update
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("inquiries-updated", {
              detail: { partId, partName, partPrice },
            })
          );
        }

        if (redirectToPortal) {
          router.push(`/profile?added=${encodeURIComponent(partId)}#inquiries`);
          return;
        }

        // Keep added status displayed for 3 seconds then revert to neutral active state
        setTimeout(() => setAdded(false), 3500);
      } else {
        if (redirectToPortal) {
          router.push(`/profile?added=${encodeURIComponent(partId)}#inquiries`);
        }
      }
    } catch (err) {
      console.error("Enquiry error:", err);
      if (redirectToPortal) {
        router.push(`/profile?added=${encodeURIComponent(partId)}#inquiries`);
      }
    } finally {
      setLoading(false);
    }
  };

  const defaultClasses =
    "py-1.5 px-3 rounded-full btn-amazon-primary text-[11px] font-bold text-[#0f1111] flex items-center justify-center gap-1.5 shadow-xs cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all";

  return (
    <button
      type="button"
      onClick={handleEnquire}
      disabled={loading}
      className={
        added
          ? "py-1.5 px-3 rounded-full bg-[#e6f4ea] text-[#137333] border border-[#ceead6] text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all scale-[1.02]"
          : className || defaultClasses
      }
      title={`Add ${partName || "part"} to your dealership quotation inquiry portal`}
    >
      {loading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Adding...</span>
        </>
      ) : added ? (
        <>
          <Check className="w-3.5 h-3.5 text-[#137333]" />
          <span>Added ✓</span>
        </>
      ) : (
        <>
          {showIcon && <Send className="w-3 h-3" />}
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
