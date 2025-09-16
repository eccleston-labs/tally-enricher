// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  Workspaces: defineTable({
    workspace_name: v.string(),
    booking_url: v.string(),
    success_page_url: v.string(),
    form_provider: v.string(),
    criteria: v.optional(
      v.object({
        min_employees: v.optional(v.number()),
        min_funding_usd: v.optional(v.number()),
        min_revenue_usd: v.optional(v.number()),
      }),
    ),
  }),
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
  }),
});
