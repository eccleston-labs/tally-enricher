import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { redirect } from "next/navigation";

import {
    enrichDomain,
    enrichPerson,
    extractDomainFromEmail,
    qualifyLead,
    getWorkspaceWithCache,
} from "@/lib";

const GRANOLA_SLACK_URL =
    "https://hooks.slack.com/services/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";

// 🔔 New workflow trigger webhook (Slack Workflow Builder)
const SLACK_TRIGGER_URL =
    "https://hooks.slack.com/triggers/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";

export default async function HomePage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const startTime = performance.now();
    const params = await searchParams;

    const email = params.email as string;
    const workspaceName = params.workspace_name as string;

    const firstName = (params.first_name as string | undefined) ?? undefined;
    const lastName = (params.last_name as string | undefined) ?? undefined;

    if (!email || !workspaceName) {
        if (process.env.NODE_ENV !== "development") {
            if (workspaceName === "granola") {
                await fetch(GRANOLA_SLACK_URL, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ error: "Missing email or workspace_name parameter" }),
                });
            }
        }
        redirect("https://example.com/error");
    }

    const emailFormatted = decodeURIComponent(email);
    const domain = extractDomainFromEmail(emailFormatted);

    if (!domain) {
        if (process.env.NODE_ENV !== "development") {
            if (workspaceName === "granola") {
                await fetch(GRANOLA_SLACK_URL, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ error: "Invalid email format" }),
                });
            }
        }
        redirect("https://example.com/error");
    }

    // Profile parallel API calls
    const [workspace, enrichmentData, personData] = await Promise.all([
        getWorkspaceWithCache(workspaceName),
        enrichDomain(domain),
        firstName && lastName // only enrich person if both names are provided
            ? enrichPerson(firstName, lastName, domain)
            : Promise.resolve(null),
    ]);

    if (!workspace) {
        if (process.env.NODE_ENV !== "development") {
            if (workspaceName === "granola") {
                await fetch(GRANOLA_SLACK_URL, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ error: "Workspace not found" }),
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
        firstName,
        lastName,
        personData,
    });

    // Non-blocking analytics: don't await!
    if (process.env.NODE_ENV !== "development") {
        if (workspaceName === "granola") {
            await fetch(GRANOLA_SLACK_URL, {
                method: "POST",
                headers: { "content-type": "application/json" },
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
        firstName,
        lastName,
        linkedin: personData?.linkedinUrl ?? undefined,
        jobTitle: personData?.jobTitle ?? undefined,
        companyName: personData?.company ?? undefined,
        location: personData?.location ?? undefined,
    }).catch(() => { });


    function normalizeUrl(url: string | undefined, fallback: string) {
        if (!url) return fallback;
        if (url.startsWith("http://") || url.startsWith("https://")) return url;
        return `https://${url}`;
    }

    const successUrl = normalizeUrl(workspace.booking_url, "https://example.com/success");
    const disqualifyUrl = normalizeUrl(workspace.success_page_url, "https://example.com/disqualify");

    if (qualified.result) {
        console.log(enrichmentData);
        try {
            // 🔐 Securely fetch Slack secrets server-side
            const tokenResult = await fetchQuery(api.workspaces.getSlackToken, {
                name: workspaceName,
            });
            const channelId = await fetchQuery(api.workspaces.getSlackChannel, {
                workspace_name: workspaceName,
            });

            console.log("Slack token result:", tokenResult);
            console.log("Slack channel ID:", channelId);

            if (tokenResult?.slack_access_token && channelId) {
                // Ensure bot is in the channel
                const joinResp = await fetch("https://slack.com/api/conversations.join", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${tokenResult.slack_access_token}`,
                    },
                    body: JSON.stringify({ channel: channelId }),
                });

                const joinData = await joinResp.json();
                // console.log("Slack join response:", joinData);

                // capitalise
                const companyName =
                    enrichmentData.name && enrichmentData.name.length > 0
                        ? enrichmentData.name.charAt(0).toUpperCase() + enrichmentData.name.slice(1)
                        : "Unknown";

                // Send the formatted message
                const postResp = await fetch("https://slack.com/api/chat.postMessage", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${tokenResult.slack_access_token}`,
                    },
                    body: JSON.stringify({
                        channel: channelId,
                        text: `${companyName} (${domain}) was qualified!${personData?.jobTitle ? ` – ${firstName} ${lastName}, ${personData.jobTitle}, ${personData.linkedinUrl}` : ""
                            }`,
                    }),
                });

                const postData = await postResp.json();
                // console.log("Slack postMessage response:", postData);

                if (!postData.ok) {
                    console.error("Slack API error:", postData.error);
                }
            } else {
                console.warn("Missing Slack token or channel ID, skipping Slack message.");
            }
        } catch (err) {
            console.error("Failed to post Slack message:", err);
        }

        redirect(successUrl);
    }



    redirect(disqualifyUrl);
}
