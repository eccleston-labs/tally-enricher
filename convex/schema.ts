// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  Workspaces: defineTable({
    workspace_name: v.string(),
    booking_url: v.string(),
    success_page_url: v.string(),
    form_provider: v.string(),
    criteria: v.object({
      min_employees: v.optional(v.number()),
      min_funding_usd: v.optional(v.number()),
      min_revenue_usd: v.optional(v.number()),
    }),
    slack_access_token: v.optional(v.string()),   // slack
    slack_channel_id: v.optional(v.string()),
  })
    .index("by_name", ["workspace_name"]),


  Analytics: defineTable({
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

    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    linkedin: v.optional(v.string()),

    jobTitle: v.optional(v.string()),
    companyName: v.optional(v.string()),
    location: v.optional(v.string()),
    // revenue: v.optional(v.number()),
  })
    .index("by_workspaceName", ["workspaceName"]),

  Users: defineTable({
    subject: v.string(),                 // stable auth subject from Clerk
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Relational link to a workspace (one-to-many). Make required if every user must belong.
    workspaceId: v.optional(v.id("Workspaces")),
  })
    .index("by_subject", ["subject"])
    .index("by_workspace", ["workspaceId"]), // list users in a workspace fast
});
