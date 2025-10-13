"use client";

import React, { useState } from "react";
import "../globals.css";
import {
  IntegrationSnippet,
  QualificationForm,
  OnboardingForm,
} from "@/components/form";

const appUrl = "https://example.com";

export default function OnboardingPage() {
  const [workspaceName, setWorkspaceName] = useState("");

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Onboarding</h1>
      </div>
      <OnboardingForm setWorkspaceName={setWorkspaceName} />
    </div>
  );
}
