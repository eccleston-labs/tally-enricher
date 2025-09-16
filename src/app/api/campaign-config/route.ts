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
        code: (error).code,
      });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      console.warn(`[SB] not_found ${ms}ms`, { workspace_name: workspaceName });
      return NextResponse.json({ ok: false, error: `Unknown workspace "${workspaceName}"` }, { status: 404 });
    }

    // Log data
    console.log(`[SB] raw ${ms}ms`, {
      workspace_id: data.id,
      workspace_name: data.workspace_name,
      configurations: data.configurations,
      criteria: data.criteria,
    });

    return NextResponse.json({ ok: true, workspace: data });

  } catch (e) {
    const ms = Date.now() - t0;
    console.error(`[SB] exception ${ms}ms`, { workspace_name: workspaceName, error: String(e) });
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
