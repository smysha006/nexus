export { fmtDate, fmtMoney, DAY } from "@/convex/lib";

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** "in 3 days", "Today", "2 days ago" */
export function relativeDays(ts?: number, now = Date.now()): string | null {
  if (ts == null) return null;
  const days = Math.round((ts - now) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 0) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}

export function daysLeft(ts?: number, now = Date.now()): number | null {
  if (ts == null) return null;
  return Math.ceil((ts - now) / 86_400_000);
}

export function monthKey(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

export function fullDate(ts?: number): string {
  if (ts == null) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
