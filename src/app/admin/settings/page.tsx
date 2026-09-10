import { getDealerSettings, getCurrentProfile } from "@/lib/supabase/server";
import { updateDealerSettings } from "./actions";
import {
  Settings,
  Building,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface AdminSettingsPageProps {
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
}

export default async function AdminSettingsPage({ searchParams }: AdminSettingsPageProps) {
  const { saved, error } = await searchParams;
  const settings = await getDealerSettings();
  const profile = await getCurrentProfile();

  return (
    <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-5xl w-full mx-auto">
      {/* Notifications */}
      {saved && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Dealership configuration saved successfully.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>Could not update dealership settings. Please verify input fields.</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Settings className="w-7 h-7 text-slate-400" />
          <span>Dealership & Admin Settings</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure dealership contact details presented to customers, notification email endpoints, and role access.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Dealership Info Form (8 cols) */}
        <div className="lg:col-span-8 rounded-3xl bg-glass border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <Building className="w-5 h-5 text-suzuki-red" />
            <div>
              <h2 className="text-base font-bold text-white">Dealer Contact & Business Info</h2>
              <p className="text-xs text-slate-400">
                Shown to customers across parts inquiry confirmations and footers
              </p>
            </div>
          </div>

          <form action={updateDealerSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Dealership Trade Name
              </label>
              <input
                type="text"
                name="dealer_name"
                defaultValue={settings.dealer_name}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Customer Support Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={settings.phone}
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  WhatsApp Dispatch Number
                </label>
                <div className="relative">
                  <MessageCircle className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    name="whatsapp"
                    defaultValue={settings.whatsapp}
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                New Leads Notification Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  name="notification_email"
                  defaultValue={settings.notification_email}
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Automated email alerts will be dispatched to this address on new part requests.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Physical Dealership Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  name="address"
                  defaultValue={settings.address}
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Parts Department Operating Hours
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  name="operating_hours"
                  defaultValue={settings.operating_hours}
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-suzuki-slate border border-white/15 text-white text-xs sm:text-sm focus:border-suzuki-red focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-suzuki-red hover:bg-suzuki-brightred text-white text-xs font-bold shadow-lg shadow-suzuki-red/30 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Dealership Info</span>
              </button>
            </div>
          </form>
        </div>

        {/* Admin Access & Seeding Instructions (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl bg-glass border border-white/10 p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
              <ShieldAlert className="w-5 h-5" />
              <span>Admin Role Seeding</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              In accordance with security rules, there is <strong>no public admin registration</strong>.
              All administrators log in via Google OAuth, and their profile is promoted via a manual
              database update on the <code className="text-amber-300">profiles.role</code> column.
            </p>

            <div className="p-3.5 rounded-xl bg-suzuki-black/80 border border-white/10 font-mono text-[11px] text-slate-300 space-y-2">
              <p className="text-slate-400">{"-- SQL to promote user to Admin:"}</p>
              <p className="text-amber-300 break-all select-all">
                UPDATE public.profiles
                <br />
                SET role = &apos;admin&apos;
                <br />
                WHERE email = &apos;admin@example.com&apos;;
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-white">Current Active Session:</p>
              <p className="font-mono text-slate-300">{profile?.email}</p>
              <p className="text-emerald-400 font-bold">Role: {profile?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
