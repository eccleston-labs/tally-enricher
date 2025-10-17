// pages/api/slack/channels.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { workspaceName } = req.query;

    if (typeof workspaceName !== "string") {
      return res.status(400).json({ error: "Missing workspaceName" });
    }

    // 1. Look up the Slack token + channel ID from Convex
    const tokenResult = await fetchQuery(api.workspaces.getSlackToken, {
      name: workspaceName,
    });

    if (!tokenResult?.slack_access_token) {
      // Not connected yet — just return that state
      return res.status(200).json({
        connected: false,
        channels: [],
        savedChannelId: null,
      });
    }

    const savedChannelId = await fetchQuery(api.workspaces.getSlackChannel, {
      workspace_name: workspaceName,
    });

    // 2. Call Slack API to list channels
    const resp = await fetch("https://slack.com/api/conversations.list", {
      headers: {
        Authorization: `Bearer ${tokenResult.slack_access_token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await resp.json();

    if (!data.ok) {
      console.error("Slack API error:", data);
      return res.status(400).json({
        connected: true,
        channels: [],
        savedChannelId: savedChannelId ?? null,
        slackError: data.error,
      });
    }

    // 3. Return a safe payload: no tokens
    return res.status(200).json({
      connected: true,
      channels: data.channels,
      savedChannelId: savedChannelId ?? null,
    });
  } catch (err) {
    console.error("Unexpected error in /api/slack/channels:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
