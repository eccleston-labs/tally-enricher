// app/tester/components/TrustLogos.tsx
export function TrustLogos() {
  const logos = [
    { src: "/integrations/calcom_logo.png", alt: "Cal.com", href: "https://cal.com" },
    { src: "/integrations/calendly_logo.png", alt: "Calendly", href: "https://calendly.com" },
    { src: "/integrations/tally_logo.png", alt: "Tally", href: "https://tally.so" },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="text-center text-xs uppercase tracking-wider text-slate-500 mb-12">
        Integrates with your stack
      </div>

      <ul className="grid grid-cols-3 gap-8 items-center justify-items-center opacity-90">
        {logos.map(({ src, alt, href }) => (
          <li key={alt}>
            <a href={href} target="_blank" rel="noreferrer" className="flex h-10 w-40 items-center justify-center">
              <img src={src} alt={alt} className="h-28 w-auto object-contain" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
