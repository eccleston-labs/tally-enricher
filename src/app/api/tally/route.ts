// src/app/api/tally/route.ts
import { NextRequest, NextResponse } from "next/server";
import { enrichWithAbstract, scoreLead, Answers } from "@/lib/enrich";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Accepts either Tally webhook payload OR your /decision POST body
function toAnswersFromAny(raw: unknown): { sid: string; answers: Answers } {
  const r: any = raw;

  // Tally webhook event shape
  const root = r?.event?.data || r?.data;
  if (root?.fields) {
    const sid = String(root?.responseId || "");
    const fields = Array.isArray(root?.fields) ? root.fields : [];
    const answers: Record<string, string> = {};
    for (const f of fields) answers[f.label] = String(f.value ?? "");
    return { sid, answers };
  }

  // Direct POST from /decision (query-param names)
  const sid = r?.responseId ?? crypto.randomUUID();
  const answers: Record<string, string> = {
    "Company Name": r?.company_name ?? "",
    "Email Address": r?.work_email ?? "",
    "Company Size": r?.company_size ?? "",
    "Number of Seats": r?.company_seats ?? "",
    "Computers": r?.computers ?? "",
    // keep extras if you want them in Clay later:
    "Email Calendar": r?.email_calendar ?? "",
    "Questions": r?.questions ?? "",
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

  // Basic guard (we need an email to derive domain)
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
      // Original inputs (your URL params or mapped fields from Tally)
      inputs: {
        company_name: answers["Company Name"],
        work_email: answers["Email Address"],
        company_size: answers["Company Size"],
        company_seats: answers["Number of Seats"],
        computers: answers["Computers"],
        email_calendar: (body as any)?.email_calendar ?? "",
        questions: (body as any)?.questions ?? "",
      },
      derived: enriched.derived,
      companyEnrichment: enriched.companyEnrichment ?? null,
      decision,
      // light request context (useful in Clay)
      request_meta: {
        ip: req.headers.get("x-forwarded-for") ?? null,
        user_agent: req.headers.get("user-agent") ?? null,
        host: req.headers.get("host") ?? null,
      },
    };

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 5000);
    // Do NOT block the response on this; log but don’t throw
    fetch(clayUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadForClay),
      signal: ac.signal,
    })
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
