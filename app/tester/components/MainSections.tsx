export function MainSections() {
    return (
        <section id="features" className="mx-auto max-w-6xl px-4 py-16 grid md:grid-cols-3 gap-6">
            {[
                {
                    title: "Instant Enrichment",
                    body: "Enrich company & contact in real‑time using your preferred data sources.",
                },
                {
                    title: "Rules that Match You",
                    body: "Set thresholds for employees, funding, revenue, geo, ICP fit, tech stack, and more.",
                },
                {
                    title: "Smart Routing",
                    body: "Qualified leads go to booking; others get a tailored success path and follow‑up.",
                },
            ].map((f) => (
                <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-3 size-8 rounded-xl bg-emerald-200" />
                    <h3 className="font-semibold text-lg">{f.title}</h3>
                    <p className="text-slate-600 text-sm mt-1">{f.body}</p>
                </div>
            ))}

            <div id="how" className="md:col-span-3 mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-xl">How it works</h3>
                <ol className="mt-4 grid md:grid-cols-3 gap-4 text-sm text-slate-600">
                    <li className="rounded-xl border border-slate-200 p-4">
                        <span className="text-slate-900 font-medium">1) Drop in our form snippet</span>
                        <div className="mt-2">Or connect your provider (Tally, Typeform, Webflow, HubSpot, custom).</div>
                    </li>
                    <li className="rounded-xl border border-slate-200 p-4">
                        <span className="text-slate-900 font-medium">2) We enrich & score</span>
                        <div className="mt-2">People & company data in seconds. Your rules decide qualification.</div>
                    </li>
                    <li className="rounded-xl border border-slate-200 p-4">
                        <span className="text-slate-900 font-medium">3) Route the outcome</span>
                        <div className="mt-2">Qualified ➜ booking. Others ➜ success page, nurture, or SDR queue.</div>
                    </li>
                </ol>
            </div>
        </section>
    );
}