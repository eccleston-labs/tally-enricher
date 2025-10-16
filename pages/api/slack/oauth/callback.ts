import type { NextApiRequest, NextApiResponse } from "next";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const code = req.query.code as string;
  const workspaceName = req.query.state as string; // 👈 comes from your authorize URL

  if (!code || !workspaceName) {
    return res.status(400).send("Missing code or workspace name");
  }

  const response = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.SLACK_CLIENT_ID!,         // secret
      client_secret: process.env.SLACK_CLIENT_SECRET!, // secret
      redirect_uri: process.env.SLACK_REDIRECT_URI!,
    }),
  });

  const data = await response.json();

  if (!data.ok) {
    console.error("Slack OAuth error", data);
    return res.status(400).send("Slack OAuth failed");
  }

  const accessToken = data.access_token as string;

  try {
    // 🔑 Persist the Slack token against the correct workspace row
    await fetchMutation(api.workspaces.setSlackToken, {
      workspace_name: workspaceName,
      slack_access_token: accessToken,
    });
  } catch (err) {
    console.error("Failed to save Slack token", err);
    return res.status(500).send("Could not save Slack token");
  }

  // ✅ Redirect back to dashboard
  res.redirect("/dashboard?slack=connected");
}
