"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import "./styles.css";

type DecisionResp =
  | { ok: true; decision: { approved: boolean; reason?: string } }
  | { ok: false; error: string };

// Keep constants outside the component so they don't appear in deps
const DEFAULTS = {
  approved: "https://calendly.com/team-assemblygtm/30min",
  rejected: "https://granola.ai/contact/sales/success",
};

export default function DecisionInner() {
  const sp = useSearchParams();

  const payload = useMemo(() => {
    const get = (k: string) => sp.get(k) ?? "";
    return {
      company_name: get("company_name"),
      work_email: get("work_email"),
      company_size: get("company_size"),
      company_seats: get("company_seats"),
      computers: get("computers"),
      email_calendar: get("email_calendar"),
      questions: get("questions"),
      id: get("id"), // campaign id (e.g. "resend", "granola")
    };
  }, [sp]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1) Fetch campaign config (for URLs)
      let approvedUrl = DEFAULTS.approved;
      let rejectedUrl = DEFAULTS.rejected;

      try {
        if (payload.id) {
          const r = await fetch(`/api/campaign-config?id=${encodeURIComponent(payload.id)}`, { cache: "no-store" });
          if (r.ok) {
            const j = await r.json();
            if (j.ok) {
              // adjust keys to your API shape
              const campaign = j.campaign ?? j.workspace ?? {};
              approvedUrl = campaign.approved_redirect_url || approvedUrl;
              rejectedUrl = campaign.rejected_redirect_url || rejectedUrl;
            }
          }
        }
      } catch (e) {
        console.warn("[cfg] failed:", e);
      }

      // 2) Always POST to /api (let server decide)
      try {
        console.log("[decision] POST /api with", payload);
        const r = await fetch("/api", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          cache: "no-store",
        });

        const j = (await r.json()) as DecisionResp;
        console.log("[decision] resp", j);

        const to = j.ok && j.decision.approved ? approvedUrl : rejectedUrl;
        if (!cancelled) window.location.href = to;
      } catch (e) {
        console.error("[decision] POST failed", e);
        if (!cancelled) window.location.href = rejectedUrl;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [payload]); // DEFAULTS no longer needed here

  return (
    <div className="loader-container">
      <div className="loader" />
    </div>
  );
}
