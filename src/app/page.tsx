// src/app/page.tsx
"use client";

import { Suspense } from "react";
import DecisionInner from "./DecisionInner";

const Spinner = () => (
  <div className="p-6 flex justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
  </div>
);

export default function HomePage() {
  return (
    <Suspense fallback={<Spinner />}>
      <DecisionInner />
    </Suspense>
  );
}
