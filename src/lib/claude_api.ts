// src/lib/claude_api.ts
export type AiDecision =
  | { status: "approved" | "rejected" | "unsure"; reason: string }
  | null;

export const CLAUDE_PROMPT_REVENUE_ONLY = ({
  domain,
  minRevenueUsd = 10_000_000,
  minRecentArticles = 5,
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

export async function evaluateWithClaude(
  domain: string,
  { timeoutMs = 9000, apiKey = process.env.ANTHROPIC_API_KEY }: { timeoutMs?: number; apiKey?: string } = {}
): Promise<AiDecision> {
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

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
            minRevenueUsd: 10_000_000,
            minRecentArticles: 5,
          }),
        },
      ],
      // response_format: { type: "json_object" }, // if supported
    };

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: ac.signal,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = await res.json().catch(() => ({}));
    const text = raw?.content?.[0]?.text ?? raw?.output_text ?? "";

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
