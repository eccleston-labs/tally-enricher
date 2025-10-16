"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConfigForm } from "@/components/ConfigForm";
import { IntegrationSnippet } from "@/components/form/integration-snippet";
import { SignOutButton } from "@clerk/nextjs";
import { QualificationForm } from "@/components/form/qualification-form";
import { slackAuthorizeUrl } from "@/lib/slack";

const SIDEBAR_ITEMS = [
  { key: "instructions", label: "Instructions" },
  { key: "summary", label: "Summary" },
  { key: "analytics", label: "Analytics" },
  { key: "config", label: "Config" },
  { key: "settings", label: "Settings" },
];

export default function DashboardPage() {
  const me = useQuery(api.users.me, {});
  const router = useRouter();
  const [activeView, setActiveView] = useState("instructions");

  const workspaceName = me?.workspace?.workspace_name;

  // Always call queries, use "skip" if not ready
  const summary = useQuery(
    api.analytics.summaryForWorkspaceName,
    workspaceName ? { workspaceName } : "skip"
  );
  const insights = useQuery(
    api.analytics.insightsForWorkspaceName,
    workspaceName ? { workspaceName } : "skip"
  );

  // Redirect effects run AFTER hooks are called
  useEffect(() => {
    if (me === null) {
      router.replace("/home");
    } else if (me && !me.workspace) {
      router.replace("/onboarding");
    }
  }, [me, router]);

  // UI guards happen *after* hooks are declared
  if (me === undefined) {
    return <p className="text-gray-500">Loading...</p>;
  }
  if (me === null || !me.workspace) {
    return null; // redirecting
  }

  const submissions = summary?.submissions ?? 0;
  const qualified = summary?.qualified ?? 0;

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

        {/* Logout button at bottom */}
        <div className="px-4 py-6 border-t border-gray-200">
          <SignOutButton redirectUrl="/home">
            <button className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition">
              Logout
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold capitalize">{activeView}</h1>
          <div className="text-lg font-medium text-gray-700">
            {workspaceName}
          </div>
        </div>

        {activeView === "instructions" && (
          <>
            <div className="bg-white rounded-lg shadow p-6 space-y-8">
              <h2 className="text-xl font-semibold mb-4">Setup Instructions</h2>
              <p className="text-gray-600">
                Use the snippet below to connect your form provider. Then test lead qualification.
              </p>
              <IntegrationSnippet
                workspaceName={me.workspace.workspace_name}
                appUrl="https://tally-enricher.vercel.app"
              />
              <div>
                <h3 className="text-lg font-semibold mb-2">Test Qualification</h3>
                <QualificationForm workspaceName={me.workspace.workspace_name} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 space-y-8">
              <h2 className="text-xl font-semibold mb-4">Slack (Optional)</h2>
              <a href={slackAuthorizeUrl}>
                <button>Connect Slack</button>
              </a>
            </div>
          </>
        )}


        {activeView === "summary" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <MetricCard label="Submissions" value={submissions} />
            <MetricCard label="Qualified Leads" value={qualified} />
            <MetricCard
              label={
                summary?.omissions && summary.omissions > 0
                  ? `Avg. Company Size (${summary.omissions} omitted)`
                  : "Avg. Company Size"
              }
              value={
                summary?.avgEmployees != null
                  ? summary.avgEmployees.toLocaleString()
                  : "No data"
              }
            />
          </div>
        )}

        {activeView === "analytics" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Analytics</h2>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Insights</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>
                  {insights
                    ? `${insights.qualifiedPct}% of form fills were qualified`
                    : "Loading…"}
                </li>
                <li>
                  {insights?.avgQualifiedEmployees
                    ? `Average company size of qualified lead was ${insights.avgQualifiedEmployees.toLocaleString()}`
                    : "Average company size of qualified lead: No data"}
                </li>
                <li>
                  {insights?.mostCommonSector
                    ? `Most common vertical was ${insights.mostCommonSector}`
                    : "Most common vertical: No data"}
                </li>
                <li>
                  {insights
                    ? `Average funding raised was ${formatMillions(
                      insights.avgFunding
                    )}${insights.fundingOmissions > 0
                      ? ` (${insights.fundingOmissions} omitted)`
                      : ""
                    }`
                    : "Loading…"}
                </li>

              </ul>
            </div>

            {/* Actions */}
            {/* <div>
              <h3 className="text-lg font-semibold mb-2">Actions</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>(FAKE) Consider changing thresholds to be lower – aim for 100% qualified</li>
                <li>(FAKE) Consider running marketing campaign to target VP Eng</li>
                <li>(FAKE) Consider running this Google ad</li>
              </ul>
            </div> */}
          </div>
        )}

        {activeView === "config" && (
          <>
            <div className="bg-white rounded-lg shadow p-6 space-y-8">
              <h2 className="text-xl font-semibold mb-4">Workspace Configuration</h2>
              <ConfigForm workspace={me.workspace} />
            </div>

            <div className="bg-white rounded-lg shadow p-6 space-y-8 mt-8">
              <h2 className="text-xl font-semibold mb-4">Link</h2>
              {me.workspace.workspace_name ? (
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

function MetricCard({
  label,
  value,
}: {
  label: string | number;
  value: string | number;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  );
}
