"use client";
import React, { useMemo, useState } from "react";

/**
 * SALES-QUALIFIER LANDING PAGE (single-file React component)
 * ---------------------------------------------------------
 * What it includes:
 *  - Hero section w/ value prop & primary CTAs
 *  - Google sign-in button (points to /auth/google by default)
 *  - Contact Sales form that QUALIFIES the lead client-side
 *  - If qualified ➜ redirect to BOOKING_URL
 *  - If not qualified ➜ redirect to SUCCESS_URL ("Thanks, we'll be in touch")
 *  - Feature cards, How it Works, Logos placeholder, FAQ, Footer
 *  - Tailwind classes for clean styling (works in this preview)
 *  - Simple client-side validation & helpful inline errors
 *
 * How to adapt quickly:
 *  - Tweak CONFIG thresholds/URLs below.
 *  - Swap /auth/google for your real OAuth URL.
 *  - Replace placeholder logos, copy, and FAQs.
 */

const CONFIG = {
  BOOKING_URL: "https://calendly.com/your-link", // Qualified leads
  SUCCESS_URL: "https://yoursite.com/thanks",     // Other leads
  ENABLED_CRITERIA: {
    employees: true,
    funding: true,
    revenue: true,
  },
  MINIMUMS: {
    employees: 400,
    fundingUSD: 100_000_000, // 100M
    revenueUSD: 50_000_000,  // 50M
  },
};

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900">
      <SiteHeader />
      <Hero />
      <TrustLogos />
      <MainSections />
      <QualifyForm />
      <FAQ />
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-slate-900" />
          <span className="font-semibold">QualiForm</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
          <a href="#features" className="hover:text-slate-900">Features</a>
          <a href="#how" className="hover:text-slate-900">How it works</a>
          <a href="#pricing" className="hover:text-slate-900">Pricing</a>
          <a href="#faq" className="hover:text-slate-900">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <a href="/login" className="px-3 py-2 rounded-xl text-sm hover:bg-slate-100">Log in</a>
          <a href="#contact" className="px-3 py-2 rounded-xl text-sm bg-slate-900 text-white hover:bg-slate-800">Contact Sales</a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <div className="grid md:grid-cols-2 items-center gap-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600 mb-4">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            Live enrichment & lead qualification for your forms
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Turn every form submission into a <span className="underline decoration-emerald-300">scored, enriched lead</span>—in seconds.
          </h1>
          <p className="mt-5 text-slate-600 text-lg">
            We enrich company and contact data the moment someone submits your form, apply your
            qualification rules (employees, revenue, funding, and more), then route qualified leads straight
            to your booking calendar. Everyone else gets a friendly follow‑up.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a href="#contact" className="px-5 py-3 rounded-2xl bg-slate-900 text-white hover:bg-slate-800">Contact Sales</a>
            <a href="#how" className="px-5 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50">See how it works</a>
          </div>
          <div className="mt-6 text-xs text-slate-500">SOC 2 friendly • GDPR ready • No code snippet lock‑in</div>
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

function PreviewCard() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-28 rounded bg-slate-200" />
      <div className="h-10 w-full rounded-xl bg-slate-100" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-10 rounded-xl bg-slate-100" />
        <div className="h-10 rounded-xl bg-slate-100" />
      </div>
      <div className="h-10 w-full rounded-xl bg-slate-100" />
      <div className="flex gap-2">
        <div className="h-9 w-28 rounded-xl bg-slate-900" />
        <div className="h-9 w-28 rounded-xl bg-slate-200" />
      </div>
      <div className="text-[10px] text-slate-500">* Qualified ➜ auto‑book. Otherwise ➜ thank‑you page.</div>
    </div>
  );
}

function TrustLogos() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="text-center text-xs uppercase tracking-wider text-slate-500 mb-4">Trusted by modern GTM teams</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6 opacity-70">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 rounded bg-slate-200" />
        ))}
      </div>
    </section>
  );
}

