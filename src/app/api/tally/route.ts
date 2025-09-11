// src/app/api/score/route.ts
import { NextRequest, NextResponse } from "next/server";
import { enrichWithAbstract, scoreLead } from "@/lib/enrich";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toAnswers(input: any): Record<string, string> {
  return {
    "Company Name": input.company_name ?? "",
    "Email Address": input.work_email ?? "",
    "Company Size": input.company_size ?? "",
    "Number of Seats": input.company_seats ?? "",
    "Computers": input.computers ?? "",
  };
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const answers = toAnswers(body);
  if (!answers["Email Address"]) {
    return NextResponse.json({ ok: false, error: "Missing work_email" }, { status: 400 });
  }

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
}
