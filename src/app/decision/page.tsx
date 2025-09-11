// app/decision/page.tsx
"use client";

import { Suspense } from "react";
import DecisionInner from "./DecisionInner";

export default function DecisionPage() {
  return (
    <Suspense fallback={<p className="p-6">Loading search params…</p>}>
      <DecisionInner />
    </Suspense>
  );
}
