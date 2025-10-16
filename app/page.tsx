"use client";
import React, { useMemo, useState } from "react";

import { SiteHeader } from "@/app/components/SiteHeader";
import { Hero } from "@/app/components/Hero";
import { TrustLogos } from "@/app/components/TrustLogos";
import { MainSections } from "@/app/components/MainSections";
import { GoogleButton } from "@/app/components/GoogleButton";
import { QualifyForm } from "@/app/components/QualifyForm";
import CompetitorTable from "./components/CompetitorTable";

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



export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900">
      <SiteHeader />
      <Hero />
      <TrustLogos />
      <MainSections />
      <QualifyForm />
      {/* <FAQ /> */}
      <CompetitorTable />
      <SiteFooter />
    </div>
  );
}

// function FAQ() {
//   return (
//     <section id="faq" className="mx-auto max-w-6xl px-4 pb-16">
//       <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
//         <h3 className="text-xl font-semibold">FAQ</h3>
//         <dl className="mt-4 grid md:grid-cols-2 gap-6 text-sm">
//           <div>
//             <dt className="font-medium">Do you store PII?</dt>
//             <dd className="text-slate-600 mt-1">We store only what’s necessary to enrich & qualify. You can request deletion anytime.</dd>
//           </div>
//           <div>
//             <dt className="font-medium">Which data providers do you support?</dt>
//             <dd className="text-slate-600 mt-1">People Data Labs, Clearbit, Crunchbase, LinkedIn (via your legal integrations), and custom sources.</dd>
//           </div>
//           <div>
//             <dt className="font-medium">How does qualification work?</dt>
//             <dd className="text-slate-600 mt-1">Set thresholds for employees, funding, revenue, etc. If a lead meets all enabled rules, we route to booking automatically.</dd>
//           </div>
//           <div>
//             <dt className="font-medium">Can I use my own form?</dt>
//             <dd className="text-slate-600 mt-1">Yes - drop in our snippet to connect to Tally, Typeform, or your custom backend.</dd>
//           </div>
//         </dl>
//       </div>
//     </section>
//   );
// }

function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-600 flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-xl bg-slate-900" />
          <span className="font-medium">AssemblyGTM</span>
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-900">Privacy</a>
          <a href="#" className="hover:text-slate-900">Legal</a>
        </div>
        <div className="text-xs">© {new Date().getFullYear()} AssemblyGTM, LLC.</div>
      </div>
    </footer>
  );
}
