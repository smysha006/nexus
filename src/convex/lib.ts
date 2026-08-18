/**
 * Pure, dependency-free helpers shared by Convex functions and the client.
 * No convex/server imports here — safe to import from either side.
 */

export const DAY = 86_400_000;

export type WarrantyStatus = "active" | "expiring" | "expired" | "none";
export type ReturnStatus = "open" | "closing" | "closed" | "none";

export function daysUntil(ts?: number, now = Date.now()): number | null {
  if (ts == null) return null;
  return Math.ceil((ts - now) / DAY);
}

export function getWarrantyStatus(
  warrantyExpires?: number,
  now = Date.now(),
): WarrantyStatus {
  if (warrantyExpires == null) return "none";
  const days = daysUntil(warrantyExpires, now)!;
  if (days < 0) return "expired";
  if (days <= 60) return "expiring";
  return "active";
}

export function getReturnStatus(
  returnDeadline?: number,
  now = Date.now(),
): ReturnStatus {
  if (returnDeadline == null) return "none";
  const days = daysUntil(returnDeadline, now)!;
  if (days < 0) return "closed";
  if (days <= 7) return "closing";
  return "open";
}

export interface HealthInput {
  price: number;
  purchaseDate: number;
  warrantyExpires?: number;
  returnDeadline?: number;
  serialNumber?: string;
  invoiceNumber?: string;
}

export function computeHealth(
  p: HealthInput,
  now = Date.now(),
): { score: number; reason: string } {
  let score = 50;
  const factors: string[] = [];

  const ws = getWarrantyStatus(p.warrantyExpires, now);
  if (ws === "active") {
    score += 20;
    factors.push("under active warranty");
  } else if (ws === "expiring") {
    score += 10;
    factors.push("warranty expiring soon");
  } else if (ws === "expired") {
    score -= 10;
    factors.push("warranty expired");
  }

  const rs = getReturnStatus(p.returnDeadline, now);
  if (rs === "open") {
    score += 8;
    factors.push("return window open");
  } else if (rs === "closing") {
    score += 4;
    factors.push("return window closing");
  } else if (rs === "closed") {
    score -= 3;
  }

  const ageYears = (now - p.purchaseDate) / (DAY * 365);
  if (ageYears < 1) {
    score += 8;
    factors.push("recent purchase");
  } else if (ageYears < 3) {
    score += 3;
  }

  if (p.price >= 1000) {
    score += 6;
    factors.push("high-value item");
  } else if (p.price >= 300) {
    score += 3;
  }

  if (p.serialNumber) {
    score += 4;
    factors.push("serial on file");
  }
  if (p.invoiceNumber) score += 3;

  score = Math.max(6, Math.min(98, score));
  const reason =
    factors.length > 0
      ? factors.slice(0, 3).join(", ") +
        (factors.length > 3 ? ` +${factors.length - 3} more` : "")
      : "Limited data — add details to improve the score";

  return { score, reason };
}

/** Rough, clearly-labeled resale estimate. 20% linear depreciation per year. */
export function resaleEstimate(
  p: { price: number; category: string; purchaseDate: number },
  now = Date.now(),
): number {
  const factorByCategory: Record<string, number> = {
    Electronics: 0.55,
    Appliances: 0.4,
    Furniture: 0.35,
    Fashion: 0.3,
    Vehicles: 0.62,
    Other: 0.4,
  };
  const base = p.price * (factorByCategory[p.category] ?? 0.45);
  const years = Math.max(0, (now - p.purchaseDate) / (DAY * 365));
  return Math.max(0, Math.round(base * Math.max(0.15, 1 - years * 0.2)));
}

export function isPriceDrop(
  p: { price: number; currentPrice?: number },
): boolean {
  return (
    p.currentPrice != null &&
    p.currentPrice >= 0 &&
    p.currentPrice < p.price - 0.01
  );
}

export const CURRENCY_META = [
  { code: "INR", symbol: "₹", name: "Indian Rupee", locale: "en-IN" },
  { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  { code: "EUR", symbol: "€", name: "Euro", locale: "en-IE" },
  { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", locale: "ar-AE-u-nu-latn" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", locale: "en-SG" },
] as const;

export type CurrencyCode = (typeof CURRENCY_META)[number]["code"];

export function fmtMoney(n: number, currency: string = "USD"): string {
  const meta = CURRENCY_META.find((c) => c.code === currency);
  return new Intl.NumberFormat(meta?.locale ?? "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function fmtDate(ts?: number): string {
  if (ts == null) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
