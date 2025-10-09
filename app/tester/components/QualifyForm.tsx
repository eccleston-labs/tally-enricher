export function QualifyForm() {
  return (
    <section id="contact" className="mx-auto max-w-6xl px-4 pb-16">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Contact Us</h3>
            <p className="text-slate-600 mb-6">
              Interested in a preview or have questions? Book a call with our team to see how we can help you qualify and route leads instantly.
            </p>
            <a
              href="https://cal.com/gabe-assemblygtm/60mins"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-5 py-3 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition"
            >
              Book a call
            </a>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="font-semibold">Why teams choose us</h4>
            <ul className="mt-3 list-disc pl-5 text-sm text-slate-600 space-y-2">
              <li>Connects with your existing forms - no rebuild required.</li>
              <li>Real-time enrichment with your preferred providers (PDL, Clearbit, etc.).</li>
              <li>Deterministic rules that reflect your ICP.</li>
              <li>One-click routing to Calendly/Cal.com for qualified leads.</li>
              <li>Webhook + CSV export for ops visibility.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}