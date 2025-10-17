// convex/users.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// Create/update the user row without requiring a workspace
export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const ident = await ctx.auth.getUserIdentity();
    if (!ident) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("Users")
      .withIndex("by_subject", (q) => q.eq("subject", ident.subject))
      .unique();

    const baseFields = {
      email: ident.email ?? undefined,
      name: ident.name ?? undefined,
      imageUrl: (ident.profileUrl ?? ident.pictureUrl) ?? undefined,
      updatedAt: Date.now(),
    } as const;

    if (existing) {
      await ctx.db.patch(existing._id, baseFields);
      return existing._id;
    }

    return await ctx.db.insert("Users", {
      subject: ident.subject,
      createdAt: Date.now(),
      ...baseFields,
      // workspaceId intentionally omitted (left undefined)
    });
  },
});

// Link (or move) the current user to a workspace by name — optional, callable later
export const setMyWorkspaceByName = mutation({
  args: { workspaceName: v.string() },
  handler: async (ctx, { workspaceName }) => {
    const ident = await ctx.auth.getUserIdentity();
    if (!ident) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("Users")
      .withIndex("by_subject", (q) => q.eq("subject", ident.subject))
      .unique();
    if (!user) throw new Error("User row not found. Call ensureUser first.");

    const ws = await ctx.db
      .query("Workspaces")
      .withIndex("by_name", (q) => q.eq("workspace_name", workspaceName))
      .unique();
    if (!ws) throw new Error(`Workspace "${workspaceName}" not found`);

    await ctx.db.patch(user._id, { workspaceId: ws._id, updatedAt: Date.now() });
    return user._id;
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    const ident = await ctx.auth.getUserIdentity();
    if (!ident) return null;

    const user = await ctx.db
      .query("Users")
      .withIndex("by_subject", (q) => q.eq("subject", ident.subject))
      .unique();

    if (!user) return null;

    const workspace = user.workspaceId ? await ctx.db.get(user.workspaceId) : null;

    return {
      user,
      workspace: workspace
        ? {
            // spread only non-sensitive fields
            _id: workspace._id,
            workspace_name: workspace.workspace_name,
            form_provider: workspace.form_provider,
            booking_url: workspace.booking_url,
            success_page_url: workspace.success_page_url,
            criteria: workspace.criteria,
            _creationTime: workspace._creationTime,
            // omit slack_access_token and slack_channel_id
          }
        : null,
    };
  },
});


/** Admin: link a specific user to a specific workspace by IDs. */
export const linkUserToWorkspace = mutation({
  args: {
    userId: v.id("Users"),
    workspaceId: v.id("Workspaces"),
  },
  handler: async (ctx, { userId, workspaceId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const ws = await ctx.db.get(workspaceId);
    if (!ws) throw new Error("Workspace not found");

    await ctx.db.patch(userId, { workspaceId, updatedAt: Date.now() });
    return { userId, workspaceId };
  },
});
