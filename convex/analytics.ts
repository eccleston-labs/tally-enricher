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

// Summary metrics (already used for dashboard top metrics)
export const summaryForWorkspaceName = query({
  args: { workspaceName: v.string() },
  handler: async (ctx, { workspaceName }) => {
    const analytics = await ctx.db
      .query("Analytics")
      .filter((q) => q.eq(q.field("workspaceName"), workspaceName))
      .collect();

    const submissions = analytics.length;
    const qualified = analytics.filter((a) => a.qualified.result).length;

    const employeeValues = analytics
      .map((a) => a.employees)
      .filter((e): e is number => typeof e === "number");

    const omissions = submissions - employeeValues.length;

    const avgEmployees =
      employeeValues.length > 0
        ? Math.round(
            employeeValues.reduce((sum, e) => sum + e, 0) / employeeValues.length
          )
        : null;

    return {
      submissions,
      qualified,
      avgEmployees, // null if no data
      omissions,
    };
  },
});

// Analytics tab deep insights
export const insightsForWorkspaceName = query({
  args: { workspaceName: v.string() },
  handler: async (ctx, { workspaceName }) => {
    const analytics = await ctx.db
      .query("Analytics")
      .filter((q) => q.eq(q.field("workspaceName"), workspaceName))
      .collect();

    if (analytics.length === 0) {
      return {
        qualifiedPct: 0,
        avgQualifiedEmployees: null,
        mostCommonSector: null,
        avgFunding: null,
        fundingOmissions: 0,
      };
    }

    const qualified = analytics.filter((a) => a.qualified.result);
    const qualifiedPct = Math.round(
      (qualified.length / analytics.length) * 100
    );

    const qualifiedEmployees = qualified
      .map((a) => a.employees)
      .filter((e): e is number => typeof e === "number");

    const avgQualifiedEmployees =
      qualifiedEmployees.length > 0
        ? Math.round(
            qualifiedEmployees.reduce((sum, e) => sum + e, 0) /
              qualifiedEmployees.length
          )
        : null;

    // Find most common sector
    const sectorCounts: Record<string, number> = {};
    for (const a of analytics) {
      if (a.sector) {
        const sectors = a.sector
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s.length > 0);
        for (const sector of sectors) {
          sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
        }
      }
    }

    const mostCommonSector =
      Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    // Average funding
    const fundingValues = analytics
      .map((a) => a.funding)
      .filter((f): f is number => typeof f === "number");
    const fundingOmissions = analytics.length - fundingValues.length;
    const avgFunding =
      fundingValues.length > 0
        ? Math.round(
            fundingValues.reduce((sum, f) => sum + f, 0) / fundingValues.length
          )
        : null;

    return {
      qualifiedPct,             // % of submissions that were qualified
      avgQualifiedEmployees,    // avg company size of qualified leads
      mostCommonSector,         // most common vertical/sector
      avgFunding,               // avg funding raised
      fundingOmissions,         // how many rows omitted due to missing funding
    };
  },
});
