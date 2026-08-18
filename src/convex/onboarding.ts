import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

export const savePreferences = mutation({
  args: {
    categories: v.array(v.string()),
    priorities: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not signed in");
    await ctx.db.patch(user._id, {
      trackedCategories: args.categories,
      priorities: args.priorities,
      onboardingComplete: true,
    });
    return true;
  },
});
