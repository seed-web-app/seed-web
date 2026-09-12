"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/auth/actions";
import type { Part, Profile } from "@/lib/types";
import { PART_CATEGORIES } from "@/lib/types";
import { getOptimizedImageUrl } from "@/lib/images";
import {
  Car,
  ChevronRight,
  CircleUserRound,
  Gauge,
  Inbox,
  Loader2,
  LogOut,
  Menu,
  MessageCircle,
  Newspaper,
  Search,
  ShieldCheck,
  Video,
  Wrench,
  X,
} from "lucide-react";

interface CustomerNavbarProps {
  profile: Profile | null;
  vehicleCount?: number;
  inquiryCount?: number;
}

const primaryLinks = [
  { label: "Discover", href: "/home" },
  { label: "Vehicles", href: "/cars" },
  { label: "Care", href: "/content" },
  { label: "Stories", href: "/news" },
  { label: "Community", href: "/forum" },
];

const drawerLinks = [
  { label: "Your overview", href: "/home", icon: Gauge },
  { label: "Vehicle garage", href: "/profile#garage", icon: Car },
  { label: "Part requests", href: "/profile#inquiries", icon: Inbox },
  { label: "Care videos", href: "/content", icon: Video },
  { label: "Owner community", href: "/forum", icon: MessageCircle },
  { label: "News & stories", href: "/news", icon: Newspaper },
];

