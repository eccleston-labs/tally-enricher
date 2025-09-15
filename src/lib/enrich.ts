// ---------- Types ----------
export type Answers = Record<string, string>;

export interface PDLCompany {
  employee_count?: number | null;
  total_funding_raised?: number | string | null;
  [k: string]: unknown;
}

export type AiDecision =
  | { status: "approved" | "rejected" | "unsure"; reason: string }
  | null;

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

// ---------- Claude prompt (single input: domain) ----------
// Claude should evaluate ONLY revenue/news—not employees, not funding.
export const CLAUDE_PROMPT_REVENUE_ONLY = ({
  domain,
  minRevenueUsd = 10_000_000,  // tune
  minRecentArticles = 5,       // tune (past 12 months)
}: {
  domain: string;
  minRevenueUsd?: number;
  minRecentArticles?: number;
}) => `
You are a conservative evaluator. You MAY browse the web.
Use ONLY revenue information and reputable press volume. IGNORE headcount and funding.

Decision rubric (STRICT):
- APPROVE if you can cite a reputable source that states the company's annual revenue (ARR or fiscal revenue) is >= $${minRevenueUsd.toLocaleString()} USD, with a date.
- APPROVE if you find strong press volume: at least ${minRecentArticles} distinct reputable outlets (e.g., Bloomberg, WSJ, FT, CNBC, TechCrunch, The Verge, company IR/10-K) in the last 12 months, AND at least one mentions paying customers, revenue scale, or commercial traction. Still IGNORE employee counts and funding.
- REJECT if sources indicate it is a non-profit, personal site, student project, parked domain, or no evidence of commercial revenue/traction.
- UNSURE if you cannot find reputable, recent sources about revenue or commercial traction.

Search protocol:
1) Try: "${domain} revenue", "${domain} ARR", "site:${domain} investors", "${domain} 10-k", "${domain} press".
2) Prefer primary sources (10-K/IR) and high-quality media. Avoid wikis without citations, low-quality blogs, AI-written sites.
3) Extract the most recent figures and include month/year.

Output format (critical):
Respond ONLY in strict JSON:
{
  "status": "approved | rejected | unsure",
  "reason": "max 2 sentences, include at least one quantitative revenue/traction signal OR the phrase '≥ ${minRecentArticles} reputable articles (past 12 months)', and include the primary source domain(s) in parentheses."
}

Do not mention headcount or funding. Do not guess. If uncertain, return "unsure".

Input domain: ${domain}
`;


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

// tiny type-safe accessors
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function get<T = unknown>(obj: unknown, key: string): T | undefined {
  return isRecord(obj) ? (obj[key] as T) : undefined;
}

// ---------- Claude helper ----------
async function evaluateWithClaude(
  domain: string,
  timeoutMs = 9000
): Promise<AiDecision> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY");

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);

  try {
    const body = {
      model: "claude-3-5-sonnet-latest",
      max_tokens: 256,
      system: "Only output valid JSON. Do not include markdown, code fences, or any extra text.",
      messages: [
        {
          role: "user",
          content: CLAUDE_PROMPT_REVENUE_ONLY({
            domain,
            minRevenueUsd: 10_000_000,     // tune
            minRecentArticles: 5,          // tune
          }),
        },
      ],
      // If your Anthropic SDK supports it, turn on JSON mode:
      // response_format: { type: "json_object" },
    };

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: ac.signal,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = await res.json().catch(() => ({}));
    const text =
      raw?.content?.[0]?.text ??
      raw?.output_text ??
      "";

    if (!text) return { status: "unsure", reason: "Empty response from model." };

    try {
      const parsed = JSON.parse(text);
      const status = typeof parsed?.status === "string" ? parsed.status.toLowerCase() : "";
      const reason = typeof parsed?.reason === "string" ? parsed.reason : "";

      if (status === "approved" || status === "rejected" || status === "unsure") {
        return { status, reason };
      }
      return { status: "unsure", reason: "Non-conforming status from model." };
    } catch {
      return { status: "unsure", reason: "Model did not return parseable JSON." };
    }
  } finally {
    clearTimeout(t);
  }
}

