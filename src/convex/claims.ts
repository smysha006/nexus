import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { fmtDate, getWarrantyStatus } from "./lib";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const claims = await ctx.db
      .query("claims")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return claims.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const create = mutation({
  args: {
    purchaseId: v.optional(v.id("purchases")),
    productName: v.string(),
    issue: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not signed in");

    let serial: string | undefined;
    let purchaseDate: number | undefined;
    let warrantyExpires: number | undefined;
    let warrantyStatus = "No warranty on file";

    if (args.purchaseId) {
      const p = await ctx.db.get(args.purchaseId);
      if (!p || p.userId !== user._id) throw new Error("Purchase not found");
      serial = p.serialNumber;
      purchaseDate = p.purchaseDate;
      warrantyExpires = p.warrantyExpires;
      const ws = getWarrantyStatus(p.warrantyExpires);
      warrantyStatus =
        ws === "active"
          ? "Active"
          : ws === "expiring"
            ? "Active — expiring soon"
            : ws === "expired"
              ? "Expired"
              : "No warranty on file";
    }

    const now = Date.now();
    const eligibility = (() => {
      if (warrantyExpires == null) return "no-warranty" as const;
      return getWarrantyStatus(warrantyExpires, now) === "expired"
        ? ("expired" as const)
        : getWarrantyStatus(warrantyExpires, now) === "expiring"
          ? ("expiring" as const)
          : ("covered" as const);
    })();

    const customer = user.name ?? user.email ?? "Customer";
    const product = args.productName;
    const problem = args.issue.trim() || "Product malfunctioning.";
    const subject = `Warranty claim — ${product} — ${problem.slice(0, 60)}`;
    const body = [
      `Dear support team,`,
      ``,
      `I am filing a warranty claim for the following product:`,
      ``,
      `Product: ${product}`,
      `Serial number: ${serial ?? "Not available — will provide upon request"}`,
      `Purchase date: ${purchaseDate != null ? fmtDate(purchaseDate) : "Not on file"}`,
      `Warranty status: ${warrantyStatus}${warrantyExpires != null ? ` (expires ${fmtDate(warrantyExpires)})` : ""}`,
      ``,
      `Issue description:`,
      problem,
      ``,
      `Please let me know what documentation you need and the next steps.`,
      ``,
      `Thank you,`,
      customer,
    ].join("\n");

    const id = await ctx.db.insert("claims", {
      userId: user._id,
      purchaseId: args.purchaseId,
      productName: product,
      issue: problem,
      status: "draft",
      eligibility,
      draft: {
        customer,
        product,
        serialNumber: serial,
        purchaseDate: purchaseDate != null ? fmtDate(purchaseDate) : "Not on file",
        warrantyStatus,
        warrantyExpires: warrantyExpires != null ? fmtDate(warrantyExpires) : undefined,
        problem,
        subject,
        body,
      },
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(id);
  },
});

export const updateStatus = mutation({
  args: { id: v.id("claims"), status: v.union(v.literal("draft"), v.literal("submitted")) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not signed in");
    const claim = await ctx.db.get(args.id);
    if (!claim || claim.userId !== user._id) throw new Error("Claim not found");
    await ctx.db.patch(args.id, { status: args.status, updatedAt: Date.now() });
    return await ctx.db.get(args.id);
  },
});

export const remove = mutation({
  args: { id: v.id("claims") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not signed in");
    const claim = await ctx.db.get(args.id);
    if (!claim || claim.userId !== user._id) throw new Error("Claim not found");
    await ctx.db.delete(args.id);
  },
});
