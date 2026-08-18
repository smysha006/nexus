import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { DAY, getReturnStatus, getWarrantyStatus, isPriceDrop } from "./lib";

export type NotificationKind =
  | "return"
  | "warranty"
  | "price"
  | "claim"
  | "info";

export interface DerivedNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  purchaseId: string;
  deadline?: number;
  read: boolean;
}

/**
 * Notifications are derived live from the user's purchases, so they always
 * reflect the current state (deadlines, price drops, missing details).
 * Read state is stored on the user document.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const now = Date.now();
    const readSet = new Set(user.readNotifications ?? []);
    const items: DerivedNotification[] = [];
    const push = (n: Omit<DerivedNotification, "read">) => {
      items.push({ ...n, read: readSet.has(n.id) });
    };

    // Claims the user has started (from the claims table).
    const claims = await ctx.db
      .query("claims")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const c of claims) {
      if (c.status === "draft") {
        push({
          id: `claim-${c._id}`,
          kind: "claim",
          title: "Claim draft ready",
          message: `Your ${c.productName} claim draft is ready to review and send.`,
          purchaseId: c.purchaseId ?? "",
        });
      }
    }

    // Deadline and data-quality signals, most urgent first.
    const signals: DerivedNotification[] = [];
    for (const p of purchases) {
      const ws = getWarrantyStatus(p.warrantyExpires, now);
      const rs = getReturnStatus(p.returnDeadline, now);

      if (rs === "closing") {
        const d = p.returnDeadline!;
        const days = Math.ceil((d - now) / DAY);
        signals.push({
          id: `return-${p._id}`,
          kind: "return",
          title: "Return window closing",
          message: `Return ${p.name} by ${new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${days} day${days === 1 ? "" : "s"} left.`,
          purchaseId: p._id,
          deadline: d,
          read: false,
        });
      }
      if (ws === "expiring") {
        const d = p.warrantyExpires!;
        const days = Math.ceil((d - now) / DAY);
        signals.push({
          id: `warranty-${p._id}`,
          kind: "warranty",
          title: "Warranty expiring soon",
          message: `${p.name} warranty expires in ${days} days. File any claims before it lapses.`,
          purchaseId: p._id,
          deadline: d,
          read: false,
        });
      }
      if (ws === "expired") {
        const daysSince = Math.floor((now - p.warrantyExpires!) / DAY);
        if (daysSince <= 180) {
          signals.push({
            id: `warranty-expired-${p._id}`,
            kind: "info",
            title: "Warranty expired",
            message: `Coverage for ${p.name} lapsed ${daysSince} day${daysSince === 1 ? "" : "s"} ago. Repairs are now out of pocket.`,
            purchaseId: p._id,
            deadline: p.warrantyExpires,
            read: false,
          });
        }
      }
      if (isPriceDrop(p)) {
        const drop = p.price - p.currentPrice!;
        signals.push({
          id: `price-${p._id}`,
          kind: "price",
          title: "Price dropped",
          message: `${p.name} now sells for ${(p.price - drop).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} — $${drop.toFixed(0)} below what you paid.`,
          purchaseId: p._id,
          read: false,
        });
      }
      if (!p.serialNumber && p.price >= 200 && p.category !== "Subscriptions") {
        signals.push({
          id: `missing-${p._id}`,
          kind: "info",
          title: "Missing serial number",
          message: `Add the serial number for ${p.name} so warranty claims stay smooth.`,
          purchaseId: p._id,
          read: false,
        });
      }
    }

    // Claim-ready: active coverage on high-value items, top 2 by price.
    const claimReady = purchases
      .filter((p) => {
        const ws = getWarrantyStatus(p.warrantyExpires, now);
        return (ws === "active" || ws === "expiring") && p.price >= 400;
      })
      .sort((a, b) => b.price - a.price)
      .slice(0, 2);
    for (const p of claimReady) {
      signals.push({
        id: `claim-ready-${p._id}`,
        kind: "claim",
        title: "Claim-ready",
        message: `${p.name} is protected and eligible for a warranty claim if anything goes wrong.`,
        purchaseId: p._id,
        read: false,
      });
    }

    signals.sort((a, b) => {
      const rank = { return: 0, warranty: 1, price: 2, claim: 3, info: 4 };
      return rank[a.kind] - rank[b.kind] || (a.deadline ?? 0) - (b.deadline ?? 0);
    });

    for (const s of signals.slice(0, 10)) push(s);
    return items;
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return 0;
    const readSet = new Set(user.readNotifications ?? []);
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const now = Date.now();
    let count = 0;
    for (const p of purchases) {
      const ws = getWarrantyStatus(p.warrantyExpires, now);
      const rs = getReturnStatus(p.returnDeadline, now);
      const candidates: string[] = [];
      if (rs === "closing") candidates.push(`return-${p._id}`);
      if (ws === "expiring") candidates.push(`warranty-${p._id}`);
      if (isPriceDrop(p)) candidates.push(`price-${p._id}`);
      if (!p.serialNumber && p.price >= 200 && p.category !== "Subscriptions")
        candidates.push(`missing-${p._id}`);
      for (const id of candidates) if (!readSet.has(id)) count++;
    }
    const claims = await ctx.db
      .query("claims")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const c of claims) {
      if (c.status === "draft" && !readSet.has(`claim-${c._id}`)) count++;
    }
    return count;
  },
});

export const markRead = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return;
    const read = new Set(user.readNotifications ?? []);
    read.add(args.id);
    await ctx.db.patch(user._id, { readNotifications: [...read] });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return;
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const now = Date.now();
    const ids: string[] = [];
    for (const p of purchases) {
      const ws = getWarrantyStatus(p.warrantyExpires, now);
      const rs = getReturnStatus(p.returnDeadline, now);
      if (rs === "closing") ids.push(`return-${p._id}`);
      if (ws === "expiring") ids.push(`warranty-${p._id}`);
      if (isPriceDrop(p)) ids.push(`price-${p._id}`);
      if (!p.serialNumber && p.price >= 200 && p.category !== "Subscriptions")
        ids.push(`missing-${p._id}`);
      if (ws !== "expired" || now - p.warrantyExpires! <= 180 * DAY) {
        // include expired signal id when recent
        if (ws === "expired" && now - p.warrantyExpires! <= 180 * DAY)
          ids.push(`warranty-expired-${p._id}`);
      }
    }
    const claims = await ctx.db
      .query("claims")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const c of claims) {
      if (c.status === "draft") ids.push(`claim-${c._id}`);
    }
    const read = new Set([...(user.readNotifications ?? []), ...ids]);
    await ctx.db.patch(user._id, { readNotifications: [...read] });
  },
});
