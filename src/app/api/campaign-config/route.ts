export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const workspaceName = url.searchParams.get("id") || "";

  if (!workspaceName) {
    console.warn("[SB] missing id");
    return NextResponse.json({ ok: false, error: "Missing ?id" }, { status: 400 });
  }

  const t0 = Date.now();
  console.log(`[SB] start {"workspace_name":"${workspaceName}"}`);

  try {
    const { data, error } = await supabase
      .from("workspaces")
      .select(`
        id,
        workspace_name,
        configurations(*),
        criteria(*)
      `)
      .eq("workspace_name", workspaceName)
      .maybeSingle();

    const ms = Date.now() - t0;

    if (error) {
      console.error(`[SB] error ${ms}ms`, {
        workspace_name: workspaceName,
        error: error.message,
        code: (error as any).code,
      });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      console.warn(`[SB] not_found ${ms}ms`, { workspace_name: workspaceName });
      return NextResponse.json({ ok: false, error: `Unknown workspace "${workspaceName}"` }, { status: 404 });
    }

    const config = Array.isArray(data.configurations) ? data.configurations[0] ?? null : null;
    const criteria = Array.isArray(data.criteria) ? data.criteria[0] ?? null : null;

    // Booking = approved, Success = rejected
    const approved_redirect_url = config?.booking_url ?? "";
    const rejected_redirect_url = config?.success_page_url ?? "";

    console.log(`[SB] done ${ms}ms`, {
      workspace_id: data.id,
      workspace_name: data.workspace_name,
      has_config: !!config,
      has_criteria: !!criteria,
    });

    return NextResponse.json({
      ok: true,
      config,
      criteria,
      approved_redirect_url,
      rejected_redirect_url,
    });
  } catch (e) {
    const ms = Date.now() - t0;
    console.error(`[SB] exception ${ms}ms`, { workspace_name: workspaceName, error: String(e) });
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
