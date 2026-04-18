"use client";

interface Tab {
  id: string;
  label: string;
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function MatchTabBar({ tabs, activeTab, onTabChange }: Props) {
  return (
    <div
      className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-2 sm:px-4"
      style={{ backgroundColor: "#0f172a", borderBottom: "1px solid rgba(51, 65, 85, 0.4)" }}
    >
      <div className="flex shrink-0 w-full md:w-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-150 shrink-0 rounded-md mx-0.5 ${
                isActive
                  ? "text-[#00FF87]"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]"
              }`}
            >
              {tab.label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{ backgroundColor: "#00FF87" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
