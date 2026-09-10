import { MapPin, Phone, MessageSquare, Clock, ShieldCheck } from "lucide-react";

interface Depot {
  id: string;
  name: string;
  badge: string;
  address: string;
  region: string;
  phone: string;
  whatsapp: string;
  hours: string;
  features: string[];
}

const DEPOTS: Depot[] = [
  {
    id: "phoenix",
    name: "Phoenix Central Parts Hub & Warehouse",
    badge: "Main Island Distribution",
    region: "Plaines Wilhems / Central",
    address: "Motorway M2, Phoenix Industrial Zone, Phoenix",
    phone: "+230 555-0199",
    whatsapp: "https://wa.me/2305550199?text=Hello%20Suzuki%20Phoenix%2C%20inquiring%20about%20parts%20availability",
    hours: "Mon - Fri: 8:00 - 17:00 • Sat: 8:30 - 12:30",
    features: [
      "All 68 Catalog Parts in Stock",
      "Certified Electro-Primer Paint Booth",
      "VIN & Chassis Fitment Counter",
      "Express Fitting Bay",
    ],
  },
  {
    id: "port-louis",
    name: "Port Louis Harbour Branch & Fleet Counter",
    badge: "Commercial & North-West",
    region: "Port Louis District",
    address: "Quay D Road, Port Louis Harbour, Port Louis",
    phone: "+230 555-0188",
    whatsapp: "https://wa.me/2305550199?text=Hello%20Suzuki%20Port%20Louis%2C%20inquiring%20about%20counter%20collection",
    hours: "Mon - Fri: 8:00 - 16:30 • Sat: Closed",
    features: [
      "Heavy-Duty Jimny & Commercial Parts",
      "Fast Express Counter Pickup",
      "Fleet Maintenance Packs",
      "Wholesale Trade Desk",
    ],
  },
  {
    id: "flacq",
    name: "Centre de Flacq Regional Service Point",
    badge: "East Coast Hub",
    region: "Flacq & Belle Mare",
    address: "Boulevard Central, Centre de Flacq",
    phone: "+230 555-0177",
    whatsapp: "https://wa.me/2305550199?text=Hello%20Suzuki%20Flacq%2C%20inquiring%20about%20service%20kits",
    hours: "Mon - Fri: 8:30 - 16:30 • Sat: 8:30 - 12:00",
    features: [
      "ECSTAR Oil & Quick Service Filters",
      "Brake Pads & Rotor Sets",
      "Daily Phoenix Courier Transfer",
      "Diagnostic Booking Counter",
    ],
  },
  {
    id: "grand-baie",
    name: "Grand Baie Northern Customer Desk",
    badge: "North Coast Express",
    region: "Rivière du Rempart / Grand Baie",
    address: "La Salette Road, Grand Baie",
    phone: "+230 555-0166",
    whatsapp: "https://wa.me/2305550199?text=Hello%20Suzuki%20Grand%20Baie%2C%20inquiring%20about%20parts%20collection",
    hours: "Mon - Fri: 9:00 - 17:00 • Sat: 9:00 - 13:00",
    features: [
      "Lifestyle Accessories & Roof Rails",
      "Smart Hybrid Battery Inverters",
      "Same-Day Pickup on Fast-Movers",
      "English & French Speaking Specialists",
    ],
  },
];

export function DepotsDirectory() {
  return (
    <section className="amazon-card bg-white p-5 sm:p-7 rounded-2xl border border-[#e7e7e7] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0f0f0] pb-4">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-bold text-[#c7511f]">
            Dealership Network Presence
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0f1111] mt-0.5">
            Authorized Suzuki Parts Depots in Mauritius
          </h2>
          <p className="text-xs text-[#565959] mt-1">
            Pick up your quoted parts in person or arrange islandwide delivery from our 4 certified hubs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#e7f4e4] text-[#2b8a3e] text-xs font-bold flex items-center gap-1 border border-[#b2d8b8]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Official Dealership Guarantees</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {DEPOTS.map((depot) => (
          <div
            key={depot.id}
            className="p-5 rounded-xl border border-[#e7e7e7] bg-[#fdfdfd] hover:border-[#b8ddf8] hover:shadow-sm transition-all space-y-3.5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#131921] text-white">
                  {depot.badge}
                </span>
                <span className="text-[11px] font-semibold text-[#007185]">
                  {depot.region}
                </span>
              </div>

              <h3 className="font-bold text-sm sm:text-base text-[#0f1111] leading-snug">
                {depot.name}
              </h3>

              <div className="mt-2 text-xs text-[#565959] space-y-1">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#c7511f] flex-shrink-0 mt-0.5" />
                  <span>{depot.address}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#565959] flex-shrink-0" />
                  <span>{depot.hours}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#f0f0f0]">
                <span className="text-[10px] uppercase font-bold text-[#888c8c] tracking-wider block mb-1.5">
                  Depot Capabilities:
                </span>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-[#0f1111]">
                  {depot.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-1 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2b8a3e] flex-shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#f0f0f0] flex flex-wrap items-center gap-2">
              <a
                href={depot.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-center py-2 px-3 rounded-full btn-amazon-primary text-xs font-bold text-[#0f1111] flex items-center justify-center gap-1.5 shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Desk</span>
              </a>

              <a
                href={`tel:${depot.phone.replace(/\s+/g, "")}`}
                className="py-2 px-3 rounded-full bg-white border border-[#d5d9d9] hover:bg-[#f3f3f3] text-xs font-semibold text-[#0f1111] flex items-center justify-center gap-1"
              >
                <Phone className="w-3.5 h-3.5 text-[#2b8a3e]" />
                <span>{depot.phone}</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
