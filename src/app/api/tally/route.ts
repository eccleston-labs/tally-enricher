// src/app/api/score/route.ts
import { NextRequest, NextResponse } from "next/server";
import { enrichWithAbstract, scoreLead } from "@/lib/enrich";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ScoreInput = {
  company_name?: string;
  work_email?: string;
  company_size?: string;
  company_seats?: string;
  computers?: string;
  // allow extra keys without complaining
  [k: string]: unknown;
};

const asStr = (v: unknown): string =>
  typeof v === "string" ? v : v == null ? "" : String(v);

// Map query-style payload -> our answers format
function toAnswers(input: Partial<ScoreInput>): Record<string, string> {
  return {
    "Company Name": asStr(input.company_name),
    "Email Address": asStr(input.work_email),
    "Company Size": asStr(input.company_size),
    "Number of Seats": asStr(input.company_seats),
    "Computers": asStr(input.computers),
  };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const answers = toAnswers((body ?? {}) as Partial<ScoreInput>);

  if (!answers["Email Address"]) {
    return NextResponse.json({ ok: false, error: "Missing work_email" }, { status: 400 });
  }

  try {
    const enriched = await enrichWithAbstract(answers);
    const decision = scoreLead(enriched);

    return NextResponse.json({
      ok: true,
      decision,
      enriched: {
        derived: enriched.derived,
        companyEnrichment: enriched.companyEnrichment ?? null,
        debug: enriched.debug ?? null,
      },
    });
  } catch (e) {
    // guard in case enrichment throws (e.g., missing env var)
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Enrichment failed" },
      { status: 500 }
    );
  }
}
