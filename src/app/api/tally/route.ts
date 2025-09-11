// src/app/api/tally/route.ts
import { NextRequest, NextResponse } from "next/server";
import { enrichWithAbstract, scoreLead, Answers } from "@/lib/enrich";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------- tiny helpers (type-safe, no "any") ----------
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const get = (obj: unknown, key: string): unknown =>
  isRecord(obj) ? obj[key] : undefined;

const asStr = (v: unknown): string =>
  typeof v === "string" ? v : v == null ? "" : String(v);

// ---------- map body -> { sid, answers } ----------
function toAnswersFromAny(raw: unknown): { sid: string; answers: Answers } {
  // Try Tally webhook event shape first: { event: { data: { responseId, fields: [...] } } }
  const event = get(raw, "event");
  const root = get(event, "data") ?? get(raw, "data");

  const maybeFields = get(root, "fields");
  if (Array.isArray(maybeFields)) {
    const sid = asStr(get(root, "responseId"));
    const answers: Record<string, string> = {};

    for (const f of maybeFields) {
      // each f is expected like { label | key | id, value }
      const label =
        asStr(get(f, "label")) || asStr(get(f, "key")) || asStr(get(f, "id"));
      const value = asStr(get(f, "value"));
      if (label) answers[label] = value;
    }
    return { sid, answers };
  }

  // Fallback: direct POST from /decision with query-param names
  const sid = asStr(get(raw, "responseId")) || crypto.randomUUID();
  const answers: Record<string, string> = {
    "Company Name": asStr(get(raw, "company_name")),
    "Email Address": asStr(get(raw, "work_email")),
    "Company Size": asStr(get(raw, "company_size")),
    "Number of Seats": asStr(get(raw, "company_seats")),
    "Computers": asStr(get(raw, "computers")),
    // extras (forward to Clay)
    "Email Calendar": asStr(get(raw, "email_calendar")),
    "Questions": asStr(get(raw, "questions")),
  };
  return { sid, answers };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { sid, answers } = toAnswersFromAny(body);

  // Guard: we need an email to derive domain for Abstract
  if (!answers["Email Address"]) {
    return NextResponse.json({ ok: false, error: "Missing work_email" }, { status: 400 });
  }

  // Enrich + score
  const enriched = await enrichWithAbstract(answers);
  const decision = scoreLead(enriched);

  // --- Fire-and-forget webhook to Clay ---
  const clayUrl = process.env.CLAY_WEBHOOK_URL;
  if (clayUrl) {
    const payloadForClay = {
      id: sid,
      received_at: new Date().toISOString(),
      source: "tally-redirect",
      inputs: {
        company_name: answers["Company Name"],
        work_email: answers["Email Address"],
        company_size: answers["Company Size"],
        company_seats: answers["Number of Seats"],
        computers: answers["Computers"],
        email_calendar: asStr(get(body, "email_calendar")),
        questions: asStr(get(body, "questions")),
      },
      derived: enriched.derived,
      companyEnrichment: enriched.companyEnrichment ?? null,
      decision,
      request_meta: {
        ip: req.headers.get("x-forwarded-for") ?? null,
        user_agent: req.headers.get("user-agent") ?? null,
        host: req.headers.get("host") ?? null,
      },
    };

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 5000);
    fetch(clayUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadForClay),
      signal: ac.signal,
    })
      // Optional: uncomment to see status in logs
      // .then(async (res) => console.log("[Clay] status", res.status, (await res.text()).slice(0, 200)))
      .catch(() => {})
      .finally(() => clearTimeout(timer));
  }

  // Respond to the client (DecisionInner will redirect based on this)
  return NextResponse.json({
    ok: true,
    sid,
    decision,
    enriched: {
      derived: enriched.derived,
      companyEnrichment: enriched.companyEnrichment ?? null,
      debug: enriched.debug ?? null,
    },
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Tally webhook alive" });
}
