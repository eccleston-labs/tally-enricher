"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import "./styles.css";

type DecisionResp =
  | { ok: true; decision: { approved: boolean; reason?: string } }
  | { ok: false; error: string };

export default function DecisionInner() {
  const sp = useSearchParams();

  // Only include id + work_email in the payload (from URL)
  const payload = useMemo(() => {
    const get = (k: string) => sp.get(k) ?? "";
    return {
      id: get("id"),
      work_email: get("work_email"),
    };
  }, [sp]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let approvedUrl = "";
      let rejectedUrl = "";
      let config= null;
      let criteria=null;

      // 1) Fetch workspace config (URLs + settings)
      try {
        if (payload.id) {
          const r = await fetch(`/api/campaign-config?id=${encodeURIComponent(payload.id)}`, { cache: "no-store" });
          if (r.ok) {
            const j = await r.json();
            if (j.ok) {
              const cfg = j.config ?? null;
              config = cfg;
              criteria = j.criteria ?? null;

              // Use booking_url / success_page_url
              approvedUrl = cfg?.booking_url || "";
              rejectedUrl = cfg?.success_page_url || "";
            }
          }
        }
      } catch (e) {
        console.warn("[cfg] failed:", e);
      }

      // 2) Always POST to /api (let server decide)
      try {
        const body = {
          id: payload.id,
          work_email: payload.work_email,
          config,
          criteria,
        };

        console.log("[decision] POST /api with", body);
        const r = await fetch("/api", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          cache: "no-store",
        });

        const j = (await r.json()) as DecisionResp;
        console.log("[decision] resp", j);

        // Fallback to rejectedUrl if approvedUrl is missing or request fails
        const to =
          j.ok && j.decision.approved && approvedUrl
            ? approvedUrl
            : rejectedUrl;

        if (!cancelled && to) window.location.href = to;
      } catch (e) {
        console.error("[decision] POST failed", e);
        if (!cancelled && rejectedUrl) window.location.href = rejectedUrl;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [payload]);

  return (
    <div className="loader-container">
      <div className="loader" />
    </div>
  );
}
