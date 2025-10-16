import { PreviewCard } from "@/app/components/PreviewCard";

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <div className="grid md:grid-cols-2 items-center gap-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600 mb-4">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            Live enrichment & lead qualification for your forms
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Turn every form submission into a{" "}
            <span className="underline decoration-emerald-300">
              scored, enriched lead
            </span>
             {" "} in seconds.
          </h1>
          <p className="mt-5 text-slate-600 text-lg">
            Instantly enrich company and contact data on form submission, apply
            your qualification rules, and route qualified leads to your booking
            calendar.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a
              href="#contact"
              className="px-5 py-3 rounded-2xl bg-slate-900 text-white hover:bg-slate-800"
            >
              Contact Sales
            </a>
            <a
              href="#how"
              className="px-5 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50"
            >
              See how it works
            </a>
          </div>
        </div>
        <div className="relative">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <PreviewCard />
          </div>
          <div className="absolute -bottom-6 -left-6 -z-10 size-40 rounded-3xl bg-emerald-100 blur-2xl opacity-70" />
        </div>
      </div>
    </section>
  );
}