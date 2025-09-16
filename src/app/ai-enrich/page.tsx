"use client";

import { useState } from "react";

interface FormData {
  companyName: string;
  companyEmail: string;
}

interface EnrichmentResult {
  summary: string;
  priority: boolean;
  reasoning: string;
  sources: string[];
}

export default function AIEnrichPage() {
  const [formData, setFormData] = useState<FormData>({ companyName: "", companyEmail: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EnrichmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ai-enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Company Enrichment</h1>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="mb-4">
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter company name"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Company Email Address
            </label>
            <input
              type="email"
              id="companyEmail"
              value={formData.companyEmail}
              onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter company email"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {isLoading ? "Enriching..." : "Enrich Company"}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Enrichment Results</h2>
            
            {/* Priority Decision */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Call Priority</h3>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                result.priority 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {result.priority ? '✅ YES - High Priority' : '❌ NO - Standard Priority'}
              </div>
              {result.reasoning && (
                <p className="text-gray-600 text-sm mt-2">{result.reasoning}</p>
              )}
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Company Summary</h3>
              <p className="text-gray-600 leading-relaxed">{result.summary}</p>
            </div>
            
            {result.sources.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Sources</h3>
                <ul className="list-disc list-inside text-gray-600">
                  {result.sources.map((source, index) => (
                    <li key={index} className="mb-1">
                      <a href={source} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {source}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}