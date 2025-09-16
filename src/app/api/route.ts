// app/api/route.ts
import { NextRequest, NextResponse } from "next/server";
import { enrichWithAPIs, scoreLead, type Answers } from "@/lib/enrich";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const get = (obj: unknown, key: string): unknown => (isRecord(obj) ? obj[key] : undefined);
const asStr = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));

// Map body -> { sid, answers }
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

  // Optional: receive config/criteria passed from client
  const cfg = get(body, "config");
  const crit = get(body, "criteria");

  const enriched = await enrichWithAPIs(answers);

  // If scoreLead can use thresholds, you can thread them in here.
  // Otherwise, just keep the existing call:
  const decision = scoreLead(enriched /*, cfg, crit */);

  return NextResponse.json({
    ok: true,
    sid,
    decision,
    enriched: {
      derived: enriched.derived,
      companyEnrichment: enriched.companyEnrichment ?? null,
      debug: enriched.debug ?? null,
    },
    // Echo back for debugging/visibility
    config: isRecord(cfg) ? cfg : null,
    criteria: isRecord(crit) ? crit : null,
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Webhook alive" });
}
