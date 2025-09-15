// src/lib/enrich.ts
import { fetchPDLByDomain, type PDLCompany } from "./pdl_api";
import { evaluateWithClaude, type AiDecision } from "./claude_api";

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

// ---------- Orchestrator ----------
export async function enrichWithAbstract(answers: Answers): Promise<EnrichedResult> {
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

  const claudePromise = (async () => {
    try {
      const decision = await evaluateWithClaude(domain);
      out.aiDecision = decision;
      console.log(
        "[Claude] hit",
        JSON.stringify(
          { queried_domain: domain, status: decision?.status, reason: decision?.reason },
          null,
          0
        )
      );
    } catch (e: unknown) {
      out.aiDecision = null;
      out.debug = {
        ...(out.debug ?? {}),
        claudeError: e instanceof Error ? e.message : String(e),
      };
    }
  })();

  await Promise.allSettled([pdlPromise, claudePromise]);
  return out;
}

// ---------- Scoring (unchanged) ----------
function reasonBackedByRevenueOrPress(reason: string): boolean {
  const hasSource = /\([a-z0-9.-]+\)/i.test(reason); // e.g., "(sec.gov)"
  const mentionsRevenueNumber =
    /\b(revenue|arr)\b/i.test(reason) &&
    (/[\$£€]?\s?\d{1,3}(?:,\d{3})+/.test(reason) || /\b\d+(\.\d+)?\s*(million|billion)\b/i.test(reason));
  const mentionsPressVolume =
    /≥\s*\d+\s*reputable articles/i.test(reason) || /\b(past\s+12\s+months)\b/i.test(reason);
  return hasSource && (mentionsRevenueNumber || mentionsPressVolume);
}

export function scoreLead(
  enriched: EnrichedResult
): { approved: boolean; reason?: string } {
  const empCount =
    typeof enriched.companyEnrichment?.employee_count === "number"
      ? enriched.companyEnrichment.employee_count
      : null;

  const funding = toNumber(enriched.companyEnrichment?.total_funding_raised);

  const pdlByEmployees = empCount !== null && empCount > 400;
  const pdlByFunding = funding !== null && funding > 100_000_000;
  const pdlApproved = pdlByEmployees || pdlByFunding;

  const ai = enriched.aiDecision;
  const aiApproved =
    ai?.status === "approved" && ai?.reason && reasonBackedByRevenueOrPress(ai.reason);

  if (pdlApproved || aiApproved) return { approved: true };

  const empPart = empCount === null ? "no employee count" : `${empCount} employees`;
  const fundPart = funding === null ? "no funding" : `$${Math.round(funding).toLocaleString()} funding`;
  const aiPart = ai ? `AI: ${ai.status}${ai.reason ? ` — ${ai.reason}` : ""}` : "AI: no decision";

  return { approved: false, reason: `Fails thresholds (${empPart}, ${fundPart}); ${aiPart}` };
}
