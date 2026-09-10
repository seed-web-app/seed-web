"use client";

import { MessageSquare } from "lucide-react";
import { usePathname } from "next/navigation";

export function FloatingWhatsAppDesk() {
  const pathname = usePathname();
  const whatsappNumber = "2305550199";
  const defaultMessage = encodeURIComponent(
    "Hello Suzuki Mauritius, I am enquiring from suzuki.mu customer network about genuine parts availability."
  );

  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/onboarding")
  ) {
    return null;
  }

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-4 md:left-auto md:right-6 z-40 flex items-center gap-2 select-none"
      aria-label="Direct Dealership Contact"
    >
      <a
        href={`https://wa.me/${whatsappNumber}?text=${defaultMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 group border border-white/20"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
        </span>

        <MessageSquare className="w-4 h-4 fill-white" />
        <span className="hidden sm:inline">Phoenix Parts Desk</span>
        <span className="sm:hidden">WhatsApp</span>
      </a>
    </div>
  );
}
