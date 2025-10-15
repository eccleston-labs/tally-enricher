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
    workspace_name: v.string(), // original name
    new_workspace_name: v.optional(v.string()), // new name if changed
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
  handler: async (ctx, { workspace_name, new_workspace_name, ...updates }) => {
    const workspace = await ctx.db
      .query("Workspaces")
      .withIndex("by_name", (q) => q.eq("workspace_name", workspace_name))
      .unique();

    if (!workspace) throw new Error(`Workspace "${workspace_name}" not found`);

    const cleanUpdates: Record<string, unknown> = {
      ...Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined)),
    };

    if (new_workspace_name) {
      cleanUpdates.workspace_name = new_workspace_name;

      // Cascade update analytics rows too
      const analytics = await ctx.db
        .query("Analytics")
        .withIndex("by_workspaceName", (q) => q.eq("workspaceName", workspace_name))
        .collect();

      for (const a of analytics) {
        await ctx.db.patch(a._id, { workspaceName: new_workspace_name });
      }
    }

    if (Object.keys(cleanUpdates).length > 0) {
      await ctx.db.patch(workspace._id, cleanUpdates);
    }

    return workspace._id;
  },
});

export const create = mutation({
  args: {
    workspace_name: v.string(),
    form_provider: v.string(),
    booking_url: v.string(),
    success_page_url: v.string(),
    criteria: v.object({
      min_employees: v.number(),
      min_funding_usd: v.number(),
      min_revenue_usd: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("Workspaces", {
      workspace_name: args.workspace_name,
      form_provider: args.form_provider,
      booking_url: args.booking_url,
      success_page_url: args.success_page_url,
      criteria: args.criteria,
    });
  },
});
