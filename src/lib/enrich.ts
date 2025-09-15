// src/lib/enrich.ts
import { fetchPDLByDomain, type PDLCompany } from "./pdl_api";
// import { evaluateWithClaude, type AiDecision } from "./claude_api";
import { evaluateWithSerp, type AiDecision } from "./serp_api";

// ---------- Types ----------
export type Answers = Record<string, string>;

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
  aiDecision?: AiDecision;
  debug?: {
    pdlError?: { status: number; body: unknown } | string;
    claudeError?: string;
    serpError?: string;
  };
}

// ---------- Local helpers for form → domain ----------
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

// Check for revenue criteria
const MIN_REVENUE_USD = 50_000_000;

// ---------- Orchestrator ----------
export async function enrichWithAPIs(answers: Answers): Promise<EnrichedResult> {
  const email = answers["Email Address"]?.trim();
  const companyName = answers["Company Name"]?.trim();
  const seats = toInt(answers["Number of Seats"]);
  const companySize = answers["Company Size"]?.trim() || null;
  const computers = answers["Computers"]?.trim() || null;

  const websiteFromForm = answers["Website"]?.trim() || null;
  const domain = normalizeWebsite(websiteFromForm) || domainFromEmail(email);
  const website = domain ? `https://${domain}` : null;

  const out: EnrichedResult = {
    derived: { email, companyName, seats, companySize, computers, domain, website },
  };

  if (!domain) return out;

  // Run providers in parallel (toggle which ones you want)
  const pdlPromise = (async () => {
    const r = await fetchPDLByDomain(domain);
    if (r.companyEnrichment !== undefined) out.companyEnrichment = r.companyEnrichment;
    if (r.debug?.pdlError) {
      out.debug = { ...(out.debug ?? {}), pdlError: r.debug.pdlError };
    }
  })();

  // const claudePromise = (async () => {
  //   try {
  //     const decision = await evaluateWithClaude(domain);
  //     out.aiDecision = decision;
  //     console.log(
  //       "[Claude] hit",
  //       JSON.stringify(
  //         { queried_domain: domain, status: decision?.status, reason: decision?.reason },
  //         null,
  //         0
  //       )
  //     );
  //   } catch (e: unknown) {
  //     out.aiDecision = null;
  //     out.debug = {
  //       ...(out.debug ?? {}),
  //       claudeError: e instanceof Error ? e.message : String(e),
  //     };
  //   }
  // })();

  const serpPromise = (async () => {
  console.log("[SERP] starting lookup for", domain, "and", companyName);
  try {
    const decision = await evaluateWithSerp(domain, {
      companyName,
      minRevenueUsd: MIN_REVENUE_USD,
      timeoutMs: 9000,
    });
    out.aiDecision = decision;
    console.log(
      "[SERP] done",
      JSON.stringify(
        { queried_domain: domain, queried_company: companyName, status: decision?.status, reason: decision?.reason },
        null,
        0
      )
    );
  } catch (e: unknown) {
    out.aiDecision = null;
    out.debug = { ...(out.debug ?? {}), serpError: e instanceof Error ? e.message : String(e) };
    console.error("[SERP] error", e);
  }
})();


  await Promise.allSettled([pdlPromise, serpPromise]);
  return out;
}
// ---------- Scoring (trusts SERP approval) ----------
function reasonBackedByRevenueOrPress(reason: string): boolean {
  const hasSource = /\([a-z0-9.-]+\)/i.test(reason); // e.g., "(sec.gov)" or "(company.com)"
  const mentionsRevenueNumber =
    /\b(revenue|arr)\b/i.test(reason) &&
    (/[\$£€]?\s?\d{1,3}(?:,\d{3})+/.test(reason) || /\b\d+(\.\d+)?\s*(million|billion)\b/i.test(reason));
  return hasSource && mentionsRevenueNumber;
}

export function scoreLead(enriched: EnrichedResult): { approved: boolean; reason?: string } {
  const toNumber = (v: unknown): number | null =>
    typeof v === "number" && Number.isFinite(v)
      ? v
      : typeof v === "string"
      ? (n => (Number.isFinite(n) ? n : null))(parseFloat(v.replace(/[^\d.]/g, "")))
      : null;

  const empCount =
    typeof enriched.companyEnrichment?.employee_count === "number"
      ? enriched.companyEnrichment.employee_count
      : null;
  const funding = toNumber(enriched.companyEnrichment?.total_funding_raised);

  // PDL gates (unchanged)
  const pdlByEmployees = empCount !== null && empCount > 400;
  const pdlByFunding = funding !== null && funding > 100_000_000;
  const pdlApproved = pdlByEmployees || pdlByFunding;

  // SERP: only trust an "approved" with a proper revenue-style reason
  const ai = enriched.aiDecision;
  const serpApproved = ai?.status === "approved" && ai?.reason && reasonBackedByRevenueOrPress(ai.reason);

  if (pdlApproved || serpApproved) return { approved: true };

  const empPart = empCount === null ? "no employee count" : `${empCount} employees`;
  const fundPart = funding === null ? "no funding" : `$${Math.round(funding).toLocaleString()} funding`;
  const aiPart = ai ? `SERP: ${ai.status}${ai.reason ? ` — ${ai.reason}` : ""}` : "SERP: no decision";

  return { approved: false, reason: `Fails thresholds (${empPart}, ${fundPart}); ${aiPart}` };
}