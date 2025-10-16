import React from "react";

type Support = "yes" | "no" | "partial";
type Row = {
    name: string;
    instantBooking: Support;      // book meeting right after form submit
    builtInEnrichment: Support;   // has its own enrichment
    byoEnrichment: Support;       // lets you bring Clearbit/PDL/etc.
    crmIntegrations: Support;     // HubSpot/SFDC routing integration
    notes?: string;
};

const rows: Row[] = [
    {
        name: "AssemblyGTM",
        instantBooking: "yes",
        builtInEnrichment: "yes",
        byoEnrichment: "yes",
        crmIntegrations: "partial",
    },
    {
        name: "Chili Piper",
        instantBooking: "yes",
        builtInEnrichment: "partial",
        byoEnrichment: "yes",
        crmIntegrations: "yes",
    },
    {
        name: "Default.com",
        instantBooking: "yes",        
        builtInEnrichment: "no",      // no built-in data enrichment
        byoEnrichment: "partial",     // possible via Zapier/webhooks but not native
        crmIntegrations: "partial",   
    },
    {
        name: "Calendly Routing",
        instantBooking: "yes",
        builtInEnrichment: "partial",
        byoEnrichment: "partial",
        crmIntegrations: "yes",
    },
    {
        name: "Cal.com Routing Forms",
        instantBooking: "yes",
        builtInEnrichment: "no",
        byoEnrichment: "yes",
        crmIntegrations: "partial",
    },
    {
        name: "RevenueHero",
        instantBooking: "yes",
        builtInEnrichment: "partial",
        byoEnrichment: "yes",
        crmIntegrations: "yes",
    },
    {
        name: "LeanData BookIt",
        instantBooking: "yes",
        builtInEnrichment: "partial",
        byoEnrichment: "yes",
        crmIntegrations: "yes",
    },
    {
        name: "Drift Fastlane",
        instantBooking: "partial",
        builtInEnrichment: "partial",
        byoEnrichment: "yes",
        crmIntegrations: "yes",
    },
    {
        name: "Qualified.com",
        instantBooking: "partial",
        builtInEnrichment: "partial",
        byoEnrichment: "yes",
        crmIntegrations: "yes",
    },
    {
        name: "Clearbit Forms",
        instantBooking: "no",
        builtInEnrichment: "yes",
        byoEnrichment: "no",
        crmIntegrations: "partial",
    },
    {
        name: "ZoomInfo FormComplete",
        instantBooking: "no",
        builtInEnrichment: "yes",
        byoEnrichment: "no",
        crmIntegrations: "partial",
    },
];

function Cell({ v }: { v: Support }) {
    const map: Record<Support, { label: string; className: string }> = {
        yes: { label: "✓", className: "text-emerald-600" },
        partial: { label: "◐", className: "text-amber-600" },
        no: { label: "—", className: "text-slate-400" },
    };
    const { label, className } = map[v];
    return <span className={`font-semibold ${className}`}>{label}</span>;
}

export default function CompetitorTable() {
    return (
        <section className="mx-auto max-w-6xl px-4 pb-12">
            <h3 className="text-xl font-semibold mb-4">Compare alternatives</h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium">Product</th>
                            <th className="px-4 py-3 font-medium">Instant form→meeting</th>
                            <th className="px-4 py-3 font-medium">Built-in enrichment</th>
                            <th className="px-4 py-3 font-medium">BYO enrichment</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={r.name} className={i % 2 ? "bg-white" : "bg-slate-50/30"}>
                                <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                                <td className="px-4 py-3 text-center"><Cell v={r.instantBooking} /></td>
                                <td className="px-4 py-3 text-center"><Cell v={r.builtInEnrichment} /></td>
                                <td className="px-4 py-3 text-center"><Cell v={r.byoEnrichment} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
