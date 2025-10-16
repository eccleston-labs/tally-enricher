import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: look up access_token for this user's workspace from DB
  const accessToken = "...";

  const resp = await fetch("https://slack.com/api/conversations.list", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await resp.json();
  if (!data.ok) {
    return res.status(400).json({ error: "Failed to fetch channels" });
  }

  res.status(200).json({ channels: data.channels });
}
