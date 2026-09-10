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
  created_at: string;
  updated_at: string;
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

export interface ContentPost {
  id: string;
  title: string;
  video_url: string;
  caption?: string | null;
  published_at: string;
  created_by?: string | null;
  created_at: string;
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
  "Grand Vitara",
  "Baleno",
  "Brezza",
  "Ertiga",
  "XL6",
  "Fronx",
  "Alto",
  "Alto K10",
  "Celerio",
  "Ignis",
  "S-Cross",
  "Ciaz",
] as const;

export const PART_CATEGORIES = [
  "Body Panels",
  "Engine & Drivetrain",
  "Electrical & Lighting",
  "Suspension & Steering",
  "Brakes & Wheels",
  "Interior & Trim",
  "Maintenance & Fluids",
] as const;

export const STANDING_CONDITION_DISCLAIMER =
  "Price shown is for reference. Body parts ship in gray primer — minor dents/scratches before painting are normal.";
