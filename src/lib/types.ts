export type UserRole = "customer" | "admin";

export type PartStatus = "available" | "reserved" | "sold";

export type InquiryStatus = "new" | "contacted" | "closed";

export interface Profile {
  id: string; // Auth UID
  full_name: string | null;
  phone: string | null;
  email: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  owner_id: string;
  make: string;
  model: string;
  year: number;
  registration_no?: string | null;
  created_at: string;
}

export interface Part {
  id: string;
  name: string;
  category: string;
  compatible_models: string[];
  price: number;
  condition_note: string;
  primer_note?: string | null;
  photos: string[];
  status: PartStatus;
  is_offer: boolean;
  part_number?: string | null;
  short_description?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartCategory {
  id: string;
  name: string;
  short_description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type OfferChannel = "whatsapp" | "email" | "phone";
export type OfferStatus = "prepared" | "sent" | "cancelled";

export interface CustomerOffer {
  id: string;
  customer_id: string;
  part_id: string | null;
  title: string;
  message: string;
  reference_price: number | null;
  channel: OfferChannel;
  status: OfferStatus;
  created_by: string | null;
  created_at: string;
  sent_at: string | null;
  customer?: Profile | null;
  part?: Part | null;
}

export interface Inquiry {
  id: string;
  customer_id: string;
  vehicle_id?: string | null;
  part_id: string;
  message?: string | null;
  status: InquiryStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InquiryWithDetails extends Inquiry {
  customer?: Profile | null;
  vehicle?: Vehicle | null;
  part?: Part | null;
}

export interface CarModel {
  id: string;
  name: string;
  tagline: string;
  price_guide: string;
  specs: {
    engine: string;
    transmission: string;
    power: string;
    fuel_economy: string;
    drive_type: string;
  };
  features: string[];
  image_url: string;
  gallery: string[];
  description: string;
  created_at?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  image_url: string;
  published_at: string;
}

export interface ForumThread {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_id?: string | null;
  category: string;
  replies_count: number;
  likes_count: number;
  created_at: string;
}

export interface ForumReply {
  id: string;
  thread_id: string;
  author_name: string;
  author_id?: string | null;
  content: string;
  created_at: string;
}

export interface ContentPost {
  id: string;
  title: string;
  video_url: string;
  caption?: string | null;
  published_at: string;
  created_by?: string;
  created_at?: string;
}

export interface DealerSettings {
  id: string;
  dealer_name: string;
  phone: string;
  whatsapp: string;
  address: string;
  notification_email: string;
  operating_hours: string;
  updated_at: string;
}

export const SUZUKI_MODELS = [
  "Swift",
  "Swift Sport",
  "Jimny (3-Door)",
  "Jimny (5-Door)",
  "Grand Vitara AllGrip Hybrid",
  "Fronx Turbo",
  "Baleno",
  "Brezza",
  "Ertiga",
  "XL6",
  "S-Presso",
  "Celerio",
  "Alto K10",
  "Ignis",
  "S-Cross",
] as const;

export const PART_CATEGORIES = [
  "Body Panels",
  "Engine & Drivetrain",
  "Electrical & Lighting",
  "Suspension & Steering",
  "Brakes & Wheels",
  "Interior & Accessories",
] as const;

export const STANDING_CONDITION_DISCLAIMER =
  "Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal.";
