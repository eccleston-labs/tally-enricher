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
    // fallback redirect if no workspace info available
    redirect("https://example.com/error");
  }

  const emailFormatted = decodeURIComponent(email);
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
    redirect("https://example.com/error");
  }

  // Profile parallel API calls
  const [workspace, enrichmentData] = await Promise.all([
    getWorkspaceWithCache(workspaceName),
    enrichDomain(domain),
  ]);

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
    redirect("https://example.com/error");
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
  if (process.env.NODE_ENV !== "development") {
    if (workspaceName === "granola") {
      await fetch(GRANOLA_SLACK_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ text: fieldsStr }),
      });
    }
  }

  fetchMutation(api.analytics.insert, {
    event: "lead_qualification",
    email: emailFormatted,
    domain,
    workspaceName,
    qualified,
    ts: Date.now(),

    employees: enrichmentData.employees ?? undefined,
    funding: enrichmentData.funding ?? undefined,
    sector: enrichmentData.sector ?? undefined,
    size: enrichmentData.size ?? undefined,
  }).catch(() => { });

  // func for dev when url is localhost (http)
  function normalizeUrl(url: string | undefined, fallback: string) {
    if (!url) return fallback;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
  }

  // ✅ dynamic redirects
  const successUrl = normalizeUrl(workspace.booking_url, "https://example.com/success");
  const disqualifyUrl = normalizeUrl(workspace.success_page_url, "https://example.com/disqualify");

  if (qualified.result) {
    redirect(successUrl);
  }
  redirect(disqualifyUrl);
}
