// pages/api/slack/save-channel.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { channelId, workspaceName } = req.body;

  if (typeof channelId !== "string" || typeof workspaceName !== "string") {
    return res.status(400).json({ error: "Missing channelId or workspaceName" });
  }

  try {
    await fetchMutation(api.workspaces.setSlackChannel, {
      workspace_name: workspaceName,
      slack_channel_id: channelId,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error saving Slack channel:", err);
    res.status(500).json({ error: "Failed to save channel" });
  }
}
