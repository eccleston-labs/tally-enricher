import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const insert = mutation({
  args: {
    event: v.string(),
    email: v.string(),
    domain: v.string(),
    workspaceName: v.string(),
    qualified: v.object({
      result: v.boolean(),
      reason: v.string(),
    }),
    ts: v.number(),
    // Accepts any additional fields (optional)
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("Analytics", args);
  },
});
