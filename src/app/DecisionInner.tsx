// app/decision/DecisionInner.tsx
"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import './styles.css'

type DecisionResp =
  | { ok: true; decision: { approved: boolean; reason?: string } }
  | { ok: false; error: string };

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
    };
  }, [sp]);

  useEffect(() => {
    if (!payload.work_email) {
      // missing email, treat as "too small" → redirect to sales
      window.location.href = "https://granola.ai/contact/sales/success";
      return;
    }

    (async () => {
      try {
        const r = await fetch("/api", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          cache: "no-store",
        });
        const j = (await r.json()) as DecisionResp;

        if (j.ok && j.decision.approved) {
          // ✅ big enough
          window.location.href = "https://calendly.com/team-assemblygtm/30min";
        } else {
          // ❌ too small / error
          window.location.href = "https://granola.ai/contact/sales/success";
        }
      } catch {
        // network or API failure → redirect to sales page
        window.location.href = "https://granola.ai/contact/sales/success";
      }
    })();
  }, [payload]);

  // nothing to render — the effect handles redirect
  return (
    <div className="loader-container">
      <div className="loader" />
    </div>
  );
  
}
