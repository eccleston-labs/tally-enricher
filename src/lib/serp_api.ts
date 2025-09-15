// src/lib/serp_api.ts
export type AiDecision =
  | { status: "approved" | "rejected" | "unsure"; reason: string }
  | null;

// Money like: "$1.2B", "USD 32 million", "£450m", "4.6 billion USD"
const MONEY_RE =
  /(?:(USD|US\$|\$|GBP|£|EUR|€)\s*)?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)(?:\s*(billion|bn|b|million|m))?(?:\s*(USD|US\$|GBP|EUR))?/i;

type ParsedMoney = { value: number; currency?: string | null; unit?: "million" | "billion" | null };

function parseMoney(s: string): ParsedMoney | null {
  const m = s.match(MONEY_RE);
  if (!m) return null;
  const [, cur1, numRaw, unitRaw, cur2] = m;
  const currency = (cur1 || cur2 || null)?.toUpperCase() ?? null;
  const raw = (numRaw || "").replace(/[, ]/g, "");
  const unitNorm =
    unitRaw && /^(billion|bn|b)$/i.test(unitRaw) ? "billion" :
    unitRaw && /^(million|m)$/i.test(unitRaw) ? "million" :
    null;

  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return { value: n, currency, unit: unitNorm };
}

function toUSDLikeNumber(pm: ParsedMoney): number | null {
  // Be conservative: only trust unlabelled or explicitly USD/$ figures.
  const isUSD = !pm.currency || pm.currency === "$" || pm.currency === "US$" || pm.currency === "USD";
  if (!isUSD) return null;
  let val = pm.value;
  if (pm.unit === "million") val *= 1_000_000;
  else if (pm.unit === "billion") val *= 1_000_000_000;
  return val;
}

function extractYear(text: string): number | null {
  const m = text.match(/\b(20\d{2}|19\d{2})\b/);
  return m ? Number(m[1]) : null;
}

function textImpliesRevenue(text: string): boolean {
  // Must contain a revenue-like keyword near the number to avoid funding totals.
  return /\b(revenue|arr|annual\s+revenue|fy\d{2,4}\s+revenue|fiscal\s+year\s+\d{4}\s+revenue)\b/i.test(text);
}

function hostFromUrl(u?: string): string | null {
  if (!u) return null;
  try { return new URL(u.startsWith("http") ? u : `https://${u}`).hostname.toLowerCase(); }
  catch { return null; }
}

type SerpHit = { valueUSD: number; snippet: string; source: string; year?: number | null };

