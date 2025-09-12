// src/app/page.tsx
"use client";

import { Suspense } from "react";
import DecisionInner from "./DecisionInner";

export default function HomePage() {
  return (
    <Suspense fallback={<p className="p-6">Loading…</p>}>
      <DecisionInner />
    </Suspense>
  );
}
