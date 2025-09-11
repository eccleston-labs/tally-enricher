// src/app/api/tally/route.ts
import { NextRequest, NextResponse } from "next/server";
import { enrichWithAbstract, scoreLead, Answers } from "@/lib/enrich";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------- tiny helpers ----------
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const get = (obj: unknown, key: string): unknown => (isRecord(obj) ? obj[key] : undefined);
const asStr = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));

// ---------- map body -> { sid, answers } ----------
function toAnswersFromAny(raw: unknown): { sid: string; answers: Answers } {
  const event = get(raw, "event");
  const root = get(event, "data") ?? get(raw, "data");

  const maybeFields = get(root, "fields");
  if (Array.isArray(maybeFields)) {
    const sid = asStr(get(root, "responseId"));
    const answers: Record<string, string> = {};
    for (const f of maybeFields) {
      const label = asStr(get(f, "label")) || asStr(get(f, "key")) || asStr(get(f, "id"));
      const value = asStr(get(f, "value"));
      if (label) answers[label] = value;
    }
    return { sid, answers };
  }

  const sid = asStr(get(raw, "responseId")) || crypto.randomUUID();
  const answers: Record<string, string> = {
    "Company Name": asStr(get(raw, "company_name")),
    "Email Address": asStr(get(raw, "work_email")),
    "Company Size": asStr(get(raw, "company_size")),
    "Number of Seats": asStr(get(raw, "company_seats")),
    "Computers": asStr(get(raw, "computers")),
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

  if (!answers["Email Address"]) {
    return NextResponse.json({ ok: false, error: "Missing work_email" }, { status: 400 });
  }

  const enriched = await enrichWithAbstract(answers);
  const decision = scoreLead(enriched);

  // --- Clay webhook (fire-and-forget, with diagnostics) ---
  const clayUrl = process.env.CLAY_WEBHOOK_URL;
  const clayWebhookAttempted = Boolean(clayUrl);
  console.log("[Clay] URL present?", clayWebhookAttempted);

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
    const timer = setTimeout(() => ac.abort(), 15000); // give prod more time
    fetch(clayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // optional but sometimes handy for vendor logs:
        "User-Agent": "tally-enricher/preview",
      },
      body: JSON.stringify(payloadForClay),
      signal: ac.signal,
    })
      .then(async (res) => {
        const text = await res.text();
        console.log("[Clay] status:", res.status, "bodyLen:", text.length);
      })
      .catch((err) => {
        console.warn("[Clay] failed:", err instanceof Error ? err.message : String(err));
      })
      .finally(() => clearTimeout(timer));
  } else {
    console.warn("[Clay] CLAY_WEBHOOK_URL not set");
  }

  return NextResponse.json({
    ok: true,
    sid,
    decision,
    enriched: {
      derived: enriched.derived,
      companyEnrichment: enriched.companyEnrichment ?? null,
      debug: enriched.debug ?? null,
    },
    clayWebhookAttempted,
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Tally webhook alive" });
}
