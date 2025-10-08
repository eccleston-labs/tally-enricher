type PriceCardProps = {
  name: string;
  price: string;
  blurb: string;
  highlight?: boolean;
};

export function PriceCard({ name, price, blurb, highlight = false }: PriceCardProps) {
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