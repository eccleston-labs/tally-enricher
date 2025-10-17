import { fetchQuery } from "convex/nextjs";
import { Redis } from "@upstash/redis";

import {
  EnrichmentData,
  QualificationResult,
  WorkspaceCriteria,
} from "@/types";
import { api } from "@/convex/_generated/api";
import { DataModel } from "@/convex/_generated/dataModel";

type Workspace = DataModel["Workspaces"]["document"];

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export function extractDomainFromEmail(email: string) {
  const parts = email.split("@");
  return parts.length === 2 ? parts[1] : null;
}

export async function enrichDomain(
  domain: string,
  expiry = 604800,
): Promise<EnrichmentData> {
  if (!process.env.PDL_API_KEY) throw new Error("Missing PDL_API_KEY");

  console.log(`Enriching domain: ${domain}`);

  const cacheKey = `enrichment:${domain}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return cached as EnrichmentData;
  }

  try {
    const response = await fetch(
      "https://api.peopledatalabs.com/v5/company/enrich",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": process.env.PDL_API_KEY,
        },
        body: JSON.stringify({ website: domain }),
      },
    );

    if (!response.ok) {
      console.error("Failed to fetch data from PDL");
      return {
        name: null,
        employees: null,
        funding: null,
        sector: null,
        size: null,
      };
    }

    const data = await response.json();
    console.log("PDL API response:", data);

    const enriched = {
      name: data?.display_name ?? data?.name ?? null,
      employees: data?.employee_count ?? null,
      funding: data?.total_funding_raised ?? null,
      size: data?.size ?? null,
      sector: [data?.industry, data?.industry_v2]
        .filter(Boolean)             // remove wonky nulls
        .join(", ") || null,
      // revenue: data?.annual_revenue ?? null,
    };
    console.log(`PDL enrichment for ${domain}:`, enriched);
    await redis.set(cacheKey, JSON.stringify(enriched), { ex: expiry });
    return enriched;
  } catch (err) {
    console.error("PDL enrichment error:", err);
    return {
      name: null,
      employees: null,
      funding: null,
      sector: null,
      size: null,
    };
  }
}

export function qualifyLead(
  enrichmentData: EnrichmentData,
  criteria: WorkspaceCriteria | null,
): QualificationResult {
  // Handle null/missing data
  if (!enrichmentData || !criteria)
    return { result: false, reason: "missing_data" };

  const { employees, funding, sector, size } = enrichmentData;
  const { min_employees, min_funding_usd } = criteria;

  // Check employee threshold
  if (employees && min_employees && employees >= min_employees)
    return { result: true, reason: "employees" };

  // Check funding threshold
  if (funding && min_funding_usd && funding >= min_funding_usd)
    return { result: true, reason: "funding" };

  // Check revenue threshold - not implemented yet, we aren't getting revenue data
  // if (revenue && min_revenue_usd && revenue >= min_revenue_usd)
  //   return { result: true, reason: "revenue" };

  return { result: false, reason: "no criteria met" };
}

export async function getWorkspaceWithCache(name: string, expiry = 86400) {
  const cacheKey = `workspace:${name}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return cached as Workspace;
  }

  // Fallback to Convex
  const workspace = await fetchQuery(api.workspaces.getByName, { name });

  if (workspace) {
    await redis.set(cacheKey, JSON.stringify(workspace), { ex: expiry });
  }
  return workspace;
}
