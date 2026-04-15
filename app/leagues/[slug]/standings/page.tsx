import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAllLeagues, getLeague, formatSeason } from "@/lib/leagues";
import { getStandings, zoneColor } from "@/lib/standings";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return getAllLeagues().map((l) => ({ slug: l.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const league = getLeague(params.slug);
  if (!league) return {};
  const season = formatSeason(league);
  return {
    title: `${league.name} ${season} Standings & League Table | FootBrowse`,
    description: `Full ${league.name} ${season} league table — points, goal difference, form and qualification zones on FootBrowse.`,
    alternates: { canonical: `https://footbrowse.com/leagues/${league.slug}/standings` },
  };
}

const TABS = [
  { label: "Overview",  href: (s: string) => `/leagues/${s}` },
  { label: "Fixtures",  href: (s: string) => `/leagues/${s}/matches` },
  { label: "Standings", href: (s: string) => `/leagues/${s}/standings` },
  { label: "Teams",     href: (s: string) => `/leagues/${s}/teams` },
  { label: "Players",   href: (s: string) => `/leagues/${s}/players` },
];

const FORM_COLORS: Record<string, { bg: string; color: string }> = {
  W: { bg: "rgba(0,255,135,0.15)",  color: "#00FF87" },
  D: { bg: "rgba(245,158,11,0.15)", color: "#F59E0B" },
  L: { bg: "rgba(239,68,68,0.15)",  color: "#EF4444" },
};

export default function LeagueStandingsPage({ params }: Props) {
  const league = getLeague(params.slug);
  if (!league) notFound();

  const season = formatSeason(league);
  const standings = getStandings(league);

  return (
    <div className="space-y-8">

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <Link href="/leagues">Leagues</Link>
        <span className="breadcrumb-sep">›</span>
        <Link href={`/leagues/${league.slug}`}>{league.name}</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">Standings</span>
      </nav>

      {/* Hero */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] p-2">
            <Image src={league.logo} alt={league.name} width={32} height={32} className="object-contain" unoptimized />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-green">League Table</span>
              <span className="tag">{season}</span>
            </div>
            <h1 style={{ fontSize: "1.4rem" }}>{league.name} — Standings</h1>
          </div>
        </div>
      </div>

      {/* League tab nav */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mb-2" style={{ borderBottom: "1px solid rgba(39,39,42,0.7)" }}>
        {TABS.map((tab) => {
          const active = tab.label === "Standings";
          return (
            <Link
              key={tab.label}
              href={tab.href(league.slug)}
              className={[
                "shrink-0 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors rounded-t",
                active ? "text-white border-b-2" : "text-zinc-500 hover:text-zinc-300",
              ].join(" ")}
              style={active ? { borderBottomColor: "#00FF87" } : {}}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* No data fallback */}
      {!standings ? (
        <div className="section-block text-center py-12">
          <p className="text-zinc-500 text-sm">Standings not available for this league yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {standings.groups.map((group) => (
            <div key={group.group}>
              {/* Group header — only shown when multi-group (World Cup) */}
              {standings.groups.length > 1 && (
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-sm font-black text-white" style={{ letterSpacing: "-0.01em" }}>
                    {group.group}
                  </h2>
                  <div className="flex-1 h-px" style={{ backgroundColor: "rgba(39,39,42,0.6)" }} />
                </div>
              )}

              {/* Table */}
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: "rgba(39,39,42,0.8)" }}>
                {/* Table header */}
                <div
                  className="grid text-[10px] uppercase tracking-[0.12em] font-bold text-zinc-500 px-3 py-2.5"
                  style={{
                    backgroundColor: "rgba(24,24,27,0.95)",
                    borderBottom: "1px solid rgba(39,39,42,0.8)",
                    gridTemplateColumns: "2rem 1fr 2.2rem 2.2rem 2.2rem 2.2rem 2.8rem 2.8rem 2.8rem 2.8rem 5rem",
                  }}
                >
                  <span className="text-center">#</span>
                  <span>Team</span>
                  <span className="text-center">P</span>
                  <span className="text-center">W</span>
                  <span className="text-center">D</span>
                  <span className="text-center">L</span>
                  <span className="text-center">GF</span>
                  <span className="text-center">GA</span>
                  <span className="text-center">GD</span>
                  <span className="text-center font-black text-zinc-300">Pts</span>
                  <span className="text-center hidden sm:block">Form</span>
                </div>

                {/* Rows */}
                {group.table.map((row, i) => {
                  const zone = zoneColor(row.description);
                  const isEven = i % 2 === 0;
                  return (
                    <div
                      key={row.team.id}
                      className="grid items-center px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
                      style={{
                        backgroundColor: isEven ? "rgba(24,24,27,0.6)" : "rgba(18,18,20,0.6)",
                        borderBottom: "1px solid rgba(39,39,42,0.4)",
                        gridTemplateColumns: "2rem 1fr 2.2rem 2.2rem 2.2rem 2.2rem 2.8rem 2.8rem 2.8rem 2.8rem 5rem",
                      }}
                    >
                      {/* Rank */}
                      <div className="flex items-center justify-center gap-1">
                        {zone && (
                          <div
                            className="w-0.5 h-4 rounded-full shrink-0"
                            style={{ backgroundColor: zone }}
                          />
                        )}
                        <span
                          className="text-xs font-bold tabular-nums"
                          style={{ color: zone ?? "#71717A" }}
                        >
                          {row.rank}
                        </span>
                      </div>

                      {/* Team */}
                      <div className="flex items-center gap-2 min-w-0">
                        <Image
                          src={row.team.logo}
                          alt={row.team.name}
                          width={18}
                          height={18}
                          className="object-contain shrink-0"
                          unoptimized
                        />
                        <span
                          className="text-xs font-bold text-white truncate"
                          style={{ letterSpacing: "-0.01em" }}
                        >
                          {row.team.name}
                        </span>
                      </div>

                      {/* Stats */}
                      <span className="text-xs text-zinc-400 text-center tabular-nums">{row.played}</span>
                      <span className="text-xs text-zinc-400 text-center tabular-nums">{row.won}</span>
                      <span className="text-xs text-zinc-400 text-center tabular-nums">{row.drawn}</span>
                      <span className="text-xs text-zinc-400 text-center tabular-nums">{row.lost}</span>
                      <span className="text-xs text-zinc-400 text-center tabular-nums">{row.goals_for}</span>
                      <span className="text-xs text-zinc-400 text-center tabular-nums">{row.goals_against}</span>
                      <span
                        className="text-xs text-center tabular-nums font-semibold"
                        style={{ color: row.goal_diff > 0 ? "#00FF87" : row.goal_diff < 0 ? "#EF4444" : "#71717A" }}
                      >
                        {row.goal_diff > 0 ? `+${row.goal_diff}` : row.goal_diff}
                      </span>
                      <span className="text-sm font-black text-white text-center tabular-nums">{row.points}</span>

                      {/* Form */}
                      <div className="hidden sm:flex items-center justify-center gap-0.5">
                        {row.form.slice(-5).split("").map((r, fi) => {
                          const style = FORM_COLORS[r] ?? { bg: "rgba(113,113,122,0.15)", color: "#71717A" };
                          return (
                            <span
                              key={fi}
                              className="w-4 h-4 rounded-sm text-[8px] font-black flex items-center justify-center"
                              style={{ backgroundColor: style.bg, color: style.color }}
                            >
                              {r}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Zone legend */}
              {standings.groups.length === 1 && (
                <div className="flex flex-wrap gap-4 mt-3 px-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#00FF87" }} />
                    <span className="text-[10px] text-zinc-500">Champions League / Promotion</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#3B82F6" }} />
                    <span className="text-[10px] text-zinc-500">Europa / Conference League</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#EF4444" }} />
                    <span className="text-[10px] text-zinc-500">Relegation</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
