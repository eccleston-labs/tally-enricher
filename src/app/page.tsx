import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";

async function enrichDomain(domain: string) {
  if (!process.env.PDL_API_KEY) throw new Error("Missing PDL_API_KEY");

  try {
    const response = await fetch(
      "https://api.peopledatalabs.com/v5/company/enrich",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": process.env.PDL_API_KEY,
        },
        body: JSON.stringify({ website: domain }),
      },
    );

    if (!response.ok) return null;

    const data = await response.json();
    return {
      employees: data?.employee_count,
      funding: data?.total_funding_raised,
      type: data?.type,
      size: data?.size,
    };
  } catch {
    return null;
  }
}

function extractDomainFromEmail(email: string) {
  const parts = email.split("@");
  return parts.length === 2 ? parts[1] : null;
}

interface EnrichmentData {
  employees: number | null;
  funding: number | null;
  type: string | null;
  size: string | null;
}

interface WorkspaceCriteria {
  min_employees: number;
  min_funding_usd: number;
  min_revenue_usd: number;
}

interface QualificationResult {
  qualified: boolean;
  reason: string;
}

function qualifyLead(
  enrichmentData: EnrichmentData | null,
  criteria: WorkspaceCriteria | null,
): QualificationResult {
  // Handle null/missing data
  if (!enrichmentData || !criteria)
    return { qualified: false, reason: "missing_data" };

  const { employees, funding, type, size } = enrichmentData;
  const { min_employees, min_funding_usd } = criteria;

  // Auto-qualify public companies
  if (type === "public") return { qualified: true, reason: "public" };

  // Auto-qualify by size bucket
  if (size === "10001+") return { qualified: true, reason: "size" };

  // Check employee threshold
  if (employees && employees >= min_employees)
    return { qualified: true, reason: "employees" };

  // Check funding threshold
  if (funding && funding >= min_funding_usd)
    return { qualified: true, reason: "funding" };

  return { qualified: false, reason: "no criteria met" };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const startTime = performance.now();
  console.log("🚀 Page render started");

  // Profile search params
  const paramsStart = performance.now();
  const params = await searchParams;
  const paramsTime = performance.now() - paramsStart;
  console.log(`⏱️ Search params: ${paramsTime.toFixed(2)}ms`);

  const email = params.email as string;
  const workspaceName = params.workspace_name as string;

  if (!email || !workspaceName) {
    return <div className="p-6">Missing email or workspace_name parameter</div>;
  }

  // Profile domain extraction
  const domainStart = performance.now();
  const domain = extractDomainFromEmail(email);
  const domainTime = performance.now() - domainStart;
  console.log(`⏱️ Domain extraction: ${domainTime.toFixed(2)}ms`);

  if (!domain) {
    return <div className="p-6">Invalid email format</div>;
  }

  // Profile parallel API calls
  const apiStart = performance.now();
  const [workspace, enrichmentData] = await Promise.all([
    fetchQuery(api.workspaces.getByName, { name: workspaceName }),
    enrichDomain(domain),
  ]);
  const apiTime = performance.now() - apiStart;
  console.log(`⏱️ API calls (parallel): ${apiTime.toFixed(2)}ms`);

  // Profile qualification logic
  const qualificationStart = performance.now();
  const qualified = qualifyLead(enrichmentData, workspace.criteria);
  const qualificationTime = performance.now() - qualificationStart;
  console.log(`⏱️ Qualification logic: ${qualificationTime.toFixed(2)}ms`);

  const totalTime = performance.now() - startTime;
  console.log(`⏱️ Total page time: ${totalTime.toFixed(2)}ms`);

  return (
    <div className="p-6">
      <h1>Lead Qualifier</h1>
      <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
        <strong>⏱️ Performance:</strong>
        <br />- Search params: {paramsTime.toFixed(2)}ms
        <br />- Domain extraction: {domainTime.toFixed(2)}ms
        <br />- API calls (parallel): {apiTime.toFixed(2)}ms
        <br />- Qualification logic: {qualificationTime.toFixed(2)}ms
        <br />- <strong>Total: {totalTime.toFixed(2)}ms</strong>
      </div>
      <pre className="bg-gray-100 p-4 mt-4 rounded">
        {JSON.stringify(
          {
            email,
            domain,
            workspace,
            enrichmentData,
            qualified,
          },
          null,
          2,
        )}
      </pre>
    </div>
  );
}
