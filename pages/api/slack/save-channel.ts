import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { channelId } = req.body;

  // TODO: update your workspace row in DB with this channelId
  console.log("Saving Slack channel:", channelId);

  res.status(200).json({ success: true });
}
