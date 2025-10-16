import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// --- Queries ---
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

// --- Mutations ---
export const update = mutation({
  args: {
    workspace_name: v.string(), // current/original name
    new_workspace_name: v.optional(v.string()), // new name if changed
    booking_url: v.optional(v.string()),
    success_page_url: v.optional(v.string()),
    form_provider: v.optional(v.string()),
    criteria: v.optional(
      v.object({
        min_employees: v.optional(v.number()),
        min_funding_usd: v.optional(v.number()),
        min_revenue_usd: v.optional(v.number()),
      })
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
      // Check for conflicts
      const conflict = await ctx.db
        .query("Workspaces")
        .withIndex("by_name", (q) => q.eq("workspace_name", new_workspace_name))
        .first();

      if (conflict) {
        throw new Error(`Workspace name "${new_workspace_name}" is already taken`);
      }

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
    await ctx.db.insert("Workspaces", args);
  },
});

export const createAndLink = mutation({
  args: {
    workspace_name: v.string(),
    form_provider: v.optional(v.string()),
    booking_url: v.optional(v.string()),
    success_page_url: v.optional(v.string()),
    criteria: v.optional(
      v.object({
        min_employees: v.optional(v.number()),
        min_funding_usd: v.optional(v.number()),
        min_revenue_usd: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Use the "subject" field from your Users table
    const user = await ctx.db
      .query("Users")
      .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Ensure workspace name isn’t already taken
    const conflict = await ctx.db
      .query("Workspaces")
      .withIndex("by_name", (q) => q.eq("workspace_name", args.workspace_name))
      .first();
    if (conflict) throw new Error(`Workspace name "${args.workspace_name}" is already taken`);

    // Create new workspace
    const workspaceId = await ctx.db.insert("Workspaces", {
      workspace_name: args.workspace_name,
      form_provider: args.form_provider ?? "",
      booking_url: args.booking_url ?? "",
      success_page_url: args.success_page_url ?? "",
      criteria: args.criteria ?? {},
    });

    // Link workspace to the user
    await ctx.db.patch(user._id, { workspaceId });

    return workspaceId;
  },
});

export const setSlackToken = mutation({
  args: {
    workspace_name: v.string(),
    slack_access_token: v.string(),
  },
  handler: async (ctx, { workspace_name, slack_access_token }) => {
    const ws = await ctx.db
      .query("Workspaces")
      .withIndex("by_name", (q) => q.eq("workspace_name", workspace_name))
      .unique();

    if (!ws) throw new Error(`Workspace "${workspace_name}" not found`);

    await ctx.db.patch(ws._id, { slack_access_token });
    return ws._id;
  },
});

