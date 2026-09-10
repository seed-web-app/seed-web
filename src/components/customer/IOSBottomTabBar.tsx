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
      aria-label="iOS Mobile Tab Bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#131921]/94 backdrop-blur-2xl border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.25)] select-none"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.5rem)",
      }}
    >
      <div className="grid grid-cols-5 items-center h-14 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
                tab.isActive
                  ? "text-[#ffd814]"
                  : "text-[#999999] hover:text-white"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    tab.isActive ? "stroke-[2.5] scale-110" : "stroke-[1.8]"
                  }`}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#f08804] text-[#111111] font-black text-[10px] flex items-center justify-center animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight ${
                  tab.isActive ? "font-bold text-[#ffd814]" : "font-medium"
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
