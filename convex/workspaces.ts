import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const workspaces = await ctx.db.query("Workspaces").collect();
    return workspaces;
  },
});

export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const workspace = await ctx.db
      .query("Workspaces")
      .filter((q) => q.eq(q.field("workspace_name"), name))
      .first();
    return workspace;
  },
});

export const update = mutation({
  args: {
    workspace_name: v.string(),
    booking_url: v.optional(v.string()),
    success_page_url: v.optional(v.string()),
    form_provider: v.optional(v.string()),
    criteria: v.optional(
      v.object({
        min_employees: v.optional(v.number()),
        min_funding_usd: v.optional(v.number()),
        min_revenue_usd: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, { workspace_name, ...updates }) => {
    // First, find the workspace by name to get its ID
    const workspace = await ctx.db
      .query("Workspaces")
      .filter((q) => q.eq(q.field("workspace_name"), workspace_name))
      .first();

    if (!workspace) {
      throw new Error(`Workspace "${workspace_name}" not found`);
    }

    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined),
    );

    // Only patch if there are actual updates
    if (Object.keys(cleanUpdates).length > 0) {
      await ctx.db.patch(workspace._id, cleanUpdates);
    }

    return workspace._id;
  },
});
