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
      className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ backgroundColor: "#0a0a0a", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex min-w-max">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors shrink-0"
              style={{ color: isActive ? "#00FF87" : "#71717A" }}
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
