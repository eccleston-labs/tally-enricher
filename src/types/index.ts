export interface EnrichmentData {
  employees: number | null;
  funding: number | null;
  type: string | null;
  size: string | null;
}

export interface WorkspaceCriteria {
  min_employees: number | null;
  min_funding_usd: number | null;
  min_revenue_usd: number | null;
}

export interface QualificationResult {
  result: boolean;
  reason: string;
}
