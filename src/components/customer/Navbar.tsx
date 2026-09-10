"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import type { Profile } from "@/lib/types";
import { Car, Package, Video, User, LogOut, ShieldAlert } from "lucide-react";

interface CustomerNavbarProps {
  profile: Profile;
  vehicleCount?: number;
}

export function CustomerNavbar({ profile, vehicleCount = 0 }: CustomerNavbarProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/home", label: "Parts Catalog", icon: Package },
    { href: "/content", label: "Care & Videos", icon: Video },
    { href: "/profile", label: "My Garage & Inquiries", icon: Car },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-suzuki-black/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/home" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-suzuki-red flex items-center justify-center font-black text-white text-lg shadow-md shadow-suzuki-red/30">
              S
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-sm text-white uppercase tracking-wider block leading-tight">
                Suzuki Network
              </span>
              <span className="text-[10px] text-suzuki-muted uppercase tracking-widest block leading-none">
                Customer Portal
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-suzuki-red text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side user info & actions */}
        <div className="flex items-center gap-3">
          {profile.role === "admin" && (
            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/20 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </Link>
          )}

          <Link
            href="/profile"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-right"
          >
            <div className="hidden md:block">
              <p className="text-xs font-bold text-white leading-tight">
                {profile.full_name || "Suzuki Driver"}
              </p>
              <p className="text-[10px] text-slate-400 leading-none">
                {vehicleCount} {vehicleCount === 1 ? "Vehicle" : "Vehicles"}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-suzuki-slate border border-white/10 flex items-center justify-center text-xs font-bold text-slate-200 overflow-hidden">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || "Avatar"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </Link>

          <form action={signOut}>
            <button
              type="submit"
              title="Sign Out"
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
