import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import {
  LayoutDashboard,
  Package,
  Inbox,
  Video,
  Users,
  Settings,
  ShieldCheck,
  Eye,
  LogOut,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "admin") {
    redirect("/home?error=unauthorized");
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/parts", label: "Parts Inventory", icon: Package },
    { href: "/admin/inquiries", label: "Customer Inquiries", icon: Inbox },
    { href: "/admin/content", label: "Video & Content", icon: Video },
    { href: "/admin/users", label: "Registered Customers", icon: Users },
    { href: "/admin/settings", label: "Dealer Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-suzuki-black text-slate-100 flex flex-col md:flex-row selection:bg-suzuki-red selection:text-white">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-suzuki-carbon border-r border-white/10 flex-shrink-0 flex flex-col justify-between">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-suzuki-red flex items-center justify-center font-black text-white text-xl shadow-lg shadow-suzuki-red/30">
                S
              </div>
              <div>
                <span className="font-extrabold text-sm text-white uppercase tracking-wider block leading-tight">
                  Suzuki Admin
                </span>
                <span className="text-[10px] text-suzuki-muted uppercase tracking-widest block leading-none">
                  Dealer Console
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-suzuki-red/20 text-suzuki-brightred border border-suzuki-red/30">
              Admin
            </span>
          </div>

          {/* Navigation links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          {/* Quick link to view as customer */}
          <Link
            href="/home"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-suzuki-brightred" />
              <span>Customer View</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">→</span>
          </Link>

          {/* Admin user info & logout */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-suzuki-red/20 text-suzuki-brightred flex items-center justify-center font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {profile.full_name || "Admin"}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{profile.email}</p>
              </div>
            </div>

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
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
