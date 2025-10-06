import { useState } from "react";

export function QualificationForm({ workspaceName }: { workspaceName: string }) {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<null | boolean>(null);
  const [isChecking, setIsChecking] = useState(false);

  async function onCheck(e: React.FormEvent) {
    e.preventDefault();
    setIsChecking(true);
    try {
      const res = await fetch("/api/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, workspaceName }),
      });
      const data = await res.json();
      setResult(data.result);
    } catch {
      setResult(false);
    }
    setIsChecking(false);
  }

  return (
    <form onSubmit={onCheck} className="flex flex-col gap-2 max-w-sm">
      <div className="flex gap-2">
        <input
          type="email"
          required
          placeholder="lead@email.com"
          value={email}
          disabled={isChecking}
          onChange={(e) => {
            setEmail(e.target.value);
            setResult(null);
          }}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm disabled:opacity-60"
          disabled={isChecking || !email}
        >
          {isChecking ? "Checking..." : "Check"}
        </button>
      </div>
      {result !== null && (
        <div
          className={`text-sm font-medium mt-1 ${result ? "text-green-600" : "text-red-600"}`}
        >
          {result ? "Qualified ✅" : "Not qualified ❌"}
        </div>
      )}
    </form>
  );
}
