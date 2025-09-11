// src/lib/enrich.ts

// ---------- Types ----------
export type Answers = Record<string, string>;

// Minimal shape we rely on from Abstract; keep it open for extra fields
export interface CompanyEnrichment {
  employee_count?: number;
  [k: string]: unknown;
}

export interface EnrichedResult {
  companyEnrichment?: CompanyEnrichment;
  derived: {
    email?: string;
    companyName?: string;
    seats?: number | null;
    companySize?: string | null;
    computers?: string | null;
    domain?: string | null;
  };
  debug?: {
    companyEnrichmentError?: { status: number; body: unknown } | string;
  };
}

// ---------- Helpers ----------
const toInt = (s?: string): number | null => {
  if (!s) return null;
  const n = parseInt(s.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};

const domainFromEmail = (email?: string | null): string | null => {
  if (!email) return null;
  const m = email.match(/@([^@]+)$/);
  return m ? m[1].toLowerCase() : null;
};

// ---------- Enrichment ----------
export async function enrichWithAbstract(answers: Answers): Promise<EnrichedResult> {
  const API_KEY = process.env.ABSTRACT_API_KEY;
  if (!API_KEY) throw new Error("Missing ABSTRACT_API_KEY");

  const email = answers["Email Address"]?.trim();
  const companyName = answers["Company Name"]?.trim();
  const seats = toInt(answers["Number of Seats"]);
  const companySize = answers["Company Size"]?.trim() || null;
  const computers = answers["Computers"]?.trim() || null;
  const domain = domainFromEmail(email);

  const out: EnrichedResult = {
    derived: { email, companyName, seats, companySize, computers, domain },
  };

  if (!domain) return out; // nothing to enrich without a domain

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 8000); // guard timeout

  try {
    const url = `https://companyenrichment.abstractapi.com/v2/?api_key=${encodeURIComponent(
      API_KEY
    )}&domain=${encodeURIComponent(domain)}`;

    const r = await fetch(url, { signal: ac.signal, cache: "no-store" });
    const txt = await r.text();

    let body: unknown = txt;
    try {
      body = txt ? JSON.parse(txt) : null;
    } catch {
      // leave as text if not JSON
    }

    if (r.ok) {
      out.companyEnrichment = body as CompanyEnrichment;
    } else {
      out.debug = { companyEnrichmentError: { status: r.status, body } };
    }
  } catch (e: unknown) {
    out.debug = {
      companyEnrichmentError: e instanceof Error ? e.message : String(e),
    };
  } finally {
    clearTimeout(t);
  }

  return out;
}

// ---------- Scoring ----------
export function scoreLead(
  enriched: EnrichedResult
): { approved: boolean; reason?: string } {
  const empCount =
    typeof enriched.companyEnrichment?.employee_count === "number"
      ? enriched.companyEnrichment.employee_count
      : null;

  if (empCount === null) {
    return { approved: false, reason: "No employee count available" };
  }
  if (empCount < 1000) {
    return { approved: false, reason: `Too small (${empCount} employees)` };
  }
  return { approved: true };
}