// ---------- Enrichment (PDL) ----------
export async function enrichWithAbstract(answers: Answers): Promise<EnrichedResult> {
  const PDL_API_KEY = process.env.PDL_API_KEY;
  if (!PDL_API_KEY) throw new Error("Missing PDL_API_KEY");

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

  if (!domain) return out; // cannot enrich or evaluate without a domain

  // If your eslint bans console, uncomment next line for just this file.
  // /* eslint-disable no-console */

  // Fire both in parallel
  const pdlPromise = (async (): Promise<void> => {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 9000);
    try {
      const res = await fetch("https://api.peopledatalabs.com/v5/company/enrich", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": PDL_API_KEY,
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

      if (res.ok) {
        const container = isRecord(body) ? body : null;
        const data =
          (get<Record<string, unknown>>(container, "data") as
            | Record<string, unknown>
            | undefined) ?? (container as Record<string, unknown> | null);

        const employee_count = toNumber(get(data, "employee_count"));
        const total_funding_num = toNumber(get(data, "total_funding_raised"));

        out.companyEnrichment = {
          employee_count,
          total_funding_raised: total_funding_num,
        };

        const nameVal = get<string>(data, "name");
        const displayNameVal = get<string>(data, "display_name");
        const websiteVal = get<string>(data, "website");
        const name = nameVal || displayNameVal || null;
        const websiteField = websiteVal || out.derived.website || null;

        console.log(
          "[PDL] hit",
          JSON.stringify(
            {
              status: res.status,
              queried_domain: domain,
              name,
              website: websiteField,
              employee_count,
              total_funding_raised: total_funding_num,
            },
            null,
            0
          )
        );
      } else {
        out.debug = { ...(out.debug ?? {}), pdlError: { status: res.status, body } };
        out.companyEnrichment = null;
      }
    } catch (e: unknown) {
      out.debug = {
        ...(out.debug ?? {}),
        pdlError: e instanceof Error ? e.message : String(e),
      };
    } finally {
      clearTimeout(t);
    }
  })();

  const claudePromise = (async (): Promise<void> => {
    try {
      const decision = await evaluateWithClaude(domain);
      out.aiDecision = decision;

      // ---- Structured server log (Claude AI Decision) ----
      console.log(
        "[Claude] hit",
        JSON.stringify(
          {
            queried_domain: domain,
            status: decision?.status,
            reason: decision?.reason,
          },
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

// Helper for llm reason
function reasonBackedByRevenueOrPress(reason: string): boolean {
  const hasSource = /\([a-z0-9.-]+\)/i.test(reason); // e.g., "(sec.gov)"
  const mentionsRevenueNumber =
    /\b(revenue|arr)\b/i.test(reason) && /[\$£€]?\s?\d{1,3}(,\d{3})+|\b\d+(\.\d+)?\s*(million|billion)\b/i.test(reason);
  const mentionsPressVolume =
    /≥\s*\d+\s*reputable articles/i.test(reason) || /\b(past\s+12\s+months)\b/i.test(reason);
  return hasSource && (mentionsRevenueNumber || mentionsPressVolume);
}
// ---------- Scoring ----------
export function scoreLead(
  enriched: EnrichedResult
): { approved: boolean; reason?: string } {
  const empCount =
    typeof enriched.companyEnrichment?.employee_count === "number"
      ? enriched.companyEnrichment.employee_count
      : null;

  const funding = toNumber(enriched.companyEnrichment?.total_funding_raised);

  // Your existing PDL gates stay as-is
  const pdlByEmployees = empCount !== null && empCount > 400;
  const pdlByFunding = funding !== null && funding > 100_000_000;
  const pdlApproved = pdlByEmployees || pdlByFunding;

  // Claude: only trust if reason shows revenue/press evidence per our validator
  const ai = enriched.aiDecision;
  const claudeApproved =
    ai?.status === "approved" && ai?.reason && reasonBackedByRevenueOrPress(ai.reason);

  if (pdlApproved || claudeApproved) {
    return { approved: true };
  }

  const empPart = empCount === null ? "no employee count" : `${empCount} employees`;
  const fundPart =
    funding === null ? "no funding" : `$${Math.round(funding).toLocaleString()} funding`;

  const claudePart = ai
    ? `Claude: ${ai.status}${ai.reason ? ` — ${ai.reason}` : ""}`
    : "Claude: no decision";

  return {
    approved: false,
    reason: `Fails thresholds (${empPart}, ${fundPart}); ${claudePart}`,
  };
}
