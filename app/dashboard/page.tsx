"use client";

import { useState } from "react";
import { useQuery } from "convex/react";

import "../globals.css";

import {
  IntegrationSnippet,
  QualificationForm,
  OnboardingForm,
} from "@/components/form";
import { api } from "@/convex/_generated/api";

const TABS = [
  { key: "update", label: "Update Workspace" },
  { key: "instructions", label: "Instructions" },
];

const appUrl = "https://example.com";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("update");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceNameInput, setWorkspaceNameInput] = useState("");
  const [showWorkspaceForm, setShowWorkspaceForm] = useState(false);

  // Query to get workspace data by name
  const existingWorkspace = useQuery(
    api.workspaces.getByName,
    workspaceName ? { name: workspaceName } : "skip",
  );

  const handleWorkspaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (workspaceNameInput.trim()) {
      setWorkspaceName(workspaceNameInput.trim());
      setShowWorkspaceForm(true);
    }
  };

  const handleBackToSearch = () => {
    setShowWorkspaceForm(false);
    setWorkspaceName("");
    setWorkspaceNameInput("");
  };

  return (
    <>
      <div className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
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
          <>
            {!showWorkspaceForm ? (
              <div>
                <h1 className="text-2xl font-bold mb-6 text-gray-800">
                  Find Workspace
                </h1>
                <form onSubmit={handleWorkspaceSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Workspace Name
                    </label>
                    <input
                      type="text"
                      value={workspaceNameInput}
                      onChange={(e) => setWorkspaceNameInput(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter workspace name to load existing configuration"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Load Workspace
                  </button>
                </form>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-gray-800">
                    Workspace Configuration: {workspaceName}
                  </h1>
                  <button
                    onClick={handleBackToSearch}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    ← Back to search
                  </button>
                </div>

                {existingWorkspace === undefined ? (
                  <div className="flex justify-center py-8">
                    <div className="text-gray-500">
                      Loading workspace data...
                    </div>
                  </div>
                ) : (
                  <>
                    {existingWorkspace === null && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                        <p className="text-yellow-800 text-sm">
                          Workspace &quot;{workspaceName}&quot; not found. You
                          can create it by filling out the form below.
                        </p>
                      </div>
                    )}
                    <OnboardingForm
                      setWorkspaceName={setWorkspaceName}
                      initialData={existingWorkspace}
                    />
                  </>
                )}
              </div>
            )}
          </>
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

      <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Welcome to Tally Enricher
        </h1>
        <p className="text-gray-600 mb-6">
          Please sign in to access the dashboard and manage your workspaces.
        </p>
      </div>
    </>
  );
}
