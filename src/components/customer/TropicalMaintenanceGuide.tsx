import Link from "next/link";
import { Wrench, ShieldAlert, ThermometerSun, Waves, BatteryCharging, ArrowRight } from "lucide-react";

export function TropicalMaintenanceGuide() {
  const guides = [
    {
      icon: ThermometerSun,
      title: "Tropical Viscosity Standard",
      highlight: "5W-30 Full Synthetic",
      description:
        "High ambient Mauritius summer temperatures (30°C+) break down low-viscosity oils quickly. Always use genuine Suzuki ECSTAR 5W-30 for optimal turbo boost & boosterjet cooling.",
      link: "/home?category=Engine+%26+Drivetrain",
      linkText: "View Motor Oils & Filters",
    },
    {
      icon: Waves,
      title: "Coastal Salt-Air Paint Prep",
      highlight: "Gray Primer Sealer Guide",
      description:
        "Body parts arrive in protective gray electro-deposit primer. Before spray painting in Phoenix or Port Louis, panels must be lightly scuffed with 800-grit sandpaper and sealed with 2K polyurethane clear coat.",
      link: "/home?category=Body+Panels",
      linkText: "Browse Genuine Panels",
    },
    {
      icon: BatteryCharging,
      title: "Smart Hybrid Inverter Care",
      highlight: "12V & 48V Lithium Units",
      description:
        "Ensure the under-seat lithium cooling ducts are kept clean of floor sand and debris. Regenerative braking captures energy down Plaine Magnien hills, reducing brake pad wear by up to 35%.",
      link: "/home?category=Electrical+%26+Lighting",
      linkText: "Hybrid Components",
    },
    {
      icon: ShieldAlert,
      title: "Brake Rotor Thermal Load",
      highlight: "High-Carbon Ventilated Discs",
      description:
        "Frequent descents from Curepipe and Chamarel create high brake rotor thermal stress. Inspect minimum rotor thickness at every 10,000km service interval to prevent high-speed vibration.",
      link: "/home?category=Brakes+%26+Wheels",
      linkText: "Ceramic Pads & Rotors",
    },
  ];

  return (
    <section className="amazon-card bg-white p-5 sm:p-7 rounded-2xl border border-[#e7e7e7] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0f0f0] pb-4">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-bold text-[#c7511f]">
            Island Driving Technical Briefing
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0f1111] mt-0.5">
            Suzuki Mauritius Tropical Maintenance Protocols
          </h2>
          <p className="text-xs text-[#565959] mt-1">
            Engineered advice from authorized Phoenix service engineers for island climate longevity
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#565959]">
          <Wrench className="w-4 h-4 text-[#f08804]" />
          <span>Phoenix Technical Desk Guidelines</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {guides.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="p-4 rounded-xl border border-[#e7e7e7] bg-[#f9fafa] flex flex-col justify-between space-y-3 hover:border-[#b8ddf8] transition-all"
            >
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-lg bg-white border border-[#d5d9d9] flex items-center justify-center text-[#c7511f] shadow-2xs">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-[#0f1111] leading-tight">
                    {item.title}
                  </h3>
                  <span className="text-[10px] font-bold text-[#2b8a3e] bg-[#e7f4e4] px-1.5 py-0.5 rounded inline-block mt-1">
                    {item.highlight}
                  </span>
                </div>
                <p className="text-[11px] text-[#565959] leading-relaxed">
                  {item.description}
                </p>
              </div>

              <Link
                href={item.link}
                className="pt-2 border-t border-[#e7e7e7] text-xs font-bold text-[#007185] hover:text-[#c7511f] inline-flex items-center gap-1 transition-colors"
              >
                <span>{item.linkText}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