export async function evaluateWithSerp(
  domain: string,
  {
    apiKey = process.env.SERP_API_KEY,
    timeoutMs = 9000,          // total budget
    perRequestMs = 2500,       // cap per request
    maxQueries = 3,            // keep it cheap
    minRevenueUsd = 50_000_000,
    recentYearCutoff = new Date().getFullYear() - 3,
  }: {
    apiKey?: string;
    timeoutMs?: number;
    perRequestMs?: number;
    maxQueries?: number;
    minRevenueUsd?: number;
    recentYearCutoff?: number;
  } = {}
): Promise<AiDecision> {
  if (!apiKey) throw new Error("Missing SERP_API_KEY");
  if (!domain) return { status: "unsure", reason: "No domain provided." };

  // Build a small, high-signal query set
  const queriesAll = [
    `${domain} revenue`,
    // `site:${domain} revenue`,
    `${domain} ARR`,
    `${domain} annual revenue`,
    // `site:sec.gov ${domain} revenue`,
  ];

  // Budget/deadline
  const deadline = Date.now() + timeoutMs;
  const queries = queriesAll.slice(0, maxQueries);

  const hits: SerpHit[] = [];
  console.log("[SERP] evaluating", { domain, queries: queries.length });

  for (const q of queries) {
    const timeLeft = deadline - Date.now();
    if (timeLeft <= 150) break; // out of budget

    const thisReqMs = Math.min(perRequestMs, Math.max(800, timeLeft - 50));
    console.log("[SERP] query", q, `(timeout ~${thisReqMs}ms)`);

    // Per-request AbortController
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), thisReqMs);

    try {
      const url = new URL("https://serpapi.com/search.json");
      url.searchParams.set("engine", "google");
      url.searchParams.set("q", q);
      url.searchParams.set("num", "10");
      url.searchParams.set("api_key", apiKey);

      const res = await fetch(url.toString(), { signal: ac.signal });
      const json = await res.json().catch(() => null);
      if (!json) { continue; }

      // ---- parse results (same logic as before) ----
      // KG
      const kg = json?.knowledge_graph;
      if (kg && typeof kg === "object") {
        const rev = kg.revenue || kg["Revenue"] || kg["revenue"];
        if (typeof rev === "string" && textImpliesRevenue(`revenue ${rev}`)) {
          const pm = parseMoney(rev);
          const val = pm ? toUSDLikeNumber(pm) : null;
          if (val) {
            const hit: SerpHit = {
              valueUSD: val,
              snippet: `KG: ${rev}`,
              source: "google.com",
              year: extractYear(rev) ?? undefined,
            };
            hits.push(hit);
            // Early-approve if it meets threshold & recency
            if (val >= minRevenueUsd && (!hit.year || hit.year >= recentYearCutoff)) {
              return {
                status: "approved",
                reason: `Revenue ≈ $${Math.round(val).toLocaleString()}${hit.year ? ` (${hit.year})` : ""} (${hit.source})`,
              };
            }
          }
        }
      }

      // Answer box
      const ab = json?.answer_box;
      if (ab && typeof ab === "object") {
        const candidates = [ab.answer, ab.snippet, ab.title, ab.result, ab.result_snippet, ab.result_title]
          .filter(Boolean);
        for (const c of candidates) {
          if (typeof c !== "string" || !textImpliesRevenue(c)) continue;
          const pm = parseMoney(c);
          const val = pm ? toUSDLikeNumber(pm) : null;
          if (val) {
            const y = extractYear(c) ?? undefined;
            const hit: SerpHit = { valueUSD: val, snippet: `AnswerBox: ${c}`, source: "google.com", year: y };
            hits.push(hit);
            if (val >= minRevenueUsd && (!y || y >= recentYearCutoff)) {
              return {
                status: "approved",
                reason: `Revenue ≈ $${Math.round(val).toLocaleString()}${y ? ` (${y})` : ""} (${hit.source})`,
              };
            }
          }
        }
      }

      // Organic
      const org: any[] = Array.isArray(json?.organic_results) ? json.organic_results : [];
      for (const r of org) {
        const title = r?.title ?? "";
        const snippet = r?.snippet ?? "";
        const extensions = Array.isArray(r?.rich_snippet?.top?.extensions)
          ? r.rich_snippet.top.extensions.join(" • ")
          : "";
        const text = [title, snippet, extensions].filter(Boolean).join(" — ");
        if (!text || !textImpliesRevenue(text)) continue;

        const pm = parseMoney(text);
        const val = pm ? toUSDLikeNumber(pm) : null;
        if (!val) continue;

        const link = r?.link || r?.displayed_link || r?.source;
        const host = hostFromUrl(link) || "google.com";
        const y = extractYear(text) ?? undefined;

        const hit: SerpHit = { valueUSD: val, snippet: text.slice(0, 300), source: host, year: y };
        hits.push(hit);
        if (val >= minRevenueUsd && (!y || y >= recentYearCutoff)) {
          return {
            status: "approved",
            reason: `Revenue ≈ $${Math.round(val).toLocaleString()}${y ? ` (${y})` : ""} (${host})`,
          };
        }
      }
    } catch (e) {
      // If this single request aborted, continue loop; rely on collected hits
      console.warn("[SERP] per-request error", (e as Error)?.message ?? String(e));
    } finally {
      clearTimeout(timer);
    }
  }

  // Decide from collected hits
  if (hits.length === 0) {
    return { status: "unsure", reason: "No reputable revenue figure found via search." };
  }

  hits.sort((a, b) => {
    const ay = a.year ?? 0, by = b.year ?? 0;
    if (ay !== by) return by - ay;
    return b.valueUSD - a.valueUSD;
  });

  const recentHits = hits.filter(h => !h.year || h.year >= recentYearCutoff);
  const top = (recentHits.length ? recentHits : hits)[0];

  if (top.valueUSD >= minRevenueUsd) {
    return {
      status: "approved",
      reason: `Revenue ≈ $${Math.round(top.valueUSD).toLocaleString()}${top.year ? ` (${top.year})` : ""} (${top.source})`,
    };
  }

  return {
    status: "unsure",
    reason: `Found revenue signal but < $${minRevenueUsd.toLocaleString()} or stale${top.year ? ` (${top.year})` : ""} (${top.source})`,
  };
}

