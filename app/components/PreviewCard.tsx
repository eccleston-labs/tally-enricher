export function PreviewCard() {
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