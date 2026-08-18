import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUser } from "./users";
import {
  DAY,
  fmtDate,
  fmtMoney,
  getReturnStatus,
  getWarrantyStatus,
  isPriceDrop,
  resaleEstimate,
} from "./lib";

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function monthBounds(now: number): [number, number] {
  const start = new Date(now);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return [start.getTime(), end.getTime()];
}

export const ask = query({
  args: { prompt: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return {
        answer:
          "You're not signed in yet. Create an account to let me answer from your purchases.",
        sources: [] as { id: string; name: string; image?: string; note: string }[],
        label: "Nexus OS Intelligence",
      };
    }
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const now = Date.now();
    const q = args.prompt.toLowerCase();

    const source = (p: (typeof purchases)[number], note: string) => ({
      id: p._id,
      name: p.name,
      image: p.image,
      note,
    });
    const sources: { id: string; name: string; image?: string; note: string }[] = [];

    const ws = (p: (typeof purchases)[number]) => getWarrantyStatus(p.warrantyExpires, now);
    const rs = (p: (typeof purchases)[number]) => getReturnStatus(p.returnDeadline, now);

    // --- Warranty expiry -------------------------------------------------
    if (/warrant/.test(q) && /(expir|end|lapse|when|left|due|soon)/.test(q)) {
      const expiring = purchases
        .filter((p) => {
          const s = ws(p);
          return (s === "expiring" || s === "active") && p.warrantyExpires != null;
        })
        .sort((a, b) => (a.warrantyExpires ?? 0) - (b.warrantyExpires ?? 0))
        .slice(0, 6);
      const expired = purchases.filter((p) => ws(p) === "expired");
      if (expiring.length === 0 && expired.length === 0) {
        return {
          answer:
            "You don't have any warranties on file yet. Scan a receipt or add a purchase and I'll track coverage for you.",
          sources,
          label: "Computed from your stored data",
        };
      }
      let answer = "";
      if (expiring.length > 0) {
        const lines = expiring.map((p) => {
          const days = Math.ceil(((p.warrantyExpires ?? 0) - now) / DAY);
          return `• ${p.name} — expires ${fmtDate(p.warrantyExpires)} (${days} day${days === 1 ? "" : "s"} left)`;
        });
        answer = `Here's your warranty coverage, soonest first:\n${lines.join("\n")}\n\n`;
      }
      if (expired.length > 0) {
        answer += `${expired.length} of your purchases have already lost coverage (${expired.map((p) => p.name).join(", ")}).`;
      }
      for (const p of expiring) sources.push(source(p, "Warranty active"));
      return { answer, sources, label: "Computed from your stored data" };
    }

    // --- Can I return X? -------------------------------------------------
    if (/(return|send back|refund)/.test(q)) {
      const match = purchases.find((p) => q.includes(p.name.toLowerCase().split(" ")[0].toLowerCase()) || q.includes(p.name.toLowerCase().split(" ").slice(0, 2).join(" ")));
      const open = purchases.filter((p) => rs(p) === "open" || rs(p) === "closing");
      if (match && match.returnDeadline != null) {
        const s = rs(match);
        const days = Math.ceil((match.returnDeadline - now) / DAY);
        const text =
          s === "open"
            ? `Yes — your return window for ${match.name} is still open. It closes ${fmtDate(match.returnDeadline)} (${days} day${days === 1 ? "" : "s"} left).`
            : s === "closing"
              ? `Yes, but act fast — the return window for ${match.name} closes ${fmtDate(match.returnDeadline)}, only ${days} day${days === 1 ? "" : "s"} away.`
              : `Unfortunately the return window for ${match.name} closed on ${fmtDate(match.returnDeadline)}.`;
        sources.push(source(match, `Return closes ${fmtDate(match.returnDeadline)}`));
        return { answer: text, sources, label: "Computed from your stored data" };
      }
      if (open.length > 0) {
        const lines = open.map((p) => {
          const d = p.returnDeadline!;
          const days = Math.ceil((d - now) / DAY);
          return `• ${p.name} — ${days} day${days === 1 ? "" : "s"} left (closes ${fmtDate(d)})`;
        });
        open.forEach((p) => sources.push(source(p, "Return window open")));
        return {
          answer: `Here's what you can still return:\n${lines.join("\n")}`,
          sources,
          label: "Computed from your stored data",
        };
      }
      return {
        answer: "None of your tracked purchases have an open return window right now.",
        sources,
        label: "Computed from your stored data",
      };
    }

    // --- What's worth selling? -------------------------------------------
    if (/(sell|worth|resale|value now|unwanted|declutter)/.test(q)) {
      const candidates = purchases
        .filter((p) => p.category !== "Subscriptions" && p.price > 50)
        .map((p) => ({ p, resale: resaleEstimate(p, now) }))
        .sort((a, b) => b.resale - a.resale)
        .slice(0, 3);
      if (candidates.length === 0) {
        return {
          answer: "No sellable items found in your vault yet.",
          sources,
          label: "Computed from your stored data",
        };
      }
      const lines = candidates.map(({ p, resale }, i) => {
        const top = i === 0 ? " — best candidate" : "";
        const age = Math.floor((now - p.purchaseDate) / (DAY * 365));
        return `• ${p.name}: est. ${fmtMoney(resale)}${top} (${age} yr${age === 1 ? "" : "s"} old, paid ${fmtMoney(p.price)})`;
      });
      candidates.forEach(({ p, resale }) => sources.push(source(p, `Est. resale ${fmtMoney(resale)}`)));
      return {
        answer: `Rough resale estimates (depreciation model, not appraisals):\n${lines.join("\n")}\n\nIf you're clearing space, ${candidates[0].p.name} gives you the most money back today.`,
        sources,
        label: "Computed from your stored data — estimates only",
      };
    }

    // --- Spending --------------------------------------------------------
    if (/(spend|spent|total|how much|cost|budget)/.test(q)) {
      const total = purchases.reduce((s, p) => s + p.price, 0);
      const byCat = new Map<string, number>();
      for (const p of purchases) byCat.set(p.category, (byCat.get(p.category) ?? 0) + p.price);
      const top = [...byCat.entries()].sort((a, b) => b[1] - a[1]);
      const lines = top.map(([c, v]) => `• ${c}: ${fmtMoney(v)}`);
      for (const [c, v] of top.slice(0, 3)) {
        const p = purchases.find((x) => x.category === c);
        if (p) sources.push(source(p, `${c} spend ${fmtMoney(v)}`));
      }
      return {
        answer: `Across ${purchases.length} tracked purchase${purchases.length === 1 ? "" : "s"} you've spent ${fmtMoney(total)}:\n${lines.join("\n")}`,
        sources,
        label: "Computed from your stored data",
      };
    }

    // --- Protected value -------------------------------------------------
    if (/(protect|coverage|covered|insured|at risk)/.test(q)) {
      const protectedItems = purchases.filter(
        (p) => ws(p) !== "expired" && ws(p) !== "none" && p.category !== "Subscriptions",
      );
      const value = protectedItems.reduce((s, p) => s + p.price, 0);
      const atRisk = purchases.filter((p) => ws(p) === "expired" && p.price > 100);
      let answer = `${fmtMoney(value)} of your stuff is currently covered by a warranty or return protection.`;
      if (atRisk.length > 0) {
        answer += `\n\n${atRisk.map((p) => p.name).join(", ")} ${atRisk.length === 1 ? "has" : "have"} lost coverage — worth ${atRisk.length === 1 ? "an" : ""} eye${atRisk.length === 1 ? "" : "s"} on.`;
      }
      protectedItems.slice(0, 3).forEach((p) => sources.push(source(p, "Covered")));
      return { answer, sources, label: "Computed from your stored data" };
    }

    // --- Upcoming deadlines ----------------------------------------------
    if (/(deadline|due|this month|upcoming|calendar)/.test(q)) {
      const [ms, me] = monthBounds(now);
      const due = purchases.filter((p) => {
        return [p.warrantyExpires, p.returnDeadline].some((d) => d != null && d >= ms && d < me);
      });
      if (due.length === 0) {
        return {
          answer: "Nothing is due this month — enjoy the quiet.",
          sources,
          label: "Computed from your stored data",
        };
      }
      const lines = due.map((p) => {
        const parts: string[] = [];
        if (p.returnDeadline != null && p.returnDeadline >= ms && p.returnDeadline < me)
          parts.push(`return window closes ${fmtDate(p.returnDeadline)}`);
        if (p.warrantyExpires != null && p.warrantyExpires >= ms && p.warrantyExpires < me)
          parts.push(`warranty expires ${fmtDate(p.warrantyExpires)}`);
        return `• ${p.name}: ${parts.join(", ")}`;
      });
      due.forEach((p) => sources.push(source(p, "Deadline this month")));
      return {
        answer: `Deadlines in the next few weeks:\n${lines.join("\n")}`,
        sources,
        label: "Computed from your stored data",
      };
    }

    // --- Health / best or worst item -------------------------------------
    if (/(health|score|best|worst|most valuable|highest)/.test(q)) {
      const scored = purchases.filter((p) => p.healthScore != null);
      if (scored.length === 0) {
        return {
          answer: "Add purchases first, then I'll rank them by ownership health.",
          sources,
          label: "Computed from your stored data",
        };
      }
      const best = [...scored].sort((a, b) => (b.healthScore ?? 0) - (a.healthScore ?? 0))[0];
      const worst = [...scored].sort((a, b) => (a.healthScore ?? 0) - (b.healthScore ?? 0))[0];
      sources.push(source(best, `Health ${best.healthScore}`));
      sources.push(source(worst, `Health ${worst.healthScore}`));
      return {
        answer: `Your healthiest item is ${best.name} (${best.healthScore}/100 — ${best.healthReason}).\n\n${worst.name} scores lowest (${worst.healthScore}/100 — ${worst.healthReason}).`,
        sources,
        label: "Computed from your stored data",
      };
    }

    // --- Price drops -----------------------------------------------------
    if (/(price|deal|cheaper|sale)/.test(q)) {
      const drops = purchases.filter((p) => isPriceDrop(p));
      if (drops.length === 0) {
        return {
          answer: "No tracked item is priced below what you paid right now.",
          sources,
          label: "Computed from your stored data",
        };
      }
      const lines = drops.map((p) => {
        const drop = p.price - p.currentPrice!;
        return `• ${p.name}: ${fmtMoney(p.currentPrice!)} now (${fmtMoney(drop)} below what you paid)`;
      });
      drops.forEach((p) => sources.push(source(p, "Price dropped")));
      return {
        answer: `These items now sell for less than you paid:\n${lines.join("\n")}`,
        sources,
        label: "Computed from your stored data",
      };
    }

    // --- Categorical / fallback ------------------------------------------
    const monthNames = MONTHS.join("|");
    if (new RegExp(monthNames).test(q)) {
      const byCat = new Map<string, number>();
      for (const p of purchases) byCat.set(p.category, (byCat.get(p.category) ?? 0) + p.price);
      const total = purchases.reduce((s, p) => s + p.price, 0);
      const top = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
      if (top) {
        const pct = Math.round((top[1] / total) * 100);
        const p = purchases.find((x) => x.category === top[0]);
        if (p) sources.push(source(p, `${top[0]} · ${pct}% of spend`));
        return {
          answer: `${top[0]} accounts for ${pct}% of your tracked spend (${fmtMoney(top[1])} of ${fmtMoney(total)}). Add more receipts and I'll keep the breakdown current.`,
          sources,
          label: "Computed from your stored data",
        };
      }
    }

    return {
      answer:
        "I can answer from your stored data — try:\n\n• “What warranties expire this month?”\n• “Can I still return my headphones?”\n• “Which product is worth selling?”\n• “How much have I spent on electronics?”\n• “What's protected right now?”\n• “Any price drops?”",
      sources,
      label: "Nexus OS Intelligence · answers from your data",
    };
  },
});
