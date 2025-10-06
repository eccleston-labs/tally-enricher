import type { NextApiRequest, NextApiResponse } from "next";
import { getWorkspaceWithCache, enrichDomain, qualifyLead } from "@/lib";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, workspaceName } = req.body as { email: string; workspaceName: string };
  const workspace = await getWorkspaceWithCache(workspaceName);

  if (!workspace || !workspace.criteria) {
    return res.status(404).json({ error: "Workspace or criteria not found" });
  }

  console.log("Workspace criteria found:", workspace.criteria);

  const domain = email.split("@")[1];
  const enrichmentData = await enrichDomain(domain);
  const result = qualifyLead(enrichmentData, workspace.criteria);

  console.log("PDL enrichment data:", enrichmentData);
  console.log("Qualification result:", result);         

  res.status(200).json(result);
}