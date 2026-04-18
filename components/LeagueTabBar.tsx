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
      className="sticky top-14 z-40 overflow-x-auto"
      style={{ backgroundColor: "#0a0a0a", borderBottom: "1px solid rgba(39,39,42,0.7)" }}
    >
      <div className="flex gap-1 max-w-5xl mx-auto px-4">
        {TABS.map((tab) => {
          const isActive = tab.label === active;
          return (
            <Link
              key={tab.label}
              href={tab.href(slug)}
              className={[
                "shrink-0 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap",
                isActive
                  ? "text-white border-b-2"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]",
              ].join(" ")}
              style={isActive ? { borderBottomColor: "#00FF87" } : {}}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
