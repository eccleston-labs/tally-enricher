export function TrustLogos() {
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