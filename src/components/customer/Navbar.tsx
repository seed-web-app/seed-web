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
} from "lucide-react";

interface CustomerNavbarProps {
  profile: Profile;
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (selectedCategory && selectedCategory !== "All")
      params.set("category", selectedCategory);
    router.push(`/home?${params.toString()}`);
  };

  const firstName =
    profile.full_name?.split(" ")[0] || profile.email?.split("@")[0] || "Driver";

  return (
    <header className="w-full text-white font-sans text-xs">
      {/* 1. Main Top Navigation Bar (Amazon Navy #131921) */}
      <div className="bg-[#131921] px-4 py-2 flex items-center justify-between gap-2 sm:gap-4">
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
            className="h-full bg-[#f3f3f3] hover:bg-[#dadada] text-[#555555] text-xs px-2.5 border-r border-[#cdcdcd] focus:outline-none cursor-pointer"
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
            className="flex-1 px-3.5 text-[#0f1111] text-sm focus:outline-none placeholder:text-[#555555]"
          />

          {/* Golden Search Button */}
          <button
            type="submit"
            className="h-full px-4 bg-[#febd69] hover:bg-[#f3a847] text-[#111111] flex items-center justify-center transition-colors cursor-pointer"
          >
            <Search className="w-5 h-5 stroke-[2.5]" />
          </button>
        </form>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Admin Switcher */}
          {profile.role === "admin" && (
            <Link
              href="/admin"
              className="hidden lg:flex items-center gap-1 px-2 py-1 rounded bg-[#febd69] text-[#111111] font-bold text-xs hover:bg-[#f3a847] transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-suzuki-red" />
              <span>Admin</span>
            </Link>
          )}

          {/* Account & Garage */}
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

          {/* Returns & Inquiries */}
          <Link
            href="/profile"
            className="hidden sm:flex flex-col leading-tight p-1.5 hover:outline hover:outline-1 hover:outline-white rounded transition-all"
          >
            <span className="text-[11px] text-[#cccccc]">Past Requests</span>
            <span className="font-bold text-white text-xs">& Inquiries ({inquiryCount})</span>
          </Link>

          {/* Garage Counter Widget */}
          <Link
            href="/profile"
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

          {/* Sign Out */}
          <form action={signOut}>
            <button
              type="submit"
              title="Sign Out"
              className="p-2 text-[#cccccc] hover:text-white transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* 2. Secondary Subnav Bar (Amazon Charcoal #232f3e) */}
      <div className="bg-[#232f3e] px-4 py-1.5 flex items-center justify-between text-xs overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-1 sm:gap-4">
          <Link
            href="/home"
            className="inline-flex items-center gap-1.5 px-2 py-1 font-bold text-white hover:outline hover:outline-1 hover:outline-white rounded"
          >
            <Menu className="w-4 h-4" />
            <span>All Parts</span>
          </Link>

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
            href="/profile"
            className="inline-flex items-center gap-1 px-2 py-1 text-[#ffffff] hover:outline hover:outline-1 hover:outline-white rounded font-medium"
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>My Inquiries</span>
          </Link>
        </div>

        <div className="hidden lg:block text-[#cccccc] text-[11px]">
          Dealership Assistance: <span className="font-bold text-[#febd69]">+230 555-0199</span> (Phoenix / Port Louis)
        </div>
      </div>
    </header>
  );
}
