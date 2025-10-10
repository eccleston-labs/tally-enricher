"use client";

import { useState } from "react";
import "../globals.css";
import {
  IntegrationSnippet,
  QualificationForm,
  WorkspaceForm,
} from "@/components/form";

const TABS = [
  { key: "update", label: "Workspace Setup" },
  { key: "instructions", label: "Instructions" },
];

const appUrl = "https://example.com";

export default function OnboardingPage() {
  const [activeTab, setActiveTab] = useState("update");
  const [workspaceName, setWorkspaceName] = useState("");

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Onboarding</h1>
      </div>

      <div className="flex border-b mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`py-2 px-4 text-sm font-semibold focus:outline-none
                ${
                  activeTab === tab.key
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500"
                }`}
            style={{ marginRight: 16 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "update" && (
          <WorkspaceForm setWorkspaceName={setWorkspaceName} />
      )}

      {activeTab === "instructions" && (
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Instructions
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Example integration snippet
              </label>
              <IntegrationSnippet
                workspaceName={workspaceName}
                appUrl={appUrl}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check Lead Qualification
              </label>
              <QualificationForm workspaceName={workspaceName} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
