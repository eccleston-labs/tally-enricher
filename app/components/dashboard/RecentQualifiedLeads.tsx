interface Lead {
  companyName: string;
  domain: string;
  size: string | null;
  sector: string | null;
  createdAt: string;
}

export default function RecentQualifiedLeads({ leads }: { leads?: Lead[] }) {
  if (!leads) return <p className="text-gray-500">Loading…</p>;
  if (leads.length === 0) return <p>No qualified leads yet.</p>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-2">Recent Qualified Leads</h2>
      <p className="text-gray-600 mb-4">
        A list of the most recent leads that have been qualified.
      </p>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b text-gray-500 text-sm">
            <th className="py-2">Company</th>
            <th>Domain</th>
            <th>Company Size</th>
            <th>Sectors</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-2 font-medium">{lead.companyName}</td>
              <td className="text-gray-600">{lead.domain}</td>
              <td>{lead.size ?? "—"}</td>
              <td>{lead.sector ?? "—"}</td>
              <td>
                {new Date(lead.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
