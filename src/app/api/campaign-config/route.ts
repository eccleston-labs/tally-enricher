export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/edge-config";

type Campaign = {
  id: string;
  approved_redirect_url: string;
  rejected_redirect_url: string;
  calendar_link?: string | null;
  thresholds?: { minEmployees?: number; minFundingUsd?: number; minRevenueUsd?: number };
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing ?id" }, { status: 400 });
  }

  // Your store currently has top-level keys like "resend", "granola".
  const campaign =
    (await get<Campaign>(id)) ?? null;

  if (!campaign) {
    return NextResponse.json({ ok: false, error: `Unknown campaign id "${id}"` }, { status: 404 });
  }
  return NextResponse.json({ ok: true, campaign });
}
