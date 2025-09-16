export interface EnrichmentData {
  employees: number | null;
  funding: number | null;
  type: string | null;
  size: string | null;
}

export interface WorkspaceCriteria {
  min_employees: number;
  min_funding_usd: number;
  min_revenue_usd: number;
}

export interface QualificationResult {
  result: boolean;
  reason: string;
}
