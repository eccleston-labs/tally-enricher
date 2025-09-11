/* eslint-disable @typescript-eslint/no-explicit-any */
type Answers = Record<string, string>;

export type EnrichedResult = {
    companyEnrichment?: any;
    derived: {
        email?: string;
        companyName?: string;
        seats?: number | null;
        companySize?: string | null;
        computers?: string | null;
        domain?: string | null;
    };
    debug?: { companyEnrichmentError?: { status: number; body: any } | string };
};

const toInt = (s?: string) => {
    if (!s) return null;
    const n = parseInt(s.replace(/[^\d]/g, ""), 10);
    return Number.isFinite(n) ? n : null;
};

const domainFromEmail = (email?: string | null) => {
    if (!email) return null;
    const m = email.match(/@([^@]+)$/);
    return m ? m[1].toLowerCase() : null;
};

export async function enrichWithAbstract(answers: Answers): Promise<EnrichedResult> {
    const API_KEY = process.env.ABSTRACT_API_KEY;
    if (!API_KEY) throw new Error("Missing ABSTRACT_API_KEY");

    const email = answers["Email Address"]?.trim();
    const companyName = answers["Company Name"]?.trim();
    const seats = toInt(answers["Number of Seats"]);
    const companySize = answers["Company Size"]?.trim() || null;
    const computers = answers["Computers"]?.trim() || null;

    const domain = domainFromEmail(email); // ✅ your plan

    const out: EnrichedResult = {
        derived: { email, companyName, seats, companySize, computers, domain },
    };

    if (!domain) return out; // nothing to enrich

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 8000);

    try {
        const url = `https://companyenrichment.abstractapi.com/v2/?api_key=${encodeURIComponent(
            API_KEY
        )}&domain=${encodeURIComponent(domain)}`;

        const r = await fetch(url, { signal: ac.signal, cache: "no-store" });
        const txt = await r.text();
        const body = (() => { try { return txt ? JSON.parse(txt) : null; } catch { return txt; } })();

        if (r.ok) out.companyEnrichment = body;
        else out.debug = { companyEnrichmentError: { status: r.status, body } };
    } catch (e: any) {
        out.debug = { companyEnrichmentError: String(e?.message || e) };
    } finally {
        clearTimeout(t);
    }

    return out;
}

// simple, sane scorer (seats gate + company size via enrichment or form)
function parseSize(s?: string | null): number | null {
    if (!s) return null;
    const str = s.toLowerCase().trim();
    const plus = str.match(/^([\d,\.]+)\s*\+$/);
    if (plus) return parseInt(plus[1].replace(/[^\d]/g, ""), 10) || null;
    const range = str.match(/^([\d,\.]+)\s*-\s*([\d,\.]+)$/);
    if (range) {
        const a = parseInt(range[1].replace(/[^\d]/g, ""), 10);
        const b = parseInt(range[2].replace(/[^\d]/g, ""), 10);
        return Number.isFinite(a) && Number.isFinite(b) ? Math.round((a + b) / 2) : null;
    }
    const single = parseInt(str.replace(/[^\d]/g, ""), 10);
    return Number.isFinite(single) ? single : null;
}

// lib/enrich.ts

export function scoreLead(enriched: EnrichedResult): { approved: boolean; reason?: string } {
    const empCount: number | null =
        typeof enriched.companyEnrichment?.employee_count === "number"
            ? enriched.companyEnrichment.employee_count
            : null;

    if (empCount === null) {
        return { approved: false, reason: "No employee count available" };
    }

    if (empCount < 1000) {
        return { approved: false, reason: `Too small (${empCount} employees)` };
    }

    return { approved: true };
}
