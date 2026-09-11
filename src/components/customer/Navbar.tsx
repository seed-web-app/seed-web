"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { signOut } from "@/app/auth/actions";
import type { Profile, Part } from "@/lib/types";
import { PART_CATEGORIES } from "@/lib/types";
import { getOptimizedImageUrl } from "@/lib/images";
import {
  MapPin,
  Search,
  Car,
  ShieldCheck,
  LogOut,
  Menu,
  ChevronDown,
  MessageSquare,
  Newspaper,
  Inbox,
  X,
  Wrench,
  Zap,
  Activity,
  Disc3,
  Armchair,
  Sparkles,
  Phone,
  User,
  ChevronRight,
  Loader2,
  Video,
} from "lucide-react";

interface CustomerNavbarProps {
  profile: Profile | null;
  vehicleCount?: number;
  inquiryCount?: number;
}

export function CustomerNavbar({
  profile,
  vehicleCount = 0,
  inquiryCount = 0,
}: CustomerNavbarProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [clientInquiryCount, setClientInquiryCount] = useState<number | null>(null);
  const currentInquiryCount = clientInquiryCount !== null ? clientInquiryCount : inquiryCount;

  const [suggestions, setSuggestions] = useState<Part[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/inquiries");
        if (res.ok) {
          const data = await res.json();
          if (typeof data.count === "number") {
            setClientInquiryCount(data.count);
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

  // Debounced live autocomplete search
  useEffect(() => {
    const trimmed = searchTerm.trim();
    const timer = setTimeout(async () => {
      if (!trimmed) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const params = new URLSearchParams();
        params.set("q", trimmed);
        if (selectedCategory && selectedCategory !== "All") {
          params.set("category", selectedCategory);
        }
        const res = await fetch(`/api/parts/search?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.parts || []);
        }
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, trimmed ? 140 : 0);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory]);

  // Close search suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideDesktop = desktopSearchRef.current?.contains(target);
      const insideMobile = mobileSearchRef.current?.contains(target);
      if (!insideDesktop && !insideMobile) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (selectedCategory && selectedCategory !== "All")
      params.set("category", selectedCategory);
    router.push(`/home?${params.toString()}`);
  };

  const firstName = profile
    ? profile.full_name?.split(" ")[0] || profile.email?.split("@")[0] || "Driver"
    : null;

  const renderSearchForm = (isMobile: boolean) => (
    <div
      ref={isMobile ? mobileSearchRef : desktopSearchRef}
      className={`relative ${isMobile ? "w-full" : "hidden md:block flex-1 max-w-3xl"}`}
    >
      <form
        onSubmit={handleSearch}
        className="flex items-center h-10 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#e30613]/40 shadow-sm"
      >
        {!isMobile && (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-full bg-[#f3f3f3] hover:bg-[#dadada] text-[#555555] text-xs px-2.5 border-r border-[#cdcdcd] focus:outline-none cursor-pointer hidden sm:block"
          >
            <option value="All">All Categories</option>
            {PART_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}

        <input
          type="text"
          value={searchTerm}
          onFocus={() => setShowSuggestions(true)}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSuggestions(true);
          }}
          placeholder={
            isMobile
              ? "Search Suzuki parts, bumpers, Swift..."
              : "Search genuine Suzuki parts, bumpers, Swift, Jimny..."
          }
          className="flex-1 px-3.5 text-[#0f1111] text-xs sm:text-sm focus:outline-none placeholder:text-[#555555]"
        />

        <button
          type="submit"
          aria-label="Search"
          className="h-full px-4 bg-[#e30613] hover:bg-[#c90010] text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          {isSearching ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : (
            <Search className="w-5 h-5 stroke-[2.5]" />
          )}
        </button>
      </form>

      {/* Live Autocomplete Suggestions Dropdown */}
      {showSuggestions && searchTerm.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#d5d9d9] rounded-lg shadow-2xl overflow-hidden z-50 animate-in fade-in duration-150">
          {suggestions.length > 0 ? (
            <div className="py-1 divide-y divide-[#f0f0f0]">
              <div className="px-3 py-1.5 bg-[#f7fafa] flex items-center justify-between text-[11px] text-[#565959] font-medium">
                <span>Suzuki Genuine Catalog Matches</span>
                <span>{suggestions.length} items</span>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {suggestions.map((part) => (
                  <Link
                    key={part.id}
                    href={`/parts/${part.id}`}
                    onClick={() => setShowSuggestions(false)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-[#f3f8f8] transition-colors group"
                  >
                    <div className="w-10 h-10 rounded bg-[#f7f7f7] border border-[#e7e7e7] p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {part.photos && part.photos[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getOptimizedImageUrl(part.photos[0], 80, 75)}
                          alt={part.name}
                          loading="lazy"
                          decoding="async"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <Wrench className="w-4 h-4 text-[#888888]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#0f1111] group-hover:text-[#e30613] truncate">
                        {part.name}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-[#565959] mt-0.5">
                        <span className="px-1.5 py-0.2 bg-[#f0f2f2] rounded text-[#0f1111] font-semibold">
                          {part.category}
                        </span>
                        {part.part_number && (
                          <span className="truncate">OEM: {part.part_number}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold text-[#b12704] block">
                        Rs {Number(part.price || 0).toLocaleString()}
                      </span>
                      <span className="text-[9px] text-[#007600] font-semibold">
                        In Stock
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="p-2 bg-[#fcfcfc] text-center">
                <button
                  type="button"
                  onClick={handleSearch}
                  className="text-xs font-bold text-[#c90010] hover:text-[#e30613] hover:underline cursor-pointer"
                >
                  View all catalog results for &ldquo;{searchTerm}&rdquo; →
                </button>
              </div>
            </div>
          ) : !isSearching ? (
            <div className="p-4 text-center text-xs text-[#565959]">
              No matching parts found for &ldquo;{searchTerm}&rdquo;. Try &ldquo;bumper&rdquo;, &ldquo;Swift&rdquo;, or &ldquo;Jimny&rdquo;.
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-[#565959] flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#e30613]" />
              <span>Searching Suzuki parts catalog...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <header className="w-full text-white font-sans text-xs select-none">
      {/* 1. Main Top Navigation Bar (Amazon Navy #131921) */}
      <div className="bg-[#131921] px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Drawer Trigger + Brand Wordmark */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="md:hidden p-1.5 -ml-1 text-white hover:text-[#ff6872] transition-colors cursor-pointer flex items-center justify-center"
            aria-label="Open Navigation Drawer"
            aria-expanded={isDrawerOpen}
            aria-controls="customer-navigation-drawer"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link
            href="/home"
            className="flex items-center gap-1.5 p-1 hover:outline hover:outline-1 hover:outline-white rounded transition-all"
          >
            <div className="w-8 h-8 rounded bg-suzuki-red flex items-center justify-center font-black text-white text-lg shadow-sm">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white leading-none">
                suzuki<span className="text-[#ff6872]">.mu</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#ff6872] font-bold">
                Mauritius
              </span>
            </div>
          </Link>
        </div>

        {/* Deliver to Mauritius Location Widget (Desktop) */}
        <div className="hidden md:flex items-center gap-1 p-1.5 hover:outline hover:outline-1 hover:outline-white rounded cursor-pointer transition-all flex-shrink-0">
          <MapPin className="w-4 h-4 text-white mt-1" />
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] text-[#cccccc]">Serving</span>
            <span className="font-bold text-white text-xs">Mauritius 🇲🇺</span>
          </div>
        </div>

        {/* Big Amazon Search Bar (Desktop) */}
        {renderSearchForm(false)}

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Admin Switcher */}
          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#e30613] text-white font-bold text-xs hover:bg-[#c90010] transition-colors"
              title="Admin Dashboard"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-suzuki-red" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {/* Account / Sign In */}
          {profile ? (
            <Link
              href="/profile"
              className="flex items-center sm:flex-col leading-tight p-1.5 hover:outline hover:outline-1 hover:outline-white rounded transition-all"
              aria-label="Account & Garage"
            >
              <User className="w-5 h-5 sm:hidden text-white" />
              <div className="hidden sm:flex sm:flex-col">
                <span className="text-[11px] text-[#cccccc]">Hello, {firstName}</span>
                <span className="font-bold text-white text-xs flex items-center gap-0.5">
                  <span>Account & Garage</span>
                  <ChevronDown className="w-3 h-3 text-[#cccccc]" />
                </span>
              </div>
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full btn-amazon-primary text-xs font-bold text-[#0f1111] transition-all shadow-xs"
            >
              Sign In
            </Link>
          )}

          {/* Returns & Inquiries */}
          <Link
            href="/profile#inquiries"
            className="flex items-center sm:flex-col leading-tight p-1.5 hover:outline hover:outline-1 hover:outline-white rounded transition-all relative"
            aria-label="Past Requests & Inquiries"
          >
            <div className="relative sm:hidden">
              <Inbox className="w-5 h-5 text-white" />
              {currentInquiryCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[15px] h-3.5 px-0.5 rounded-full bg-[#e30613] text-white font-black text-[9px] flex items-center justify-center">
                  {currentInquiryCount}
                </span>
              )}
            </div>
            <div className="hidden sm:flex sm:flex-col">
              <span className="text-[11px] text-[#cccccc]">Past Requests</span>
              <span className="font-bold text-white text-xs">& Inquiries ({currentInquiryCount})</span>
            </div>
          </Link>

          {/* Garage Counter Widget */}
          <Link
            href="/profile#garage"
            className="flex items-center gap-1.5 p-1.5 hover:outline hover:outline-1 hover:outline-white rounded transition-all"
            aria-label="Garage"
          >
            <div className="relative">
              <Car className="w-6 h-6 text-white" />
              <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#e30613] text-white font-black text-[10px] flex items-center justify-center">
                {vehicleCount}
              </span>
            </div>
            <span className="hidden md:inline font-bold text-xs mt-2">Garage</span>
          </Link>

          {/* Sign Out CTA */}
          {profile && (
            <form action={signOut}>
              <button
                type="submit"
                title="Sign Out"
                className="p-1.5 sm:p-2 text-[#cccccc] hover:text-white transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 2. Mobile Full-Width Search Bar (md:hidden) */}
      <div className="md:hidden bg-[#131921] px-3 pb-2.5 pt-0.5 border-t border-white/5">
        {renderSearchForm(true)}
      </div>

      {/* 2. Secondary Subnav Bar (Amazon Charcoal #232f3e) */}
      <div className="nav-scroll bg-[#232f3e] px-4 py-1.5 flex items-center justify-between text-xs overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-1 sm:gap-4">
          {/* ALL PARTS Hamburger Menu Button that triggers the drawer */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 font-bold text-white hover:outline hover:outline-1 hover:outline-white rounded cursor-pointer bg-[#37475a]/50 hover:bg-[#37475a]"
            aria-expanded={isDrawerOpen}
            aria-controls="customer-navigation-drawer"
          >
            <Menu className="w-4 h-4" />
            <span>All Parts & Categories</span>
          </button>

          <Link
            href="/cars"
            className="px-2 py-1 text-[#ffffff] hover:outline hover:outline-1 hover:outline-white rounded font-medium"
          >
            Suzuki Cars Showcase
          </Link>

          <Link
            href="/home?category=Body+Panels"
            className="px-2 py-1 text-[#ffffff] hover:outline hover:outline-1 hover:outline-white rounded font-medium text-[#febd69]"
          >
            Body Panels (Primer)
          </Link>

          <Link
            href="/home?category=Engine+%26+Drivetrain"
            className="px-2 py-1 text-[#ffffff] hover:outline hover:outline-1 hover:outline-white rounded font-medium"
          >
            Engine & Turbo Kits
          </Link>

          <Link
            href="/news"
            className="inline-flex items-center gap-1 px-2 py-1 text-[#ffffff] hover:outline hover:outline-1 hover:outline-white rounded font-medium"
          >
            <Newspaper className="w-3.5 h-3.5 text-[#febd69]" />
            <span>Mauritius News & Tech</span>
          </Link>

          <Link
            href="/content"
            className="inline-flex items-center gap-1 px-2 py-1 text-[#ffffff] hover:outline hover:outline-1 hover:outline-white rounded font-medium"
          >
            <Video className="w-3.5 h-3.5 text-[#febd69]" />
            <span>Care Videos</span>
          </Link>

          <Link
            href="/forum"
            className="inline-flex items-center gap-1 px-2 py-1 text-[#ffffff] hover:outline hover:outline-1 hover:outline-white rounded font-medium"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#febd69]" />
            <span>Owner Community Forum</span>
          </Link>

          <Link
            href="/profile#inquiries"
            className="inline-flex items-center gap-1 px-2 py-1 text-[#ffffff] hover:outline hover:outline-1 hover:outline-white rounded font-medium"
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>My Inquiries{currentInquiryCount > 0 ? ` (${currentInquiryCount})` : ""}</span>
          </Link>
        </div>

        <div className="hidden lg:block text-[#cccccc] text-[11px]">
          Dealership Assistance:{" "}
          <a href="tel:+2305550199" className="font-bold text-[#febd69] hover:underline">
            +230 555-0199
          </a>{" "}
          (Phoenix / Port Louis)
        </div>
      </div>

      {/* 3. Amazon Slide-Over "ALL" Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Menu Container */}
          <div
            id="customer-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Suzuki navigation"
            className="relative w-80 sm:w-96 bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto text-[#0f1111]"
          >
            {/* Drawer Header */}
            <div className="bg-[#232f3e] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#f08804] text-white flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-sm block">
                    Hello, {firstName || "Suzuki Driver"}
                  </span>
                  <span className="text-[10px] text-[#febd69]">
                    Serving Suzuki owners in Mauritius 🇲🇺
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 space-y-5 text-xs">
              {/* Category Section with Icons */}
              <div>
                <h3 className="font-extrabold text-sm text-[#0f1111] mb-2 uppercase tracking-wider text-[11px] text-[#565959]">
                  Browse Parts by Category
                </h3>
                <ul className="space-y-1">
                  <li>
                    <Link
                      href="/home?category=Body+Panels"
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex items-center justify-between p-2 rounded hover:bg-[#f3f3f3] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Car className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-[#0f1111]">Body Panels (Gray Primer)</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#888c8c]" />
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/home?category=Engine+%26+Drivetrain"
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex items-center justify-between p-2 rounded hover:bg-[#f3f3f3] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Wrench className="w-4 h-4 text-amber-600" />
                        <span className="font-medium text-[#0f1111]">Engine & Drivetrain</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#888c8c]" />
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/home?category=Electrical+%26+Lighting"
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex items-center justify-between p-2 rounded hover:bg-[#f3f3f3] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Zap className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium text-[#0f1111]">Electrical & Lighting</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#888c8c]" />
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/home?category=Suspension+%26+Steering"
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex items-center justify-between p-2 rounded hover:bg-[#f3f3f3] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Activity className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium text-[#0f1111]">Suspension & Steering</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#888c8c]" />
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/home?category=Brakes+%26+Wheels"
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex items-center justify-between p-2 rounded hover:bg-[#f3f3f3] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Disc3 className="w-4 h-4 text-rose-600" />
                        <span className="font-medium text-[#0f1111]">Brakes & Wheels</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#888c8c]" />
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/home?category=Interior+%26+Accessories"
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex items-center justify-between p-2 rounded hover:bg-[#f3f3f3] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Armchair className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-[#0f1111]">Interior & Accessories</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#888c8c]" />
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/home"
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex items-center justify-between p-2 rounded hover:bg-[#f3f3f3] transition-colors text-[#007185] font-bold"
                    >
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-[#c7511f]" />
                        <span>View All 68 Genuine Parts</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </li>
                </ul>
              </div>

              <hr className="border-[#e7e7e7]" />

              {/* Mauritius Vehicle Showcase Section */}
              <div>
                <h3 className="font-extrabold text-sm text-[#0f1111] mb-2 uppercase tracking-wider text-[11px] text-[#565959]">
                  Explore Mauritius Suzuki Cars
                </h3>
                <ul className="space-y-1">
                  {["Swift", "Jimny", "Grand Vitara", "Fronx", "Baleno", "Ertiga"].map((model) => (
                    <li key={model}>
                      <Link
                        href={`/cars`}
                        onClick={() => setIsDrawerOpen(false)}
                        className="flex items-center justify-between p-2 rounded hover:bg-[#f3f3f3] transition-colors text-[#0f1111]"
                      >
                        <span>Suzuki {model} Specs & Parts</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#888c8c]" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <hr className="border-[#e7e7e7]" />

              {/* Community & Press Section */}
              <div>
                <h3 className="font-extrabold text-sm text-[#0f1111] mb-2 uppercase tracking-wider text-[11px] text-[#565959]">
                  Community & Assistance
                </h3>
                <ul className="space-y-1">
                  <li>
                    <Link
                      href="/news"
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded hover:bg-[#f3f3f3] text-[#0f1111]"
                    >
                      <Newspaper className="w-4 h-4 text-[#007185]" />
                      <span>Mauritius News & Policies</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/forum"
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded hover:bg-[#f3f3f3] text-[#0f1111]"
                    >
                      <MessageSquare className="w-4 h-4 text-[#007185]" />
                      <span>Owners Discussion Forum</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/content"
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded hover:bg-[#f3f3f3] text-[#0f1111]"
                    >
                      <Video className="w-4 h-4 text-[#007185]" />
                      <span>Dealer Care Videos</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/profile#inquiries"
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded hover:bg-[#f3f3f3] text-[#0f1111]"
                    >
                      <Inbox className="w-4 h-4 text-[#007185]" />
                      <span>My Part Requests{currentInquiryCount > 0 ? ` (${currentInquiryCount})` : ""}</span>
                    </Link>
                  </li>
                  <li>
                    <a
                      href="https://wa.me/2305550199"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 p-2 rounded hover:bg-[#f3f3f3] text-[#2b8a3e] font-semibold"
                    >
                      <Phone className="w-4 h-4" />
                      <span>WhatsApp Parts Desk (+230 555-0199)</span>
                    </a>
                  </li>
                </ul>
              </div>

              {/* Drawer Auth Footer */}
              <div className="pt-4 border-t border-[#e7e7e7]">
                {profile ? (
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#f0f2f2] hover:bg-[#e3e6e6] text-[#0f1111] font-bold text-xs transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-suzuki-red" />
                      <span>Sign Out ({firstName})</span>
                    </button>
                  </form>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg btn-amazon-primary text-[#0f1111] font-bold text-xs transition-all shadow-xs"
                  >
                    <span>Sign In to Suzuki Account</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