export function CustomerNavbar({
  profile,
  vehicleCount = 0,
  inquiryCount = 0,
}: CustomerNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [clientInquiryCount, setClientInquiryCount] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<Part[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  const currentInquiryCount = clientInquiryCount ?? inquiryCount;
  const firstName = profile
    ? profile.full_name?.split(" ")[0] || profile.email?.split("@")[0] || "Driver"
    : null;

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch("/api/inquiries");
        if (!response.ok) return;
        const data = await response.json();
        if (typeof data.count === "number") setClientInquiryCount(data.count);
      } catch {
        // Keep the server-rendered count if a refresh is unavailable.
      }
    };

    fetchCount();
    window.addEventListener("inquiries-updated", fetchCount);
    return () => window.removeEventListener("inquiries-updated", fetchCount);
  }, []);

  useEffect(() => {
    const trimmed = searchTerm.trim();
    const timer = window.setTimeout(async () => {
      if (!trimmed) {
        setSuggestions([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const params = new URLSearchParams({ q: trimmed });
        if (selectedCategory !== "All") params.set("category", selectedCategory);
        const response = await fetch(`/api/parts/search?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.parts || []);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, trimmed ? 180 : 0);

    return () => window.clearTimeout(timer);
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!desktopSearchRef.current?.contains(target) && !mobileSearchRef.current?.contains(target)) {
        setShowSuggestions(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowSuggestions(false);
        setIsDrawerOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setShowSuggestions(false);
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (selectedCategory !== "All") params.set("category", selectedCategory);
    router.push(`/home${params.size ? `?${params.toString()}` : ""}`);
  };

  const searchForm = (mobile = false) => (
    <div ref={mobile ? mobileSearchRef : desktopSearchRef} className={mobile ? "relative w-full" : "relative hidden min-w-0 flex-1 lg:block"}>
      <form onSubmit={submitSearch} role="search" className="ios-field flex h-11 items-center overflow-hidden rounded-2xl">
        <Search className="ml-3.5 h-4 w-4 flex-none text-[#8e8e93]" />
        <input
          type="search"
          value={searchTerm}
          onFocus={() => setShowSuggestions(true)}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setShowSuggestions(true);
          }}
          placeholder="Search parts, models or OEM numbers"
          aria-label="Search Suzuki parts"
          className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm text-[#1d1d1f] outline-none placeholder:text-[#8e8e93]"
        />
        {!mobile ? (
          <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} aria-label="Part category" className="hidden h-7 max-w-36 border-l border-black/[0.08] bg-transparent px-3 text-[11px] font-semibold text-[#6e6e73] outline-none xl:block">
            <option value="All">All categories</option>
            {PART_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        ) : null}
        <button type="submit" aria-label="Submit search" className="mr-1.5 flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-[#1d1d1f] text-white transition hover:bg-[#e30613]">
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </form>

      {showSuggestions && searchTerm.trim() ? (
        <div className="ios-card absolute left-0 right-0 top-full z-[70] mt-2 overflow-hidden rounded-[22px] p-2 text-[#1d1d1f] shadow-2xl">
          <div className="flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-[0.13em] text-[#8e8e93]">
            <span>Suggested matches</span><span>{suggestions.length}</span>
          </div>
          {suggestions.length ? (
            <div className="max-h-80 overflow-y-auto">
              {suggestions.slice(0, 7).map((part) => (
                <Link key={part.id} href={`/parts/${part.id}`} onClick={() => setShowSuggestions(false)} className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-[#f5f5f7]">
                  <span className="flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-black/[0.06]">
                    {part.photos?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getOptimizedImageUrl(part.photos[0], 88, 75)} alt="" className="h-full w-full object-contain p-1" />
                    ) : <Wrench className="h-4 w-4 text-[#8e8e93]" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold group-hover:text-[#e30613]">{part.name}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-[#8e8e93]">{part.category}{part.part_number ? ` · ${part.part_number}` : ""}</span>
                  </span>
                  <span className="text-xs font-extrabold">Rs {Number(part.price || 0).toLocaleString()}</span>
                </Link>
              ))}
              <button type="button" onClick={submitSearch} className="mt-1 w-full rounded-2xl px-3 py-2.5 text-center text-xs font-bold text-[#087cf0] hover:bg-[#f5f5f7]">View all results</button>
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-xs text-[#6e6e73]">{isSearching ? "Searching the catalog…" : "No matching parts found."}</div>
          )}
        </div>
      ) : null}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/[0.07] bg-white/[0.84] text-[#1d1d1f] shadow-[0_1px_0_rgba(0,0,0,0.02)] backdrop-blur-2xl">
      <div className="mx-auto flex h-[68px] max-w-[1380px] items-center gap-3 px-3 sm:px-5 lg:gap-5">
        <button type="button" onClick={() => setIsDrawerOpen(true)} aria-label="Open navigation" aria-controls="customer-navigation-drawer" aria-expanded={isDrawerOpen} className="flex h-10 w-10 items-center justify-center rounded-2xl text-[#1d1d1f] transition hover:bg-black/[0.05] xl:hidden">
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/home" className="group flex flex-none items-center gap-2.5" aria-label="Suzuki Mauritius home">
          <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#e30613] text-lg font-black text-white shadow-[0_7px_18px_rgba(227,6,19,0.2)] transition group-hover:-rotate-2">S</span>
          <span className="hidden sm:block">
            <span className="block text-[15px] font-black leading-none tracking-[-0.03em]">Suzuki Mauritius</span>
            <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.16em] text-[#8e8e93]">Owner network</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary navigation">
          {primaryLinks.map((item) => {
            const active = pathname === item.href || (item.href === "/home" && pathname.startsWith("/parts"));
            return <Link key={item.href} href={item.href} className={`rounded-full px-3 py-2 text-xs font-semibold transition ${active ? "bg-[#1d1d1f] text-white" : "text-[#6e6e73] hover:bg-black/[0.045] hover:text-[#1d1d1f]"}`}>{item.label}</Link>;
          })}
        </nav>

        {searchForm()}

        <div className="ml-auto flex flex-none items-center gap-1 sm:gap-2">
          {profile?.role === "admin" ? (
            <Link href="/admin" className="hidden h-10 items-center gap-1.5 rounded-full bg-[#fff1f2] px-3 text-xs font-bold text-[#c90010] sm:flex"><ShieldCheck className="h-4 w-4" /> Admin</Link>
          ) : null}
          <Link href="/profile#inquiries" aria-label={`${currentInquiryCount} part requests`} className="relative flex h-10 w-10 items-center justify-center rounded-2xl transition hover:bg-black/[0.05]">
            <Inbox className="h-[19px] w-[19px]" />
            {currentInquiryCount > 0 ? <span className="absolute right-0.5 top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#e30613] px-1 text-[9px] font-black text-white">{currentInquiryCount}</span> : null}
          </Link>
          <Link href="/profile" className="flex h-10 items-center gap-2 rounded-full bg-[#f2f2f4] pl-1 pr-2.5 transition hover:bg-[#e9e9ec]" aria-label="Open profile and garage">
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white text-xs font-black ring-1 ring-black/[0.06]">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : <CircleUserRound className="h-4 w-4 text-[#6e6e73]" />}
            </span>
            <span className="hidden max-w-24 truncate text-[11px] font-bold sm:block">{firstName || "Sign in"}</span>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1380px] px-3 pb-3 lg:hidden">{searchForm(true)}</div>

      {isDrawerOpen ? (
        <div className="fixed inset-0 z-[100] flex" role="presentation">
          <button className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} aria-label="Close navigation" />
          <aside id="customer-navigation-drawer" role="dialog" aria-modal="true" aria-label="Navigation" className="relative m-2 flex h-[calc(100%-1rem)] w-[min(90vw,380px)] flex-col overflow-hidden rounded-[30px] bg-[#f5f5f7] shadow-2xl">
            <div className="flex items-center justify-between bg-white px-5 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e30613] text-xl font-black text-white">S</span>
                <div><p className="text-sm font-black">Hello, {firstName || "Suzuki driver"}</p><p className="mt-0.5 text-[10px] font-semibold text-[#8e8e93]">{vehicleCount} vehicles · {currentInquiryCount} requests</p></div>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} aria-label="Close navigation" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f2f4]"><X className="h-4 w-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <div className="rounded-[24px] bg-white p-2 ring-1 ring-black/[0.05]">
                {drawerLinks.map((item) => {
                  const Icon = item.icon;
                  return <Link key={item.label} href={item.href} onClick={() => setIsDrawerOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition hover:bg-[#f5f5f7]"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f2f4] text-[#e30613]"><Icon className="h-4 w-4" /></span><span className="flex-1">{item.label}</span><ChevronRight className="h-4 w-4 text-[#c7c7cc]" /></Link>;
                })}
              </div>

              <p className="px-3 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8e8e93]">Browse parts</p>
              <div className="rounded-[24px] bg-white p-2 ring-1 ring-black/[0.05]">
                {PART_CATEGORIES.map((category) => <Link key={category} href={`/home?category=${encodeURIComponent(category)}`} onClick={() => setIsDrawerOpen(false)} className="flex items-center justify-between rounded-2xl px-3 py-2.5 text-xs font-semibold hover:bg-[#f5f5f7]"><span>{category}</span><ChevronRight className="h-3.5 w-3.5 text-[#c7c7cc]" /></Link>)}
              </div>
            </div>

            {profile ? (
              <form action={signOut} className="border-t border-black/[0.06] bg-white p-4"><button type="submit" className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#f2f2f4] text-xs font-bold hover:bg-[#e9e9ec]"><LogOut className="h-4 w-4" /> Sign out</button></form>
            ) : null}
          </aside>
        </div>
      ) : null}
    </header>
  );
}
