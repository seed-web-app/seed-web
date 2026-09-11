"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

interface InquiryRowActionsProps {
  inquiryId: string;
  partId: string;
}

export function InquiryRowActions({ inquiryId, partId }: InquiryRowActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleRemove = async () => {
    if (!confirm("Remove this part request from your account?")) return;
    setLoading(true);
    setFailed(false);

    try {
      const response = await fetch("/api/inquiries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiryId, partId }),
      });

      if (!response.ok) {
        setFailed(true);
        return;
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("inquiries-updated"));
      }

      router.refresh();
    } catch (err) {
      console.error("Failed to remove inquiry:", err);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={loading}
      className="text-[11px] text-[#888c8c] hover:text-[#b12704] flex items-center gap-1 font-semibold cursor-pointer transition-colors p-1"
      title="Remove part request"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Trash2 className="w-3 h-3" />
      )}
      <span>{failed ? "Try again" : "Remove"}</span>
    </button>
  );
}
