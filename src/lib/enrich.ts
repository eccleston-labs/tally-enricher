// src/lib/enrich.ts

// ---------- Types ----------
export type Answers = Record<string, string>;

export interface PDLCompany {
  employee_count?: number | null;
  total_funding_raised?: number | string | null;
  [k: string]: unknown;
}

export interface EnrichedResult {
  companyEnrichment?: PDLCompany | null;
  derived: {
    email?: string;
    companyName?: string;
    seats?: number | null;
    companySize?: string | null;
    computers?: string | null;
    domain?: string | null;
    website?: string | null;
  };
  debug?: {
    pdlError?: { status: number; body: unknown } | string;
  };
}

// ---------- Helpers ----------
const toInt = (s?: string): number | null => {
  if (!s) return null;
  const n = parseInt(s.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};

const toNumber = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const domainFromEmail = (email?: string | null): string | null => {
  if (!email) return null;
  const m = email.match(/@([^@]+)$/);
  return m ? m[1].toLowerCase() : null;
};

const normalizeWebsite = (input?: string | null): string | null => {
  if (!input) return null;
  try {
    const url = new URL(input.startsWith("http") ? input : `https://${input}`);
    return url.hostname.toLowerCase();
  } catch {
    return input.toLowerCase();
  }
};

// ---------- Enrichment (PDL) ----------
export async function enrichWithAbstract(answers: Answers): Promise<EnrichedResult> {
  // Kept the exported function name so your imports don’t change.
  const API_KEY = process.env.PDL_API_KEY;
  if (!API_KEY) throw new Error("Missing PDL_API_KEY");

  const email = answers["Email Address"]?.trim();
  const companyName = answers["Company Name"]?.trim();
  const seats = toInt(answers["Number of Seats"]);
  const companySize = answers["Company Size"]?.trim() || null;
  const computers = answers["Computers"]?.trim() || null;

  // Prefer an explicit Website field if you add one; else derive from email
  const websiteFromForm = answers["Website"]?.trim() || null;
  const domain = normalizeWebsite(websiteFromForm) || domainFromEmail(email);
  const website = domain ? `https://${domain}` : null;

  const out: EnrichedResult = {
    derived: { email, companyName, seats, companySize, computers, domain, website },
  };

  if (!domain) return out; // nothing to enrich without a domain/website

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 9000);

  try {
    const res = await fetch("https://api.peopledatalabs.com/v5/company/enrich", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": API_KEY,
        "User-Agent": "tally-enricher/preview",
      },
      body: JSON.stringify({
        website: domain,          // PDL recommends domain for company enrich
        include_if_matched: true, // per your curl
      }),
      signal: ac.signal,
    });

    console.log(res)

    // after: const res = await fetch(...)

    const txt = await res.text();
    let body: unknown = txt;
    try { body = txt ? JSON.parse(txt) : null; } catch { /* ignore */ }

    // Typical PDL shape: { status: 200, data: {...} }
    if (res.ok) {
      const data = (body && (body as any).data) || body;

      // assign enrichment
      out.companyEnrichment = (data ?? null) as PDLCompany | null;

      // ---- STRUCTURED SERVER LOG (shows in Vercel Functions logs) ----
      const name =
        (data as any)?.name ??
        (data as any)?.display_name ??
        null;
      const websiteField =
        (data as any)?.website ??
        (data as any)?.domain ??
        out.derived.website ??
        null;
      const emp = (data as any)?.employee_count ?? null;
      const funding = (data as any)?.total_funding_raised ?? null;

      console.log(
        "[PDL] hit",
        JSON.stringify(
          {
            status: res.status,
            queried_domain: domain,
            name,
            website: websiteField,
            employee_count: emp,
            total_funding_raised: funding,
          },
          null,
          0
        )
      );
    } else {
      // log failures so you can see them in prod
      console.warn(
        "[PDL] error",
        JSON.stringify(
          { status: res.status, queried_domain: domain, preview: String(txt).slice(0, 300) },
          null,
          0
        )
      );
      out.debug = { pdlError: { status: res.status, body } };
      out.companyEnrichment = null;
    }

  } catch (e: unknown) {
    out.debug = { pdlError: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(t);
  }

  return out;
}

// ---------- Scoring ----------
export function scoreLead(
  enriched: EnrichedResult
): { approved: boolean; reason?: string } {
  const empCount = typeof enriched.companyEnrichment?.employee_count === "number"
    ? enriched.companyEnrichment.employee_count!
    : null;

  const funding = toNumber(enriched.companyEnrichment?.total_funding_raised);

  const passByEmployees = empCount !== null && empCount > 400;
  const passByFunding = funding !== null && funding > 1_000_000_000;

  if (passByEmployees || passByFunding) {
    return { approved: true };
  }

  // Nice rejection reason for debugging/Clay
  const empPart = empCount === null ? "no employee count" : `${empCount} employees`;
  const fundPart = funding === null ? "no funding" : `$${Math.round(funding).toLocaleString()} funding`;
  return { approved: false, reason: `Fails thresholds (${empPart}, ${fundPart})` };
}
