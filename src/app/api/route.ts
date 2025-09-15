// app/api/route.ts
import { NextRequest, NextResponse } from "next/server";
import { enrichWithAPIs, scoreLead, type Answers } from "@/lib/enrich";
import { postToClay } from "@/lib/post_to_clay";

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

  const enriched = await enrichWithAPIs(answers);
  const decision = scoreLead(enriched);

  // ---- Clay toggle: env OR query (?post_to_clay=true) OR header (x-post-to-clay: 1)
  const url = new URL(req.url);
  const clayEnabledEnv = process.env.CLAY_ENABLED === "true";
  const clayEnabledReq =
    (url.searchParams.get("post_to_clay") ?? "").toLowerCase() === "true" ||
    req.headers.get("x-post-to-clay") === "1";
  const doClay = clayEnabledEnv || clayEnabledReq;

  const clayUrl = process.env.CLAY_WEBHOOK_URL;
  let clayResult: { ok: boolean; status?: number; error?: string } | null = null;

  if (doClay && clayUrl) {
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

    const res = await postToClay({ payload: payloadForClay, url: clayUrl, timeoutMs: 1500, retries: 1 });
    clayResult = { ok: res.ok, status: "status" in res ? res.status : undefined, error: !res.ok ? res.error : undefined };
    console.log("[Clay]", JSON.stringify({ attempted: true, ok: res.ok, status: (res as any).status }, null, 0));
  } else {
    console.log("[Clay] skipped", JSON.stringify({ doClay, hasUrl: !!clayUrl }, null, 0));
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
    clay: clayResult,
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Webhook alive" });
}
