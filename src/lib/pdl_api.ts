// src/lib/pdl_api.ts
export interface PDLCompany {
  employee_count?: number | null;
  total_funding_raised?: number | string | null;
  [k: string]: unknown;
}

type Debug = { pdlError?: { status: number; body: unknown } | string };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function get<T = unknown>(obj: unknown, key: string): T | undefined {
  return isRecord(obj) ? (obj[key] as T) : undefined;
}

const toNumber = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Look up company by domain using People Data Labs.
 * Returns a partial patch you can merge into your EnrichedResult.
 */
export async function fetchPDLByDomain(
  domain: string,
  { timeoutMs = 9000, apiKey = process.env.PDL_API_KEY }: { timeoutMs?: number; apiKey?: string } = {}
): Promise<{ companyEnrichment: PDLCompany | null; debug?: Debug }> {
  if (!apiKey) throw new Error("Missing PDL_API_KEY");

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);

  try {
    const res = await fetch("https://api.peopledatalabs.com/v5/company/enrich", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
        "User-Agent": "tally-enricher/preview",
      },
      body: JSON.stringify({ website: domain, include_if_matched: true }),
      signal: ac.signal,
    });

    const txt = await res.text();
    let body: unknown = txt;
    try {
      body = txt ? JSON.parse(txt) : null;
    } catch {
      /* leave as text */
    }

    if (!res.ok) {
      return { companyEnrichment: null, debug: { pdlError: { status: res.status, body } } };
    }

    const container = isRecord(body) ? body : null;
    const data =
      (get<Record<string, unknown>>(container, "data") as Record<string, unknown> | undefined) ??
      (container as Record<string, unknown> | null);

    const employee_count = toNumber(get(data, "employee_count"));
    const total_funding_raised = toNumber(get(data, "total_funding_raised"));

    // Structured log (optional)
    const nameVal = get<string>(data, "name") || get<string>(data, "display_name") || null;
    const websiteVal = get<string>(data, "website") || null;
    console.log(
      "[PDL] hit",
      JSON.stringify(
        {
          status: res.status,
          queried_domain: domain,
          name: nameVal,
          website: websiteVal,
          employee_count,
          total_funding_raised,
        },
        null,
        0
      )
    );

    return {
      companyEnrichment: { employee_count, total_funding_raised },
    };
  } catch (e: unknown) {
    return { companyEnrichment: null, debug: { pdlError: e instanceof Error ? e.message : String(e) } };
  } finally {
    clearTimeout(t);
  }
}
