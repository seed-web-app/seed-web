"use client";

import { useMemo, useState } from "react";
import { Gift, Mail, MessageCircle, Phone, Send, Sparkles } from "lucide-react";
import { prepareCustomerOffer } from "./actions";

interface CustomerOption {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  vehicles: { model: string; year: number }[];
}

interface PartOption {
  id: string;
  name: string;
  price: number;
  short_description?: string | null;
}

export function OfferComposer({ customers, parts, initialCustomerId }: { customers: CustomerOption[]; parts: PartOption[]; initialCustomerId?: string }) {
  const firstCustomer = customers.find((customer) => customer.id === initialCustomerId) || customers[0];
  const [customerId, setCustomerId] = useState(firstCustomer?.id || "");
  const [partId, setPartId] = useState("");
  const [title, setTitle] = useState("A special offer for your Suzuki");
  const [message, setMessage] = useState(() => buildMessage(firstCustomer));
  const [price, setPrice] = useState("");
  const [channel, setChannel] = useState("whatsapp");
  const selectedCustomer = useMemo(() => customers.find((customer) => customer.id === customerId), [customerId, customers]);

  const chooseCustomer = (id: string) => {
    const customer = customers.find((item) => item.id === id);
    setCustomerId(id);
    setMessage(buildMessage(customer, parts.find((part) => part.id === partId)));
  };

  const choosePart = (id: string) => {
    const part = parts.find((item) => item.id === id);
    setPartId(id);
    if (part) {
      setTitle(`Special offer: ${part.name}`);
      setPrice(String(part.price));
      setMessage(buildMessage(selectedCustomer, part));
    }
  };

  if (!customers.length) return <div className="rounded-[26px] border border-white/10 bg-white/[0.055] p-8 text-center text-sm text-slate-400">No customer accounts are available yet.</div>;

  return (
    <form action={prepareCustomerOffer} className="rounded-[30px] border border-white/10 bg-white/[0.055] p-5 shadow-2xl sm:p-7">
      <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e30613] text-white"><Gift className="h-5 w-5" /></span><div><h2 className="text-xl font-black tracking-[-0.03em] text-white">Create a personal offer</h2><p className="text-xs text-slate-400">Choose an owner, tailor the message, then open the channel to send it manually.</p></div></div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Suzuki owner<select name="customer_id" required value={customerId} onChange={(event) => chooseCustomer(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-[#2b2b30] px-4 text-sm font-semibold normal-case tracking-normal text-white outline-none focus:border-[#e30613]">{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name || customer.email} · {customer.vehicles[0]?.model || "No vehicle"}</option>)}</select></label>
        <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Part <span className="normal-case tracking-normal text-slate-500">(optional)</span><select name="part_id" value={partId} onChange={(event) => choosePart(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-[#2b2b30] px-4 text-sm font-semibold normal-case tracking-normal text-white outline-none focus:border-[#e30613]"><option value="">General owner offer</option>{parts.map((part) => <option key={part.id} value={part.id}>{part.name} · Rs {Number(part.price).toLocaleString()}</option>)}</select></label>
      </div>

      <label className="mt-4 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Offer title<input name="title" required value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm font-bold normal-case tracking-normal text-white outline-none focus:border-[#e30613]" /></label>
      <label className="mt-4 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Personal message<textarea name="message" required rows={6} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-medium leading-6 normal-case tracking-normal text-white outline-none focus:border-[#e30613]" /></label>

      <div className="mt-4 grid gap-4 sm:grid-cols-[0.7fr_1.3fr]">
        <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Reference price (MUR)<input name="reference_price" type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Optional" className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm font-bold normal-case tracking-normal text-white outline-none focus:border-[#e30613]" /></label>
        <fieldset><legend className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Open channel</legend><div className="mt-2 grid grid-cols-3 gap-2">{[{ value: "whatsapp", label: "WhatsApp", icon: MessageCircle }, { value: "email", label: "Email", icon: Mail }, { value: "phone", label: "Call", icon: Phone }].map((item) => { const Icon = item.icon; return <label key={item.value} className={`flex h-12 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border text-[10px] font-bold transition ${channel === item.value ? "border-[#e30613] bg-[#e30613] text-white" : "border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.09]"}`}><input type="radio" name="channel" value={item.value} checked={channel === item.value} onChange={() => setChannel(item.value)} className="sr-only" /><Icon className="h-3.5 w-3.5" /> {item.label}</label>; })}</div></fieldset>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-400/15 bg-amber-400/[0.07] p-3 text-[10px] leading-4 text-amber-100/70"><Sparkles className="mr-1 inline h-3.5 w-3.5 text-amber-300" /> This prepares the offer and opens {channel === "whatsapp" ? "WhatsApp" : channel === "email" ? "your email app" : "the phone dialer"}. You review and press send yourself.</div>
      <button type="submit" className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#e30613] px-6 text-sm font-bold text-white shadow-lg shadow-red-950/25 transition hover:-translate-y-0.5 hover:bg-[#ff2432]"><Send className="h-4 w-4" /> Prepare and open {channel === "whatsapp" ? "WhatsApp" : channel === "email" ? "email" : "phone"}</button>
    </form>
  );
}

function buildMessage(customer?: CustomerOption, part?: PartOption) {
  const firstName = customer?.full_name?.split(" ")[0] || "there";
  const vehicle = customer?.vehicles[0] ? `${customer.vehicles[0].year} Suzuki ${customer.vehicles[0].model}` : "Suzuki";
  if (part) return `Hi ${firstName}, we have a special dealer offer on ${part.name} that may suit your ${vehicle}. The reference price is Rs ${Number(part.price).toLocaleString()}. Reply here and we’ll confirm fitment and availability for you. No online payment is required.`;
  return `Hi ${firstName}, we have a special offer selected for your ${vehicle}. Reply here if you’d like the details and our team will help you personally. No online payment is required.`;
}
