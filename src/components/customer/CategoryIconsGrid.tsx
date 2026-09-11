"use client";

import Link from "next/link";
import {
  Car,
  Wrench,
  Zap,
  Activity,
  Disc3,
  Armchair,
  Sparkles,
  Fan,
  ChevronRight,
} from "lucide-react";

interface CategoryMeta {
  name: string;
  queryParam: string;
  icon: React.ElementType;
  badge: string;
  highlight: string;
  popularItems: string;
  bgColor: string;
  iconColor: string;
}

const CATEGORIES_META: CategoryMeta[] = [
  {
    name: "Body Panels (Gray Primer)",
    queryParam: "Body Panels",
    icon: Car,
    badge: "14 Parts",
    highlight: "Factory Primer Sealed",
    popularItems: "Bumpers, Fenders, Hoods, Grilles",
    bgColor: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
  },
  {
    name: "Engine & Drivetrain",
    queryParam: "Engine & Drivetrain",
    icon: Wrench,
    badge: "12 Parts",
    highlight: "Boosterjet & DualJet",
    popularItems: "Turbochargers, Timing Chains, Clutches",
    bgColor: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-600",
  },
  {
    name: "Electrical & Lighting",
    queryParam: "Electrical & Lighting",
    icon: Zap,
    badge: "12 Parts",
    highlight: "Smart Hybrid & LED",
    popularItems: "Headlamps, Hybrid Inverters, Alternators",
    bgColor: "bg-yellow-50 border-yellow-200",
    iconColor: "text-yellow-600",
  },
  {
    name: "Suspension & Steering",
    queryParam: "Suspension & Steering",
    icon: Activity,
    badge: "10 Parts",
    highlight: "AllGrip Off-Road & Track",
    popularItems: "Shock Absorbers, Control Arms, Tie Rods",
    bgColor: "bg-emerald-50 border-emerald-200",
    iconColor: "text-emerald-600",
  },
  {
    name: "Brakes & Wheels",
    queryParam: "Brakes & Wheels",
    icon: Disc3,
    badge: "10 Parts",
    highlight: "OEM High Friction",
    popularItems: "Ceramic Pads, Ventilated Discs, ABS Sensors",
    bgColor: "bg-rose-50 border-rose-200",
    iconColor: "text-rose-600",
  },
  {
    name: "Interior & Accessories",
    queryParam: "Interior & Accessories",
    icon: Armchair,
    badge: "10 Parts",
    highlight: "Genuine Comfort",
    popularItems: "All-Weather Mats, Armrests, Steering Trim",
    bgColor: "bg-purple-50 border-purple-200",
    iconColor: "text-purple-600",
  },
  {
    name: "Maintenance & Service Kits",
    queryParam: "Engine & Drivetrain",
    icon: Sparkles,
    badge: "Quick Service",
    highlight: "Dealership Certified",
    popularItems: "Oil Filters, Iridium Plugs, Cabin Air Filters",
    bgColor: "bg-teal-50 border-teal-200",
    iconColor: "text-teal-600",
  },
  {
    name: "Cooling & Air Conditioning",
    queryParam: "Engine & Drivetrain",
    icon: Fan,
    badge: "Tropical Climate Spec",
    highlight: "Island Heavy-Duty",
    popularItems: "Aluminum Radiators, AC Compressors, Water Pumps",
    bgColor: "bg-cyan-50 border-cyan-200",
    iconColor: "text-cyan-600",
  },
];

interface CategoryIconsGridProps {
  activeCategory?: string;
}

export function CategoryIconsGrid({ activeCategory }: CategoryIconsGridProps) {
  return (
    <div className="amazon-card bg-white p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#e7e7e7] pb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#0f1111] flex items-center gap-2">
            <span>Browse Suzuki Parts by Category</span>
          </h2>
          <p className="text-xs text-[#565959]">
            Select a certified OEM category to filter genuine parts for Swift, Jimny, Grand Vitara, and Fronx
          </p>
        </div>
        <Link
          href="/home"
          className="text-xs font-semibold text-[#007185] hover:text-[#c7511f] hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <span>View All Categories</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {CATEGORIES_META.map((cat) => {
          const Icon = cat.icon;
          const isSelected = activeCategory === cat.queryParam;

          return (
            <Link
              key={cat.name}
              href={`/home?category=${encodeURIComponent(cat.queryParam)}`}
              className={`group flex flex-col items-center text-center p-3 rounded-lg border transition-all duration-200 hover:shadow-md hover:border-[#f08804] ${
                isSelected
                  ? "border-[#f08804] bg-[#fffcf5] ring-2 ring-[#f08804]/30"
                  : "border-[#e7e7e7] bg-white hover:bg-[#fafafa]"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110 ${cat.bgColor}`}
              >
                <Icon className={`w-6 h-6 ${cat.iconColor}`} />
              </div>

              <h3 className="text-xs font-bold text-[#0f1111] leading-tight group-hover:text-[#c7511f] line-clamp-2 h-8 flex items-center justify-center">
                {cat.name}
              </h3>

              <span className="mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#f0f2f2] text-[#565959] group-hover:bg-[#fbd88e] group-hover:text-[#111111]">
                {cat.badge}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
