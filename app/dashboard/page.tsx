"use client";
import React, { useState } from "react";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { ConfigForm } from "@/components/ConfigForm";
import { IntegrationSnippet } from "@/components/form/integration-snippet";

const SIDEBAR_ITEMS = [
  { key: "summary", label: "Summary" },
  { key: "analytics", label: "Analytics" },
  { key: "config", label: "Config" },
  { key: "settings", label: "Settings" },
];

export default function DashboardPage() {
  return (
    <>
      <Authenticated>
        <DashboardAuthed />
      </Authenticated>
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center">
          <SignInButton />
        </div>
      </Unauthenticated>
    </>
  );
}

function DashboardAuthed() {
  const [activeView, setActiveView] = useState("summary");

  // Current user + their workspace
  const me = useQuery(api.users.me, {});
  const meLoading = me === undefined;
  const workspaceName = me?.workspace?.workspace_name ?? null;

  // Summary metrics
  const summary = useQuery(
    api.analytics.summaryForWorkspaceName,
    workspaceName ? { workspaceName } : "skip"
  );
  const summaryLoading = !!workspaceName && summary === undefined;

  // Insights for Analytics tab
  const insights = useQuery(
    api.analytics.insightsForWorkspaceName,
    workspaceName ? { workspaceName } : "skip"
  );
  const insightsLoading = !!workspaceName && insights === undefined;

  const submissions = summary?.submissions ?? (summaryLoading ? "…" : 0);
  const qualified = summary?.qualified ?? (summaryLoading ? "…" : 0);

  const companyName =
    workspaceName ?? (meLoading ? "Loading…" : "No workspace");

  // Helper to format funding in millions
  const formatMillions = (num: number | null | undefined) => {
    if (num == null) return "No data";
    return `$${(num / 1_000_000).toFixed(0)}m`;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-4 text-xl font-bold border-b border-gray-100">
          Dashboard
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`w-full text-left px-4 py-2 rounded-md transition ${activeView === item.key
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
                }`}
              onClick={() => setActiveView(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold capitalize">{activeView}</h1>
          <div className="text-lg font-medium text-gray-700">{companyName}</div>
        </div>

        {activeView === "summary" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <MetricCard label="Submissions" value={submissions} />
            <MetricCard label="Qualified Leads" value={qualified} />
            <MetricCard
              label={
                summaryLoading
                  ? "Avg. Company Size"
                  : summary?.omissions && summary.omissions > 0
                    ? `Avg. Company Size (${summary.omissions} omitted)`
                    : "Avg. Company Size"
              }
              value={
                summaryLoading
                  ? "…"
                  : summary?.avgEmployees != null
                    ? summary.avgEmployees.toLocaleString()
                    : "No data"
              }
            />
          </div>
        )}

        {activeView === "analytics" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Analytics</h2>

            {/* Insights */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Insights</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>
                  {insightsLoading
                    ? "Loading…"
                    : `${insights?.qualifiedPct ?? 0}% of form fills were qualified`}
                </li>
                <li>
                  {insightsLoading
                    ? "Loading…"
                    : insights?.avgQualifiedEmployees != null
                      ? `Average company size of qualified lead was ${insights.avgQualifiedEmployees.toLocaleString()}`
                      : "Average company size of qualified lead: No data"}
                </li>
                <li>
                  {insightsLoading
                    ? "Loading…"
                    : insights?.mostCommonSector
                      ? `Most common vertical was ${insights.mostCommonSector}`
                      : "Most common vertical: No data"}
                </li>
                <li>
                  {insightsLoading
                    ? "Loading…"
                    : `Average funding raised was ${formatMillions(insights?.avgFunding)}`}
                  {insights && insights.fundingOmissions > 0
                    ? ` (${insights.fundingOmissions} omitted)`
                    : ""}
                </li>
                <li>(FAKE) Most common qualified lead role was VP eng</li>
                <li>(FAKE) Average revenue was $8m</li>
              </ul>
            </div>

            {/* Actions */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Actions</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>(FAKE) Consider changing thresholds to be lower – aim for 100% qualified</li>
                <li>(FAKE) Consider running marketing campaign to target VP Eng</li>
                <li>(FAKE) Consider running this Google ad</li>
              </ul>
            </div>
          </div>
        )}

        {activeView === "config" && (
          <>
            <div className="bg-white rounded-lg shadow p-6 space-y-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">Workspace Configuration</h2>
                {meLoading ? (
                  <p className="text-gray-500">Loading workspace…</p>
                ) : me?.workspace ? (
                  <ConfigForm workspace={me.workspace} />
                ) : (
                  <p className="text-gray-500">No workspace found</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 space-y-8 mt-8">
              <h2 className="text-xl font-semibold mb-4">Link</h2>
              {me?.workspace ? (
                <IntegrationSnippet
                  workspaceName={me.workspace.workspace_name}
                  appUrl="https://tally-enricher.vercel.app"
                />
              ) : (
                <p className="text-gray-500">No workspace available for snippet</p>
              )}
            </div>
          </>
        )}

        {activeView === "settings" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Nothing here yet</h2>
          </div>
        )}

      </main>
    </div>
  );
}


function MetricCard({ label, value }: { label: string | number; value: string | number }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  );
}
