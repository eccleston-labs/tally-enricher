"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConfigForm } from "@/components/ConfigForm";
import { IntegrationSnippet } from "@/components/form/integration-snippet";
import { QualificationForm } from "@/components/form/qualification-form";

import Sidebar from "@/app/components/dashboard/Sidebar";
import SlackChannelSelector from "@/app/components/dashboard/SlackChannelSelector";
import Analytics from "@/app/components/dashboard/Analytics";

const SIDEBAR_ITEMS = [
  { key: "instructions", label: "Instructions" },
  { key: "summary", label: "Summary" },
  { key: "analytics", label: "Analytics" },
  { key: "config", label: "Config" },
  { key: "settings", label: "Settings" },
];

const SLACK_CLIENT_ID = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID!;
const SLACK_REDIRECT_URI = process.env.NEXT_PUBLIC_SLACK_REDIRECT_URI!;

export default function DashboardPage() {
  const me = useQuery(api.users.me, {});
  const router = useRouter();
  const [activeView, setActiveView] = useState("instructions");

  const workspaceName = me?.workspace?.workspace_name;

  // For slack Oauth
  let slackAuthorizeUrl: string | undefined;
  if (typeof workspaceName === "string") {
    slackAuthorizeUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=chat:write,channels:read&redirect_uri=${encodeURIComponent(
      SLACK_REDIRECT_URI
    )}&state=${encodeURIComponent(workspaceName)}`;
  }

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

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        items={SIDEBAR_ITEMS}
        activeView={activeView}
        setActiveView={setActiveView}
      />

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

            <div className="bg-white rounded-lg shadow p-6 space-y-8 mt-8">
              <h2 className="text-xl font-semibold mb-4">Slack (Optional)</h2>

              {workspaceName && (
                <SlackChannelSelector
                  workspaceName={workspaceName}
                  slackAuthorizeUrl={slackAuthorizeUrl}
                />
              )}
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
          <Analytics insights={insights} />
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

