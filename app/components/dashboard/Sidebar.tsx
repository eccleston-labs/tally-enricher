import { SignOutButton } from "@clerk/nextjs";

export default function Sidebar({
  items,
  activeView,
  setActiveView,
}: {
  items: { key: string; label: string }[];
  activeView: string;
  setActiveView: (key: string) => void;
}) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-6 py-4 text-xl font-bold border-b border-gray-100">
        Dashboard
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {items.map((item) => (
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

      <div className="px-4 py-6 border-t border-gray-200">
        <SignOutButton redirectUrl="/home">
          <button className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition">
            Logout
          </button>
        </SignOutButton>
      </div>
    </aside>
  );
}
