import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getCurrentUser } from "./users";
import {
  DAY,
  computeHealth,
  fmtDate,
  getReturnStatus,
  getWarrantyStatus,
  isPriceDrop,
} from "./lib";

const purchaseFields = {
  name: v.string(),
  brand: v.optional(v.string()),
  model: v.optional(v.string()),
  category: v.optional(v.string()),
  merchant: v.optional(v.string()),
  price: v.number(),
  purchaseDate: v.number(),
  warrantyMonths: v.optional(v.number()),
  warrantyExpires: v.optional(v.number()),
  returnWindowDays: v.optional(v.number()),
  returnDeadline: v.optional(v.number()),
  serialNumber: v.optional(v.string()),
  invoiceNumber: v.optional(v.string()),
  orderNumber: v.optional(v.string()),
  notes: v.optional(v.string()),
  image: v.optional(v.string()),
  currentPrice: v.optional(v.number()),
  source: v.optional(v.union(v.literal("scanned"), v.literal("manual"), v.literal("demo"))),
  confidence: v.optional(v.number()),
  lowConfidenceFields: v.optional(v.array(v.string())),
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    return ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("purchases") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const purchase = await ctx.db.get(args.id);
    if (!purchase || purchase.userId !== user._id) return null;
    return purchase;
  },
});

