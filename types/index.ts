export interface EnrichmentData {
  name: string | null;
  employees: number | null;
  funding: number | null;
  sector: string | null;
  size: string | null;
}

export interface WorkspaceCriteria {
  min_employees?: number | undefined;
  min_funding_usd?: number | undefined;
  min_revenue_usd?: number | undefined;
}

export interface QualificationResult {
  result: boolean;
  reason: string;
}
