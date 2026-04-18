import Link from "next/link";

const TABS = [
  { label: "Overview",  href: (s: string) => `/leagues/${s}` },
  { label: "Fixtures",  href: (s: string) => `/leagues/${s}/matches` },
  { label: "Standings", href: (s: string) => `/leagues/${s}/standings` },
  { label: "Teams",     href: (s: string) => `/leagues/${s}/teams` },
  { label: "Players",   href: (s: string) => `/leagues/${s}/players` },
];

export default function LeagueTabBar({ slug, active }: { slug: string; active: string }) {
  return (
    <div
      className="sticky top-14 z-40 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-2 sm:px-4"
      style={{ backgroundColor: "#0f172a", borderBottom: "1px solid rgba(51, 65, 85, 0.4)" }}
    >
      <div className="flex shrink-0 w-full md:w-auto">
        {TABS.map((tab) => {
          const isActive = tab.label === active;
          return (
            <Link
              key={tab.label}
              href={tab.href(slug)}
              className={[
                "shrink-0 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-150 whitespace-nowrap rounded-md mx-0.5",
                isActive
                  ? "text-[#00FF87]"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]",
              ].join(" ")}
              style={isActive ? { boxShadow: "inset 0 -2px 0 #00FF87" } : {}}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
