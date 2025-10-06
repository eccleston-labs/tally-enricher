import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { redirect } from "next/navigation";

import {
  enrichDomain,
  extractDomainFromEmail,
  qualifyLead,
  getWorkspaceWithCache,
} from "@/lib";

const GRANOLA_SLACK_URL =
  "https://hooks.slack.com/services/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";

const SUCCESS_REDIRECT = "https://cal.com/dom-eccleston/30min";
const DISQUALIFY_REDIRECT = "https://granola.ai/";

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
    if (process.env.NODE_ENV !== "development") {
      if (workspaceName === "granola") {
        await fetch(GRANOLA_SLACK_URL, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            error: "Missing email or workspace_name parameter",
          }),
        });
      }
    }
    redirect(DISQUALIFY_REDIRECT);
  }

  const emailFormatted = decodeURIComponent(email);
  console.log(emailFormatted);
  const domain = extractDomainFromEmail(emailFormatted);

  if (!domain) {
    if (process.env.NODE_ENV !== "development") {
      if (workspaceName === "granola") {
        await fetch(GRANOLA_SLACK_URL, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            error: "Invalid email format",
          }),
        });
      }
    }
    redirect(DISQUALIFY_REDIRECT);
  }

  // Profile parallel API calls
  const apiStart = performance.now();
  const [workspace, enrichmentData] = await Promise.all([
    getWorkspaceWithCache(workspaceName),
    enrichDomain(domain),
  ]);
  const apiTime = performance.now() - apiStart;

  if (!workspace) {
    if (process.env.NODE_ENV !== "development") {
      if (workspaceName === "granola") {
        await fetch(GRANOLA_SLACK_URL, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            error: "Workspace not found",
          }),
        });
      }
    }
    redirect(DISQUALIFY_REDIRECT);
  }

  const qualified = qualifyLead(enrichmentData, workspace.criteria);

  const fieldsStr = JSON.stringify({
    email,
    domain,
    workspace,
    enrichmentData,
    qualified,
  });

  // Non-blocking analytics: don't await!
  const analyticsStart = performance.now();

  if (process.env.NODE_ENV !== "development") {
    if (workspaceName === "granola") {
      console.log("running");
      const res = await fetch(GRANOLA_SLACK_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          text: fieldsStr,
        }),
      });
      console.log(res.status);
      const data = await res.text();
      console.log({ data });
    }
    fetchMutation(api.analytics.insert, {
      event: "lead_qualification",
      email,
      domain,
      workspaceName,
      qualified,
      ts: Date.now(),
    }).catch(() => {});
  }
  const analyticsTime = performance.now() - analyticsStart;

  const totalTime = performance.now() - startTime;

  if (qualified.result) {
    redirect(SUCCESS_REDIRECT);
  }

  redirect(DISQUALIFY_REDIRECT);
}
