import { query } from "./_generated/server";
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
