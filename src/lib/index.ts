import {
  EnrichmentData,
  QualificationResult,
  WorkspaceCriteria,
} from "../types";

export async function enrichDomain(domain: string) {
  if (!process.env.PDL_API_KEY) throw new Error("Missing PDL_API_KEY");

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

    if (!response.ok) return null;

    const data = await response.json();
    return {
      employees: data?.employee_count,
      funding: data?.total_funding_raised,
      type: data?.type,
      size: data?.size,
    };
  } catch {
    return null;
  }
}

export function extractDomainFromEmail(email: string) {
  const parts = email.split("@");
  return parts.length === 2 ? parts[1] : null;
}

export function qualifyLead(
  enrichmentData: EnrichmentData | null,
  criteria: WorkspaceCriteria | null,
): QualificationResult {
  // Handle null/missing data
  if (!enrichmentData || !criteria)
    return { result: false, reason: "missing_data" };

  const { employees, funding, type, size } = enrichmentData;
  const { min_employees, min_funding_usd } = criteria;

  // Auto-qualify public companies
  if (type === "public") return { result: true, reason: "public" };

  // Auto-qualify by size bucket
  if (size === "10001+") return { result: true, reason: "size" };

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