/** Create or update a purchase. Recomputes health score. */
export const upsert = mutation({
  args: {
    id: v.optional(v.string()),
    ...purchaseFields,
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not signed in");

    const now = Date.now();
    const { id, ...data } = args;
    const { score, reason } = computeHealth(data, now);

    if (id) {
      const existing = await ctx.db.get(id as Id<"purchases">);
      if (!existing || existing.userId !== user._id) {
        throw new Error("Purchase not found");
      }
      await ctx.db.patch(id as Id<"purchases">, {
        ...data,
        healthScore: score,
        healthReason: reason,
        updatedAt: now,
      });
      return id;
    }

    return await ctx.db.insert("purchases", {
      userId: user._id,
      ...data,
      category: data.category ?? "Other",
      healthScore: score,
      healthReason: reason,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("purchases") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not signed in");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== user._id) {
      throw new Error("Purchase not found");
    }
    await ctx.db.delete(args.id);
  },
});

type SeedSpec = {
  name: string;
  brand: string;
  model?: string;
  category: string;
  merchant: string;
  price: number;
  daysAgo: number;
  warrantyMonths?: number;
  returnWindowDays?: number;
  serial?: string;
  invoice?: string;
  order?: string;
  image?: string;
  currentPrice?: number;
  notes?: string;
};

const SEED: SeedSpec[] = [
  {
    name: "MacBook Pro 14″",
    brand: "Apple",
    model: "M3 Pro · 18 GB",
    category: "Electronics",
    merchant: "Apple Store",
    price: 1999,
    daysAgo: 320,
    warrantyMonths: 12,
    serial: "FVF53L7XQ9",
    invoice: "INV-90213",
    order: "AP-8842011",
    image: "💻",
    currentPrice: 1849,
    notes: "Primary work machine.",
  },
  {
    name: "iPhone 15 Pro",
    brand: "Apple",
    model: "128 GB · Natural Titanium",
    category: "Electronics",
    merchant: "Apple Store",
    price: 1099,
    daysAgo: 130,
    warrantyMonths: 12,
    serial: "G6XW9K2M4R",
    invoice: "INV-91147",
    image: "📱",
  },
  {
    name: "WH-1000XM5 Headphones",
    brand: "Sony",
    model: "Noise-cancelling",
    category: "Electronics",
    merchant: "Best Buy",
    price: 399,
    daysAgo: 27,
    warrantyMonths: 12,
    returnWindowDays: 30,
    serial: "S21-88431-A",
    invoice: "BB-552301",
    order: "ORD-7718294",
    image: "🎧",
  },
  {
    name: "UltraSharp 27″ 4K Monitor",
    brand: "Dell",
    model: "U2723QE",
    category: "Electronics",
    merchant: "Dell Online",
    price: 549,
    daysAgo: 400,
    warrantyMonths: 12,
    invoice: "INV-73118",
    image: "🖥️",
  },
  {
    name: "WashTower Washer & Dryer",
    brand: "LG",
    model: "WSGX24H",
    category: "Appliances",
    merchant: "Home Depot",
    price: 1299,
    daysAgo: 700,
    warrantyMonths: 24,
    serial: "LG8847WST21",
    invoice: "HD-440129",
    image: "🧺",
    notes: "Free installation included.",
  },
  {
    name: "Apple Watch Series 9",
    brand: "Apple",
    model: "45 mm · Midnight",
    category: "Electronics",
    merchant: "Target",
    price: 429,
    daysAgo: 32,
    warrantyMonths: 12,
    returnWindowDays: 14,
    serial: "W9T3R8K1P2",
    image: "⌚",
  },
  {
    name: "Alpha 7 III Camera",
    brand: "Sony",
    model: "ILCE-7M3 · 24.2 MP",
    category: "Electronics",
    merchant: "B&H Photo",
    price: 1998,
    daysAgo: 540,
    warrantyMonths: 12,
    serial: "BH00713X",
    invoice: "INV-8812-77",
    image: "📷",
    currentPrice: 1749,
  },
  {
    name: "KALLAX Shelf Unit",
    brand: "IKEA",
    model: "4×4 · White",
    category: "Furniture",
    merchant: "IKEA",
    price: 129,
    daysAgo: 200,
    warrantyMonths: 12,
    invoice: "IK-55219",
    image: "🗄️",
  },
  {
    name: "Nano Puff Jacket",
    brand: "Patagonia",
    model: "Men's · Black",
    category: "Fashion",
    merchant: "Patagonia",
    price: 189,
    daysAgo: 190,
    warrantyMonths: 12,
    order: "PG-330124",
    image: "🧥",
  },
  {
    name: "Corolla Hybrid",
    brand: "Toyota",
    model: "2023 · LE",
    category: "Vehicles",
    merchant: "Toyota of Seattle",
    price: 18500,
    daysAgo: 1020,
    warrantyMonths: 36,
    serial: "JTMAAAA33P5",
    invoice: "TOS-55231",
    image: "🚗",
    notes: "Warranty covers powertrain 36 months / 36k miles.",
  },
  {
    name: "Roomba j7+",
    brand: "iRobot",
    model: "Self-emptying",
    category: "Appliances",
    merchant: "Amazon",
    price: 649,
    daysAgo: 55,
    warrantyMonths: 12,
    returnWindowDays: 90,
    serial: "RB-J7-88214",
    order: "AMZ-112-3340921",
    image: "🤖",
    currentPrice: 599,
  },
  {
    name: "Netflix Premium",
    brand: "Netflix",
    model: "4K · Monthly",
    category: "Subscriptions",
    merchant: "Netflix",
    price: 22.99,
    daysAgo: 210,
    order: "NFLX-99102",
    image: "🎬",
    notes: "Recurring subscription.",
  },
];

/** Populate the user's vault with realistic demo purchases. Idempotent. */
export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not signed in");

    const existing = await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    if (existing.length > 0) {
      return { seeded: false, count: existing.length };
    }

    const now = Date.now();
    let count = 0;
    for (const spec of SEED) {
      const purchaseDate = now - spec.daysAgo * DAY;
      const warrantyExpires =
        spec.warrantyMonths != null
          ? purchaseDate + spec.warrantyMonths * 30.44 * DAY
          : undefined;
      const returnDeadline =
        spec.returnWindowDays != null
          ? purchaseDate + spec.returnWindowDays * DAY
          : undefined;

      const health = computeHealth(
        {
          price: spec.price,
          purchaseDate,
          warrantyExpires,
          returnDeadline,
          serialNumber: spec.serial,
          invoiceNumber: spec.invoice,
        },
        now,
      );

      await ctx.db.insert("purchases", {
        userId: user._id,
        name: spec.name,
        brand: spec.brand,
        model: spec.model,
        category: spec.category,
        merchant: spec.merchant,
        price: spec.price,
        purchaseDate,
        warrantyMonths: spec.warrantyMonths,
        warrantyExpires,
        returnWindowDays: spec.returnWindowDays,
        returnDeadline,
        serialNumber: spec.serial,
        invoiceNumber: spec.invoice,
        orderNumber: spec.order,
        notes: spec.notes,
        image: spec.image,
        currentPrice: spec.currentPrice,
        source: "demo",
        confidence: 98,
        healthScore: health.score,
        healthReason: health.reason,
        createdAt: now,
        updatedAt: now,
      });
      count++;
    }
    return { seeded: true, count };
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    if (purchases.length === 0) return null;

    const now = Date.now();
    const totalValue = purchases.reduce((s, p) => s + p.price, 0);
    const protectedValue = purchases
      .filter((p) => getWarrantyStatus(p.warrantyExpires, now) !== "expired" && getWarrantyStatus(p.warrantyExpires, now) !== "none")
      .reduce((s, p) => s + p.price, 0);
    const activeWarranties = purchases.filter(
      (p) => getWarrantyStatus(p.warrantyExpires, now) === "active" || getWarrantyStatus(p.warrantyExpires, now) === "expiring",
    ).length;
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    const deadlinesThisMonth = purchases.filter((p) => {
      const candidates = [p.warrantyExpires, p.returnDeadline].filter(
        (d): d is number => d != null,
      );
      return candidates.some((d) => d >= monthStart.getTime() && d < monthEnd.getTime());
    }).length;
    const potentialSavings = purchases.reduce((s, p) => {
      let v = 0;
      if (isPriceDrop(p)) v += p.price - (p.currentPrice ?? p.price);
      if (getReturnStatus(p.returnDeadline, now) === "open") v += p.price;
      return s + v;
    }, 0);

    return {
      totalValue,
      protectedValue,
      activeWarranties,
      deadlinesThisMonth,
      potentialSavings,
      count: purchases.length,
      monthLabel: monthStart.toLocaleDateString("en-US", { month: "long" }),
      updatedAt: now,
    };
  },
});

export const summary = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const now = Date.now();
    return purchases.map((p) => ({
      id: p._id,
      _id: p._id,
      name: p.name,
      brand: p.brand,
      model: p.model,
      category: p.category,
      merchant: p.merchant,
      price: p.price,
      purchaseDate: p.purchaseDate,
      warrantyExpires: p.warrantyExpires,
      warrantyStatus: getWarrantyStatus(p.warrantyExpires, now),
      returnDeadline: p.returnDeadline,
      returnStatus: getReturnStatus(p.returnDeadline, now),
      healthScore: p.healthScore,
      image: p.image,
      serialNumber: p.serialNumber,
      orderNumber: p.orderNumber,
      invoiceNumber: p.invoiceNumber,
      currentPrice: p.currentPrice,
      hasPriceDrop: isPriceDrop(p),
      warrantyExpiresLabel: p.warrantyExpires != null ? fmtDate(p.warrantyExpires) : null,
    }));
  },
});
