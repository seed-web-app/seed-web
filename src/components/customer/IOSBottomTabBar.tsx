"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Car, Wrench, MessageSquare, ClipboardList } from "lucide-react";

export function IOSBottomTabBar() {
  const pathname = usePathname();
  const [inquiryCount, setInquiryCount] = useState<number>(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/inquiries");
        if (res.ok) {
          const data = await res.json();
          if (typeof data.count === "number") {
            setInquiryCount(data.count);
          }
        }
      } catch {
        // ignore
      }
    };

    fetchCount();

    const handleUpdate = () => {
      fetchCount();
    };

    window.addEventListener("inquiries-updated", handleUpdate);
    return () => window.removeEventListener("inquiries-updated", handleUpdate);
  }, []);

  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/onboarding")
  ) {
    return null;
  }

  const tabs = [
    {
      label: "Home",
      href: "/home",
      icon: Home,
      isActive: pathname === "/home",
    },
    {
      label: "Cars",
      href: "/cars",
      icon: Car,
      isActive: pathname === "/cars",
    },
    {
      label: "Parts",
      href: "/home#all-parts",
      icon: Wrench,
      isActive: pathname.startsWith("/parts"),
    },
    {
      label: "Forum",
      href: "/forum",
      icon: MessageSquare,
      isActive: pathname === "/forum",
    },
    {
      label: "Inquiries",
      href: "/profile#inquiries",
      icon: ClipboardList,
      badge: inquiryCount > 0 ? inquiryCount : undefined,
      isActive: pathname === "/profile",
    },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-2 left-3 right-3 z-40 rounded-[24px] border border-white/80 bg-white/[0.88] shadow-[0_18px_50px_rgba(17,19,23,0.18)] backdrop-blur-2xl select-none md:hidden"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.35rem)",
      }}
    >
      <div className="grid h-[60px] grid-cols-5 items-center px-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
                tab.isActive
                  ? "text-[#e30613]"
                  : "text-[#71767d] hover:text-[#17191d]"
              }`}
            >
              <div className={`relative flex h-7 min-w-9 items-center justify-center rounded-full transition ${tab.isActive ? "bg-[#fff0f1]" : ""}`}>
                <Icon
                  className={`h-[18px] w-[18px] transition-transform ${
                    tab.isActive ? "stroke-[2.5]" : "stroke-[1.8]"
                  }`}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#e30613] text-white font-black text-[10px] flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`mt-0.5 text-[9px] tracking-tight ${
                  tab.isActive ? "font-bold text-[#e30613]" : "font-medium"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
