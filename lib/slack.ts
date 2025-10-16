const SLACK_CLIENT_ID = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID!;
const SLACK_REDIRECT_URI = process.env.NEXT_PUBLIC_SLACK_REDIRECT_URI!; // your vercel branch callback

export const slackAuthorizeUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=chat:write,channels:read&redirect_uri=${encodeURIComponent(
  SLACK_REDIRECT_URI
)}`;