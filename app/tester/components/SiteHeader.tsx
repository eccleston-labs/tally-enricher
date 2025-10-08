"use client";
export function SiteHeader() {
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