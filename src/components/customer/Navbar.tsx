"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/auth/actions";
import type { Profile } from "@/lib/types";
import { PART_CATEGORIES } from "@/lib/types";
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (selectedCategory && selectedCategory !== "All")
      params.set("category", selectedCategory);
    router.push(`/home?${params.toString()}`);
  };

  const firstName = profile
    ? profile.full_name?.split(" ")[0] || profile.email?.split("@")[0] || "Driver"
    : null;

  return (
    <header className="w-full text-white font-sans text-xs select-none">
      {/* 1. Main Top Navigation Bar (Amazon Navy #131921) */}
      <div className="bg-[#131921] px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Wordmark */}
        <Link
          href="/home"
          className="flex items-center gap-1.5 p-1.5 hover:outline hover:outline-1 hover:outline-white rounded transition-all flex-shrink-0"
        >
          <div className="w-8 h-8 rounded bg-suzuki-red flex items-center justify-center font-black text-white text-lg shadow-sm">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-white leading-none">
              suzuki<span className="text-[#febd69]">.mu</span>
            </span>
            <span className="text-[9px] uppercase tracking-widest text-[#febd69] font-bold">
              Mauritius
            </span>
          </div>
        </Link>

        {/* Deliver to Mauritius Location Widget */}
        <div className="hidden md:flex items-center gap-1 p-1.5 hover:outline hover:outline-1 hover:outline-white rounded cursor-pointer transition-all flex-shrink-0">
          <MapPin className="w-4 h-4 text-white mt-1" />
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] text-[#cccccc]">Deliver to</span>
            <span className="font-bold text-white text-xs">Mauritius 🇲🇺</span>
          </div>
        </div>

        {/* Big Amazon Search Bar */}
        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-3xl flex items-center h-10 rounded-md overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#f08804]"
        >
          {/* Category Dropdown */}
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

          {/* Search Input */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search genuine Suzuki parts, bumpers, Swift, Jimny..."
            className="flex-1 px-3.5 text-[#0f1111] text-xs sm:text-sm focus:outline-none placeholder:text-[#555555]"
          />

          {/* Golden Search Button */}
          <button
            type="submit"
            aria-label="Search"
            className="h-full px-4 bg-[#febd69] hover:bg-[#f3a847] text-[#111111] flex items-center justify-center transition-colors cursor-pointer"
          >
            <Search className="w-5 h-5 stroke-[2.5]" />
          </button>
        </form>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Admin Switcher */}
          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className="hidden lg:flex items-center gap-1 px-2 py-1 rounded bg-[#febd69] text-[#111111] font-bold text-xs hover:bg-[#f3a847] transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-suzuki-red" />
              <span>Admin</span>
            </Link>
          )}

          {/* Account / Sign In */}
          {profile ? (
            <Link
              href="/profile"
              className="flex flex-col leading-tight p-1.5 hover:outline hover:outline-1 hover:outline-white rounded transition-all"
            >
              <span className="text-[11px] text-[#cccccc]">Hello, {firstName}</span>
              <span className="font-bold text-white text-xs flex items-center gap-0.5">
                <span>Account & Garage</span>
                <ChevronDown className="w-3 h-3 text-[#cccccc]" />
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex flex-col leading-tight p-1.5 hover:outline hover:outline-1 hover:outline-white rounded transition-all"
            >
              <span className="text-[11px] text-[#cccccc]">Hello, Sign in</span>
              <span className="font-bold text-white text-xs flex items-center gap-0.5">
                <span>Account & Garage</span>
                <ChevronDown className="w-3 h-3 text-[#cccccc]" />
              </span>
            </Link>
          )}

          {/* Returns & Inquiries */}
          <Link
            href="/profile#inquiries"
            className="hidden sm:flex flex-col leading-tight p-1.5 hover:outline hover:outline-1 hover:outline-white rounded transition-all"
          >
            <span className="text-[11px] text-[#cccccc]">Past Requests</span>
            <span className="font-bold text-white text-xs">& Inquiries ({inquiryCount})</span>
          </Link>

          {/* Garage Counter Widget */}
          <Link
            href="/profile#garage"
            className="flex items-center gap-1.5 p-1.5 hover:outline hover:outline-1 hover:outline-white rounded transition-all"
          >
            <div className="relative">
              <Car className="w-7 h-7 text-white" />
              <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-[#f08804] text-[#111111] font-black text-[10px] flex items-center justify-center">
                {vehicleCount}
              </span>
            </div>
            <span className="hidden md:inline font-bold text-xs mt-2">Garage</span>
          </Link>

          {/* Sign Out or Sign In CTA */}
          {profile ? (
            <form action={signOut}>
              <button
                type="submit"
                title="Sign Out"
                className="p-2 text-[#cccccc] hover:text-white transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-full btn-amazon-primary text-xs font-bold text-[#0f1111] transition-all shadow-xs"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* 2. Secondary Subnav Bar (Amazon Charcoal #232f3e) */}
      <div className="bg-[#232f3e] px-4 py-1.5 flex items-center justify-between text-xs overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-1 sm:gap-4">
          {/* ALL PARTS Hamburger Menu Button that triggers the drawer */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 font-bold text-white hover:outline hover:outline-1 hover:outline-white rounded cursor-pointer bg-[#37475a]/50 hover:bg-[#37475a]"
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
            <span>My Inquiries</span>
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
          <div className="relative w-80 sm:w-96 bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto text-[#0f1111]">
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
                    Deliver to Mauritius 🇲🇺
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 space-y-5 text-xs">
              {/* Category Section with Icons */}
              <div>
                <h3 className="font-extrabold text-sm text-[#0f1111] mb-2 uppercase tracking-wider text-[11px] text-[#565959]">
                  Shop Parts by Department
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
                      href="/profile#inquiries"
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded hover:bg-[#f3f3f3] text-[#0f1111]"
                    >
                      <Inbox className="w-4 h-4 text-[#007185]" />
                      <span>My Inquiries & Transactions</span>
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
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
