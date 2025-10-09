type TextFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  error?: string;
};

export function TextField({ label, name, value, onChange, type = "text", placeholder, error }: TextFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        className={`mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${error ? "border-red-400" : "border-slate-300"
          }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}