"use client";
import React, { useState } from "react";

const SIDEBAR_ITEMS = [
  { key: "summary", label: "Summary" },
  { key: "analytics", label: "Analytics" },
  { key: "config", label: "Config" },
  { key: "settings", label: "Settings" },
];

export default function DashboardPage() {
  const [activeView, setActiveView] = useState("summary");
  const companyName = "Your Company"; // Replace with dynamic value later

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-4 text-xl font-bold border-b border-gray-100">
          Dashboard
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`w-full text-left px-4 py-2 rounded-md transition ${
                activeView === item.key
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setActiveView(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold capitalize">{activeView}</h1>
          <div className="text-lg font-medium text-gray-700">{companyName}</div>
        </div>
        {/* Metrics */}
        {activeView === "summary" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <MetricCard label="Submissions" value="—" />
            <MetricCard label="Qualified Leads" value="—" />
            <MetricCard label="Avg. Company Size" value="—" />
          </div>
        )}
        {/* Placeholder for view content */}
        <div className="bg-white rounded-lg shadow p-6 min-h-[300px]">
          {/* Content for {activeView} goes here */}
          <p className="text-gray-400">
            {activeView === "summary"
              ? "Summary overview."
              : `Content for ${SIDEBAR_ITEMS.find((i) => i.key === activeView)?.label} goes here.`}
          </p>
        </div>
      </main>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  );
}