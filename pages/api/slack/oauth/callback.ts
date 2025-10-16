import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const code = req.query.code as string;

  const response = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.SLACK_CLIENT_ID!,      // keep secret
      client_secret: process.env.SLACK_CLIENT_SECRET!, // keep secret
      redirect_uri: process.env.SLACK_REDIRECT_URI!,
    }),
  });

  const data = await response.json();

  if (!data.ok) {
    console.error("Slack OAuth error", data);
    return res.status(400).send("Slack OAuth failed");
  }

  // Save access_token + team info in DB
  res.redirect("/dashboard");
}
