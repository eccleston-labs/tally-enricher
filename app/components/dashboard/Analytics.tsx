interface Insights {
  qualifiedPct: number;
  avgQualifiedEmployees: number | null;
  mostCommonSector: string | null;
  avgFunding: number | null;
  fundingOmissions: number;
}

interface AnalyticsProps {
  insights?: Insights | null; // keep it optional/null for loading state
}

export default function Analytics({ insights }: AnalyticsProps) {

    const formatMillions = (num: number | null | undefined) => {
        if (num == null) return "No data";
        return `$${(num / 1_000_000).toFixed(0)}m`;
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Analytics</h2>
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Insights</h3>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>
                        {insights
                            ? `${insights.qualifiedPct}% of form fills were qualified`
                            : "Loading…"}
                    </li>
                    <li>
                        {insights?.avgQualifiedEmployees
                            ? `Average company size of qualified lead was ${insights.avgQualifiedEmployees.toLocaleString()}`
                            : "Average company size of qualified lead: No data"}
                    </li>
                    <li>
                        {insights?.mostCommonSector
                            ? `Most common vertical was ${insights.mostCommonSector}`
                            : "Most common vertical: No data"}
                    </li>
                    <li>
                        {insights
                            ? `Average funding raised was ${formatMillions(
                                insights.avgFunding
                            )}${insights.fundingOmissions > 0
                                ? ` (${insights.fundingOmissions} omitted)`
                                : ""
                            }`
                            : "Loading…"}
                    </li>

                </ul>
            </div>
        </div>
    );
}