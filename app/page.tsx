import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { redirect } from "next/navigation";

import {
  enrichDomain,
  extractDomainFromEmail,
  qualifyLead,
  getWorkspaceWithCache,
} from "@/lib";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const startTime = performance.now();

  const params = await searchParams;

  const email = params.email as string;
  const workspaceName = params.workspace_name as string;

  if (!email || !workspaceName) {
    return <div className="p-6">Missing email or workspace_name parameter</div>;
  }

  const domain = extractDomainFromEmail(email);

  if (!domain) {
    return <div className="p-6">Invalid email format</div>;
  }

  // Profile parallel API calls
  const apiStart = performance.now();
  const [workspace, enrichmentData] = await Promise.all([
    getWorkspaceWithCache(workspaceName),
    enrichDomain(domain),
  ]);
  const apiTime = performance.now() - apiStart;

  if (!workspace) {
    return <div className="p-6">Workspace not found</div>;
  }

  const qualified = qualifyLead(enrichmentData, workspace.criteria);

  // console.log("Qualification result:", qualified);
  if (qualified.result === true && workspace.booking_url) {
    // console.log("Redirecting to booking_url:", workspace.booking_url);
    redirect(workspace.booking_url);
  } else if (qualified.result === false && workspace.success_page_url) {
    // console.log("Redirecting to success_page_url:", workspace.success_page_url);
    redirect(workspace.success_page_url);
  }

  // Non-blocking analytics: don't await!
  const analyticsStart = performance.now();
  if (process.env.NODE_ENV !== "development") {
    fetchMutation(api.analytics.insert, {
      event: "lead_qualification",
      email,
      domain,
      workspaceName,
      qualified,
      ts: Date.now(),
    }).catch(() => { });
  }
  const analyticsTime = performance.now() - analyticsStart;

  const totalTime = performance.now() - startTime;

  return (
    <div className="p-6">
      <h1>Lead Qualifier</h1>
      <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
        <strong>⏱️ Performance:</strong>
        <br />- API calls (parallel): {apiTime.toFixed(2)}ms
        <br />- Analytics: {analyticsTime.toFixed(2)}ms
        <br />- <strong>Total: {totalTime.toFixed(2)}ms</strong>
      </div>
      <pre className="bg-gray-100 p-4 mt-4 rounded">
        {JSON.stringify(
          {
            email,
            domain,
            workspace,
            enrichmentData,
            qualified,
          },
          null,
          2,
        )}
      </pre>
    </div>
  );
}
