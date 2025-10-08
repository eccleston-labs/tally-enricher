import { useState, useMemo } from "react";
import { GoogleButton } from "./GoogleButton";
import { TextField } from "@/app/tester/components/TextField";
import { PriceCard } from "@/app/tester/components/PriceCard";

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

export function QualifyForm() {
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

    function onChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) {
        const { name, value, type } = e.target;

        setValues((v) => ({
            ...v,
            [name]: type === "checkbox"
                ? (e.target as HTMLInputElement).checked
                : value,
        }));
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
                            <textarea name="useCase" value={values.useCase} onChange={onChange} rows={3} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10" placeholder="Tell us what you’re trying to automate…" />
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