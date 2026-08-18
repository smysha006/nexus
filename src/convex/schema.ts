import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

export const CATEGORIES = [
  "Electronics",
  "Appliances",
  "Furniture",
  "Fashion",
  "Vehicles",
  "Subscriptions",
  "Other",
] as const;

export const PRIORITIES = ["Warranty", "Returns", "Spending", "Resale"] as const;

export const purchaseSourceValidator = v.union(
  v.literal("scanned"),
  v.literal("manual"),
  v.literal("demo"),
);

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),

      // Nexus OS onboarding
      onboardingComplete: v.optional(v.boolean()),
      trackedCategories: v.optional(v.array(v.string())),
      priorities: v.optional(v.array(v.string())),
      readNotifications: v.optional(v.array(v.string())),
    }).index("email", ["email"]),

    // Every product the user owns, one row per purchase.
    purchases: defineTable({
      userId: v.id("users"),
      name: v.string(),
      brand: v.optional(v.string()),
      model: v.optional(v.string()),
      category: v.string(),
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
      source: v.optional(purchaseSourceValidator),
      confidence: v.optional(v.number()),
      lowConfidenceFields: v.optional(v.array(v.string())),
      healthScore: v.optional(v.number()),
      healthReason: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }).index("by_user", ["userId"]),

    // Warranty / support claims drafted by the AI Claim Assistant.
    claims: defineTable({
      userId: v.id("users"),
      purchaseId: v.optional(v.id("purchases")),
      productName: v.string(),
      issue: v.string(),
      status: v.union(v.literal("draft"), v.literal("submitted")),
      eligibility: v.union(
        v.literal("covered"),
        v.literal("expiring"),
        v.literal("expired"),
        v.literal("no-warranty"),
      ),
      draft: v.object({
        customer: v.string(),
        product: v.string(),
        serialNumber: v.optional(v.string()),
        purchaseDate: v.string(),
        warrantyStatus: v.string(),
        warrantyExpires: v.optional(v.string()),
        problem: v.string(),
        subject: v.string(),
        body: v.string(),
      }),
      createdAt: v.number(),
      updatedAt: v.number(),
    }).index("by_user", ["userId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
