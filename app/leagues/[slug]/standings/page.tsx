import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAllLeagues, getLeague, formatSeason } from "@/lib/leagues";
import { getStandings, zoneColor } from "@/lib/standings";
import LeagueTabBar from "@/components/LeagueTabBar";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  const leagues = await getAllLeagues();
  return leagues.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const league = await getLeague(params.slug);
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

export default async function LeagueStandingsPage({ params }: Props) {
  const league = await getLeague(params.slug);
  if (!league) notFound();

  const season = formatSeason(league);
  const standings = await getStandings(league);

  return (
    <div className="space-y-8">

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <Link href={`/leagues/${league.slug}`}>{league.name}</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">Standings</span>
      </nav>

      {/* Hero */}
      <div className="page-header">
        <div className="flex items-start gap-5">
          <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-2xl bg-slate-50 shadow-inner p-1.5">
            <Image
              src={league.logo}
              alt={`${league.name} logo`}
              width={68}
              height={68}
              className="object-contain"
              unoptimized
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="badge-green">{league.type}</span>
              <span className="tag">{season}</span>
              {league.flag ? (
                <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Image src={league.flag} alt={league.country} width={14} height={10} className="rounded-sm object-cover" unoptimized />
                  {league.country}
                </span>
              ) : (
                <span className="text-xs text-zinc-500">{league.country}</span>
              )}
            </div>
            <h1>{league.name}</h1>
            {league.seasonStart && league.seasonEnd && (
              <p className="mt-1.5 text-xs text-zinc-500">
                {new Date(league.seasonStart).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                {" "}–{" "}
                {new Date(league.seasonEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>
        </div>
      </div>

      <LeagueTabBar slug={league.slug} active="Standings" />

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
                <div>
                  {/* Table header */}
                  <div
                    className="grid text-[10px] uppercase tracking-[0.12em] font-bold text-zinc-500 px-3 py-2.5"
                    style={{
                      backgroundColor: "#0f172a",
                      borderBottom: "1px solid #334155",
                      gridTemplateColumns: "1.8rem 1fr 1.8rem 1.8rem 1.8rem 1.8rem 2rem 2.2rem",
                    }}
                  >
                    <span className="text-center">#</span>
                    <span>Team</span>
                    <span className="text-center">P</span>
                    <span className="text-center">W</span>
                    <span className="text-center">D</span>
                    <span className="text-center">L</span>
                    <span className="text-center">GD</span>
                    <span className="text-center font-black text-zinc-300">Pts</span>
                  </div>

                  {/* Rows */}
                  {group.table.map((row, i) => {
                    const zone = zoneColor(row.description);
                    return (
                      <div
                        key={row.team.id}
                        className="grid items-center px-3 py-2.5 transition-colors hover:bg-slate-800"
                        style={{
                          backgroundColor: "transparent",
                          borderBottom: "1px solid #1e293b",
                          gridTemplateColumns: "1.8rem 1fr 1.8rem 1.8rem 1.8rem 1.8rem 2rem 2.2rem",
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
                            width={16}
                            height={16}
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
                        <span className="text-[11px] text-zinc-400 text-center tabular-nums">{row.played}</span>
                        <span className="text-[11px] text-zinc-400 text-center tabular-nums">{row.won}</span>
                        <span className="text-[11px] text-zinc-400 text-center tabular-nums">{row.drawn}</span>
                        <span className="text-[11px] text-zinc-400 text-center tabular-nums">{row.lost}</span>
                        <span
                          className="text-[11px] text-center tabular-nums font-semibold"
                          style={{ color: row.goal_diff > 0 ? "#00FF87" : row.goal_diff < 0 ? "#EF4444" : "#71717A" }}
                        >
                          {row.goal_diff > 0 ? `+${row.goal_diff}` : row.goal_diff}
                        </span>
                        <span className="text-xs font-black text-white text-center tabular-nums">{row.points}</span>
                      </div>
                    );
                  })}
                </div>
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