function MainSections() {
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

function GoogleButton({ href = "/auth/google" }: { href?: string }) {
  return (
    <a
      href={href}
      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
    >
      <svg width="18" height="18" viewBox="0 0 48 48" className="-ml-1" aria-hidden>
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.879 32.66 29.387 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C33.779 6.053 29.136 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"/>
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.297 16.108 18.799 12 24 12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C33.779 6.053 29.136 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
        <path fill="#4CAF50" d="M24 44c5.304 0 10.102-2.037 13.73-5.343l-6.343-5.366C29.345 34.723 26.833 36 24 36c-5.364 0-9.877-3.356-11.29-8.017l-6.58 5.065C9.45 39.556 16.12 44 24 44z"/>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.36 3.66-4.682 6.343-8.303 6.343-5.364 0-9.877-3.356-11.29-8.017l-6.58 5.065C9.45 39.556 16.12 44 24 44c8.837 0 16-7.163 16-16 0-1.341-.138-2.651-.389-3.917z"/>
      </svg>
      Continue with Google
    </a>
  );
}

function QualifyForm() {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const initial = {
    fullName: "",
    workEmail: "",
    company: "",
    domain: "",
    website: "",
    employees: "",
    revenueUSD: "",
    fundingUSD: "",
    useCase: "",
    accept: false,
  };

  const [values, setValues] = useState(initial);

  const criteriaSummary = useMemo(() => {
    const e = CONFIG.ENABLED_CRITERIA;
    const m = CONFIG.MINIMUMS;
    const active: string[] = [];
    if (e.employees) active.push(`${m.employees.toLocaleString()}+ employees`);
    if (e.funding) active.push(`$${m.fundingUSD.toLocaleString()}+ funding`);
    if (e.revenue) active.push(`$${m.revenueUSD.toLocaleString()}+ revenue`);
    return active.join(" • ");
  }, []);

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type, checked } = e.target as any;
    setValues((v) => ({ ...v, [name]: type === "checkbox" ? checked : value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!values.fullName.trim()) next.fullName = "Please enter your name";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.workEmail)) next.workEmail = "Enter a valid work email";
    if (!values.company.trim()) next.company = "Company is required";
    if (!values.domain.trim() && !values.website.trim()) next.domain = "Add a company domain or website";
    if (!values.accept) next.accept = "You must accept the privacy terms";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function toNumber(v: string): number {
    const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }

  function isQualified(): boolean {
    const e = CONFIG.ENABLED_CRITERIA;
    const m = CONFIG.MINIMUMS;
    const employees = toNumber(values.employees);
    const funding = toNumber(values.fundingUSD);
    const revenue = toNumber(values.revenueUSD);

    // Rule: must meet ALL enabled thresholds
    if (e.employees && employees < m.employees) return false;
    if (e.funding && funding < m.fundingUSD) return false;
    if (e.revenue && revenue < m.revenueUSD) return false;
    return true;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      // OPTIONAL: send to your backend
      // await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });

      const qualified = isQualified();
      const dest = qualified ? CONFIG.BOOKING_URL : CONFIG.SUCCESS_URL;
      const params = new URLSearchParams({
        q: qualified ? "1" : "0",
        email: values.workEmail,
        domain: values.domain || values.website,
        employees: values.employees || "",
      });

      window.location.href = `${dest}?${params.toString()}`;
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="contact" className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold">Contact Sales</h3>
          <p className="text-sm text-slate-600 mt-1">
            Tell us a little about your team. If you meet your qualification criteria ({criteriaSummary}),
            we’ll send you straight to our booking calendar.
          </p>

          <div className="mt-4">
            <GoogleButton />
          </div>

          <div className="my-4 flex items-center gap-2">
            <div className="h-[1px] flex-1 bg-slate-200" />
            <span className="text-xs text-slate-500">or</span>
            <div className="h-[1px] flex-1 bg-slate-200" />
          </div>

          <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Full name" name="fullName" value={values.fullName} onChange={onChange} error={errors.fullName} />
            <TextField label="Work email" name="workEmail" type="email" value={values.workEmail} onChange={onChange} error={errors.workEmail} />
            <TextField label="Company" name="company" value={values.company} onChange={onChange} error={errors.company} />
            <TextField label="Company domain" name="domain" placeholder="acme.com" value={values.domain} onChange={onChange} error={errors.domain} />
            <TextField label="Website (optional)" name="website" placeholder="https://acme.com" value={values.website} onChange={onChange} />
            <TextField label="Employees" name="employees" type="number" placeholder="e.g. 500" value={values.employees} onChange={onChange} />
            <TextField label="Annual revenue (USD)" name="revenueUSD" type="number" placeholder="e.g. 50000000" value={values.revenueUSD} onChange={onChange} />
            <TextField label="Total funding (USD)" name="fundingUSD" type="number" placeholder="e.g. 100000000" value={values.fundingUSD} onChange={onChange} />
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Use case</label>
              <textarea name="useCase" value={values.useCase} onChange={onChange} rows={3} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10" placeholder="Tell us what you’re trying to automate…"/>
            </div>
            <div className="sm:col-span-2 flex items-start gap-2 mt-1">
              <input id="accept" name="accept" type="checkbox" checked={values.accept} onChange={onChange} className="mt-1 size-4 rounded border-slate-300" />
              <label htmlFor="accept" className="text-sm text-slate-600">I agree to the <a href="#" className="underline">Privacy Policy</a> and allow you to contact me.</label>
            </div>
            {errors.accept && <p className="sm:col-span-2 text-xs text-red-600">{errors.accept}</p>}

            <div className="sm:col-span-2 mt-2 flex items-center justify-between">
              <div className="text-xs text-slate-500">We’ll never sell your data. SOC 2 & GDPR ready.</div>
              <button disabled={submitting} className="px-5 py-2 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60">
                {submitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="font-semibold">Why teams choose us</h4>
            <ul className="mt-3 list-disc pl-5 text-sm text-slate-600 space-y-2">
              <li>Connects with your existing forms—no rebuild required.</li>
              <li>Real-time enrichment with your preferred providers (PDL, Clearbit, etc.).</li>
              <li>Deterministic rules that reflect your ICP—no black box scoring.</li>
              <li>One-click routing to Calendly/Cal.com for qualified leads.</li>
              <li>Webhook + CSV export for ops visibility.</li>
            </ul>
          </div>

          <div id="pricing" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="font-semibold">Simple pricing</h4>
            <p className="text-sm text-slate-600 mt-1">Start free. Scale as you grow.</p>
            <div className="mt-4 grid md:grid-cols-3 gap-3 text-sm">
              <PriceCard name="Starter" price="$0" blurb="100 enrichments/mo, 1 form" />
              <PriceCard name="Team" price="$199" blurb="5,000 enrichments/mo, 5 forms" highlight />
              <PriceCard name="Growth" price="$599" blurb="25,000 enrichments/mo, unlimited forms" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TextField({ label, name, value, onChange, type = "text", placeholder, error }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        className={`mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
          error ? "border-red-400" : "border-slate-300"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function PriceCard({ name, price, blurb, highlight = false }: any) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-baseline justify-between">
        <h5 className="font-semibold">{name}</h5>
        <div className="text-lg font-semibold">{price}<span className="text-xs font-normal text-slate-500">/mo</span></div>
      </div>
      <p className="text-sm text-slate-600 mt-2">{blurb}</p>
      <button className="mt-3 w-full rounded-xl border border-slate-300 py-2 text-sm hover:bg-slate-50">Get started</button>
    </div>
  );
}

function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-6xl px-4 pb-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold">FAQ</h3>
        <dl className="mt-4 grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <dt className="font-medium">Do you store PII?</dt>
            <dd className="text-slate-600 mt-1">We store only what’s necessary to enrich & qualify. You can request deletion anytime.</dd>
          </div>
          <div>
            <dt className="font-medium">Which data providers do you support?</dt>
            <dd className="text-slate-600 mt-1">People Data Labs, Clearbit, Crunchbase, LinkedIn (via your legal integrations), and custom sources.</dd>
          </div>
          <div>
            <dt className="font-medium">How does qualification work?</dt>
            <dd className="text-slate-600 mt-1">Set thresholds for employees, funding, revenue, etc. If a lead meets all enabled rules, we route to booking automatically.</dd>
          </div>
          <div>
            <dt className="font-medium">Can I use my own form?</dt>
            <dd className="text-slate-600 mt-1">Yes—drop in our snippet or connect providers like Tally, Typeform, Webflow, HubSpot, or your custom backend.</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-600 flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-xl bg-slate-900" />
          <span className="font-medium">QualiForm</span>
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-900">Privacy</a>
          <a href="#" className="hover:text-slate-900">Security</a>
          <a href="#" className="hover:text-slate-900">Status</a>
          <a href="#" className="hover:text-slate-900">Docs</a>
        </div>
        <div className="text-xs">© {new Date().getFullYear()} QualiForm, Inc.</div>
      </div>
    </footer>
  );
}
