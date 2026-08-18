import {
  Armchair,
  Car,
  Cpu,
  Package,
  Refrigerator,
  Repeat,
  Shirt,
  type LucideIcon,
} from "lucide-react";

export const CATEGORIES = [
  "Electronics",
  "Appliances",
  "Furniture",
  "Fashion",
  "Vehicles",
  "Subscriptions",
  "Other",
] as const;

export const CATEGORY_META: Record<
  string,
  { emoji: string; icon: LucideIcon; chip: string; dot: string }
> = {
  Electronics: {
    emoji: "💻",
    icon: Cpu,
    chip: "bg-sky-400/10 text-sky-300 border-sky-400/20",
    dot: "bg-sky-400",
  },
  Appliances: {
    emoji: "🧺",
    icon: Refrigerator,
    chip: "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
    dot: "bg-cyan-400",
  },
  Furniture: {
    emoji: "🛋️",
    icon: Armchair,
    chip: "bg-amber-400/10 text-amber-300 border-amber-400/20",
    dot: "bg-amber-400",
  },
  Fashion: {
    emoji: "🧥",
    icon: Shirt,
    chip: "bg-pink-400/10 text-pink-300 border-pink-400/20",
    dot: "bg-pink-400",
  },
  Vehicles: {
    emoji: "🚗",
    icon: Car,
    chip: "bg-violet-400/10 text-violet-300 border-violet-400/20",
    dot: "bg-violet-400",
  },
  Subscriptions: {
    emoji: "🎬",
    icon: Repeat,
    chip: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
    dot: "bg-emerald-400",
  },
  Other: {
    emoji: "📦",
    icon: Package,
    chip: "bg-slate-400/10 text-slate-300 border-slate-400/20",
    dot: "bg-slate-400",
  },
};

export function categoryMeta(category: string) {
  return CATEGORY_META[category] ?? CATEGORY_META.Other;
}

export interface ExtractedFields {
  name: string;
  brand: string;
  model?: string;
  category: string;
  merchant: string;
  price: number;
  purchaseDate: number;
  warrantyMonths?: number;
  warrantyExpires?: number;
  returnWindowDays?: number;
  returnDeadline?: number;
  serialNumber?: string;
  invoiceNumber?: string;
  orderNumber?: string;
  image?: string;
  currentPrice?: number;
  confidence: number;
  lowConfidence: string[];
}

const DAY = 86_400_000;

interface Sample {
  name: string;
  brand: string;
  model: string;
  category: string;
  merchant: string;
  price: number;
  daysAgo: number;
  warrantyMonths?: number;
  returnWindowDays?: number;
  serial?: string;
  invoice?: string;
  order?: string;
  image: string;
  lowConfidence: string[];
  confidence: number;
}

export const SAMPLE_RECEIPTS: Sample[] = [
  {
    name: "MacBook Air 13″",
    brand: "Apple",
    model: "M3 · 16 GB · Midnight",
    category: "Electronics",
    merchant: "Apple Store",
    price: 1099,
    daysAgo: 6,
    warrantyMonths: 12,
    returnWindowDays: 14,
    serial: "FVLX2K7QR9",
    invoice: "INV-920844",
    order: "AP-8812209",
    image: "💻",
    lowConfidence: ["serialNumber"],
    confidence: 94,
  },
  {
    name: "QuietComfort Ultra Headphones",
    brand: "Bose",
    model: "Noise-cancelling",
    category: "Electronics",
    merchant: "Best Buy",
    price: 349,
    daysAgo: 9,
    warrantyMonths: 12,
    returnWindowDays: 15,
    serial: "BS-QC-U884",
    invoice: "BB-602188",
    image: "🎧",
    lowConfidence: ["returnWindowDays", "warrantyMonths"],
    confidence: 88,
  },
  {
    name: "Kindle Paperwhite",
    brand: "Amazon",
    model: "16 GB · 2024",
    category: "Electronics",
    merchant: "Amazon",
    price: 149.99,
    daysAgo: 12,
    warrantyMonths: 12,
    returnWindowDays: 30,
    order: "AMZ-114-9038451",
    image: "📚",
    lowConfidence: ["warrantyMonths", "serialNumber"],
    confidence: 91,
  },
  {
    name: "LACK Side Table",
    brand: "IKEA",
    model: "Black-brown",
    category: "Furniture",
    merchant: "IKEA",
    price: 59.99,
    daysAgo: 4,
    warrantyMonths: 12,
    returnWindowDays: 180,
    invoice: "IK-774521",
    image: "🪑",
    lowConfidence: ["returnWindowDays"],
    confidence: 96,
  },
  {
    name: "V15 Detect Vacuum",
    brand: "Dyson",
    model: "Cordless · Absolute",
    category: "Appliances",
    merchant: "Costco",
    price: 649.99,
    daysAgo: 18,
    warrantyMonths: 24,
    returnWindowDays: 90,
    serial: "DS-V15-44021",
    invoice: "CS-8821-09",
    image: "🧹",
    lowConfidence: ["warrantyMonths", "serialNumber"],
    confidence: 90,
  },
  {
    name: "Switch OLED",
    brand: "Nintendo",
    model: "White · 64 GB",
    category: "Electronics",
    merchant: "Nintendo Store",
    price: 349.99,
    daysAgo: 2,
    warrantyMonths: 12,
    returnWindowDays: 30,
    serial: "XKW44028817",
    order: "NIN-552901",
    image: "🎮",
    lowConfidence: ["returnWindowDays"],
    confidence: 95,
  },
];

/** Build extracted fields for sample receipt at index. Dates are relative to now. */
export function sampleReceipt(index: number, now = Date.now()): ExtractedFields {
  const s = SAMPLE_RECEIPTS[index % SAMPLE_RECEIPTS.length];
  const purchaseDate = now - s.daysAgo * DAY;
  const warrantyExpires =
    s.warrantyMonths != null
      ? purchaseDate + s.warrantyMonths * 30.44 * DAY
      : undefined;
  const returnDeadline =
    s.returnWindowDays != null
      ? purchaseDate + s.returnWindowDays * DAY
      : undefined;
  return {
    name: s.name,
    brand: s.brand,
    model: s.model,
    category: s.category,
    merchant: s.merchant,
    price: s.price,
    purchaseDate,
    warrantyMonths: s.warrantyMonths,
    warrantyExpires,
    returnWindowDays: s.returnWindowDays,
    returnDeadline,
    serialNumber: s.serial,
    invoiceNumber: s.invoice,
    orderNumber: s.order,
    image: s.image,
    confidence: s.confidence,
    lowConfidence: s.lowConfidence,
  };
}
