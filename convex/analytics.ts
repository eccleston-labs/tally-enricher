// convex/analytics.ts
import { mutation, query } from "./_generated/server";
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

    employees: v.optional(v.number()),
    funding: v.optional(v.number()),
    sector: v.optional(v.string()),
    size: v.optional(v.string()),
    // revenue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("Analytics", args);
  },
});

/**
 * Return quick metrics for a given workspaceName:
 * - submissions: total rows
 * - qualified: rows with qualified.result === true
 */
export const summaryForWorkspaceName = query({
  args: { workspaceName: v.string() },
  handler: async (ctx, { workspaceName }) => {
    const rows = await ctx.db
      .query("Analytics")
      .filter((q) => q.eq(q.field("workspaceName"), workspaceName))
      .collect();

    const submissions = rows.length;
    const qualified = rows.reduce(
      (acc, r) => acc + (r.qualified?.result === true ? 1 : 0),
      0
    );

    return { submissions, qualified };
  },
});
