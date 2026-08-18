import { useSyncExternalStore } from "react";
import { CURRENCY_META, type CurrencyCode } from "@/convex/lib";

export { CURRENCY_META, type CurrencyCode };

const STORAGE_KEY = "currency";

const EUROZONE = new Set([
  "DE", "FR", "ES", "IT", "PT", "NL", "BE", "AT", "IE", "FI", "GR",
  "LU", "SI", "SK", "HR", "LT", "LV", "EE", "CY", "MT",
]);

/** Pick a sensible default from the browser locale; INR if detection fails. */
function detectCurrency(): CurrencyCode {
  try {
    const lang = navigator.language || "en-IN";
    const [language, region] = lang.split("-");
    const regionUpper = (region ?? language ?? "").toUpperCase();
    if (language?.toLowerCase() === "hi" || regionUpper === "IN") return "INR";
    if (regionUpper === "US") return "USD";
    if (regionUpper === "GB") return "GBP";
    if (regionUpper === "AE") return "AED";
    if (regionUpper === "SG") return "SGD";
    if (EUROZONE.has(regionUpper)) return "EUR";
    return "INR";
  } catch {
    return "INR";
  }
}

function loadCurrency(): CurrencyCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && CURRENCY_META.some((c) => c.code === saved)) {
      return saved as CurrencyCode;
    }
  } catch {
    // localStorage unavailable — fall through to locale detection.
  }
  return detectCurrency();
}

let currentCurrency: CurrencyCode = loadCurrency();
const listeners = new Set<() => void>();

export function getCurrency(): CurrencyCode {
  return currentCurrency;
}

export function setCurrency(code: CurrencyCode): void {
  if (!CURRENCY_META.some((c) => c.code === code)) return;
  currentCurrency = code;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Persistence is best-effort; the in-memory value still applies.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Subscribe to the app-wide currency so components re-render on change. */
export function useCurrency(): {
  currency: CurrencyCode;
  setCurrency: typeof setCurrency;
} {
  const currency = useSyncExternalStore(subscribe, getCurrency);
  return { currency, setCurrency };
}

/** Locale-correct formatting for an amount in the active currency. */
export function formatMoney(n: number, code: CurrencyCode = getCurrency()): string {
  const meta = CURRENCY_META.find((c) => c.code === code);
  return new Intl.NumberFormat(meta?.locale ?? "en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}
