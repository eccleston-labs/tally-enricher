// src/lib/serp_api.ts
export type AiDecision =
  | { status: "approved" | "rejected" | "unsure"; reason: string }
  | null;

// Parse the money string
const MONEY_RE =
  /(?:(USD|US\$|\$|GBP|£|EUR|€)\s*)?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)(?:\s*(billion|bn|b|million|m))?(?:\s*(USD|US\$|GBP|EUR))?/i;

type ParsedMoney = { value: number; currency?: string | null; unit?: "million" | "billion" | null };

type SerpApiOrganicResult = {
  title?: string;
  snippet?: string;
  link?: string;
  displayed_link?: string;
  source?: string;
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const isOrganicResult = (v: unknown): v is SerpApiOrganicResult =>
  isRecord(v);

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
  return /\b(revenue|arr|annual\s+revenue|fy\d{2,4}\s+revenue|fiscal\s+year\s+\d{4}\s+revenue)\b/i.test(text);
}

// --- URL / match helpers ---
function hostFromUrl(u?: string): string | null {
  if (!u) return null;
  try { return new URL(u.startsWith("http") ? u : `https://${u}`).hostname.toLowerCase(); }
  catch { return null; }
}

function isSubdomainOf(host: string | null, rootDomain: string | null): boolean {
  if (!host || !rootDomain) return false;
  return host === rootDomain || host.endsWith(`.${rootDomain}`);
}

const ci = (s?: string | null) => (s ?? "").toLowerCase().trim();
const collapseWS = (s?: string | null) => ci(s).replace(/\s+/g, ""); // whitespace-insensitive

// Case-insensitive includes, then whitespace-insensitive fallback
function includesFlex(hay: string, needle?: string | null): boolean {
  const n = ci(needle);
  if (!n) return false;
  const h = ci(hay);
  if (h.includes(n)) return true;
  const h2 = collapseWS(hay);
  const n2 = collapseWS(needle);
  return !!n2 && h2.includes(n2);
}

type SerpHit = { valueUSD: number; snippet: string; source: string; year?: number | null };

export async function evaluateWithSerp(
  domain: string,
  {
    companyName,
    apiKey = process.env.SERP_API_KEY,
    timeoutMs = 8000,
    perRequestMs = 2500,
    minRevenueUsd = 50_000_000,
    recentYearCutoff = new Date().getFullYear() - 3,
  }: {
    companyName?: string | null;
    apiKey?: string;
    timeoutMs?: number;
    perRequestMs?: number;
    minRevenueUsd?: number;
    recentYearCutoff?: number;
  } = {}
): Promise<AiDecision> {
  if (!apiKey) throw new Error("Missing SERP_API_KEY");
  if (!domain) return { status: "unsure", reason: "No domain provided." };

  const name = (companyName || "").trim();
  const d = domain.trim(); // expected hostname, e.g. "assemblygtm.com"

  // Exactly two queries (company + domain)
  const queries = [
    ...(name ? [`"${name}" revenue`] : []),
    `${d} revenue`,
  ];

  const deadline = Date.now() + timeoutMs;
  const hits: SerpHit[] = [];

  for (const q of queries) {
    const timeLeft = deadline - Date.now();
    if (timeLeft <= 150) break;
    const thisReqMs = Math.min(perRequestMs, Math.max(800, timeLeft - 50));

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), thisReqMs);

    try {
      const url = new URL("https://serpapi.com/search.json");
      url.searchParams.set("engine", "google");
      url.searchParams.set("q", q);
      url.searchParams.set("num", "10");
      url.searchParams.set("api_key", apiKey);

      const res = await fetch(url.toString(), { signal: ac.signal });
      const raw: unknown = await res.json().catch(() => null);
      if (!isRecord(raw)) continue;

      const orgRaw = raw["organic_results"];
      const org: SerpApiOrganicResult[] = Array.isArray(orgRaw)
        ? orgRaw.filter(isOrganicResult)
        : [];
        
      for (const r of org) {
        const title = r?.title ?? "";
        const snippet = r?.snippet ?? "";
        const text = [title, snippet].filter(Boolean).join(" — ");
        if (!text || !textImpliesRevenue(text)) continue;

        const link = r?.link || r?.displayed_link || r?.source;
        const host = hostFromUrl(link);

        // HARD GATE:
        // - Host is same domain/subdomain OR
        // - Text mentions full companyName (whitespace-insensitive) OR
        // - Text/host mentions full domain string
        const okByHost = isSubdomainOf(host, d);
        const okByCompany = name ? includesFlex(text, name) : false;
        const okByDomain = includesFlex(text, d) || includesFlex(host || "", d);

        if (!(okByHost || okByCompany || okByDomain)) continue;

        const pm = parseMoney(text);
        const val = pm ? toUSDLikeNumber(pm) : null;
        if (!val) continue;

        const y = extractYear(text) ?? undefined;
        const src = host || "google.com";
        hits.push({ valueUSD: val, snippet: text.slice(0, 300), source: src, year: y });

        if (val >= minRevenueUsd && (!y || y >= recentYearCutoff)) {
          return {
            status: "approved",
            reason: `Revenue ≈ $${Math.round(val).toLocaleString()}${y ? ` (${y})` : ""} (${src})`,
          };
        }
      }
    } catch (e) {
      console.warn("[SERP] per-request error", (e as Error)?.message ?? String(e));
    } finally {
      clearTimeout(timer);
    }
  }

  if (hits.length === 0) {
    const who = (name ? `for "${name}" or ${d}` : `for ${d}`);
    return { status: "unsure", reason: `No reputable revenue figure found ${who}.` };
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
