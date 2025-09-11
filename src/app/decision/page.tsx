"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type DecisionResp =
  | { ok: true; decision: { approved: boolean; reason?: string } }
  | { ok: false; error: string };

export default function DecisionPage() {
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

  const [resp, setResp] = useState<DecisionResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!payload.work_email) {
      setResp({ ok: false, error: "Missing work_email in URL" });
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const r = await fetch("/api/tally", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          cache: "no-store",
        });
        const j = (await r.json()) as DecisionResp;
        setResp(j);
      } catch {
        setResp({ ok: false, error: "Network error" });
      } finally {
        setLoading(false);
      }
    })();
  }, [payload]);

  const isReady = !loading && resp?.ok === true;
  const isError = !loading && resp?.ok === false;

  return (
    <main className="mx-auto max-w-xl p-6 text-center">
      {loading && <p>Checking company size…</p>}

      {isReady && (resp as Extract<DecisionResp, { ok: true }>).decision.approved ? (
        <h1 className="text-2xl font-bold text-green-600">Yay, big enough 🎉</h1>
      ) : isReady ? (
        <h1 className="text-2xl font-bold text-red-600">Sorry, too small 😔</h1>
      ) : null}

      {isError && (
        <p className="text-red-600">
          Error: {(resp as Extract<DecisionResp, { ok: false }>).error}
        </p>
      )}
    </main>
  );
}
