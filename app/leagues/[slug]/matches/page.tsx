import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAllLeagues, getLeague, formatSeason } from "@/lib/leagues";
import { getFixtures, isFinished, isUpcoming, isLive, statusLabel } from "@/lib/fixtures";

interface Props {
  params: { slug: string };
  searchParams: { filter?: string };
}

export function generateStaticParams() {
  return getAllLeagues().map((l) => ({ slug: l.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const league = getLeague(params.slug);
  if (!league) return {};
  const season = formatSeason(league);
  return {
    title: `${league.name} ${season} Fixtures & Results | FootBrowse`,
    description: `All ${league.name} ${season} fixtures and results — dates, scores, and match details on FootBrowse.`,
    alternates: { canonical: `https://footbrowse.com/leagues/${league.slug}/matches` },
  };
}

const TABS = [
  { label: "Overview",  href: (s: string) => `/leagues/${s}` },
  { label: "Fixtures",  href: (s: string) => `/leagues/${s}/matches` },
  { label: "Standings", href: (s: string) => `/leagues/${s}/standings` },
  { label: "Teams",     href: (s: string) => `/leagues/${s}/teams` },
  { label: "Players",   href: (s: string) => `/leagues/${s}/players` },
];

const FILTERS = ["All", "Upcoming", "Results"] as const;
type Filter = (typeof FILTERS)[number];

export default function LeagueMatchesPage({ params, searchParams }: Props) {
  const league = getLeague(params.slug);
  if (!league) notFound();

  const season = formatSeason(league);
  const allFixtures = getFixtures(league);

  const activeFilter: Filter =
    (searchParams.filter as Filter) && FILTERS.includes(searchParams.filter as Filter)
      ? (searchParams.filter as Filter)
      : "All";

  const filtered = allFixtures.filter((f) => {
    if (activeFilter === "Upcoming") return isUpcoming(f.status)
    if (activeFilter === "Results")  return isFinished(f.status)
    return true
  });

  // Group by date
  const byDate = new Map<string, typeof filtered>()
  for (const f of filtered) {
    const existing = byDate.get(f.date) ?? []
    existing.push(f)
    byDate.set(f.date, existing)
  }
  const dates = Array.from(byDate.keys()).sort((a, b) =>
    activeFilter === "Upcoming" ? a.localeCompare(b) : b.localeCompare(a)
  )

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
        <span className="breadcrumb-current">Fixtures</span>
      </nav>

      {/* Hero */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] p-2">
            <Image src={league.logo} alt={league.name} width={32} height={32} className="object-contain" unoptimized />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-green">{filtered.length} Fixtures</span>
              <span className="tag">{season}</span>
            </div>
            <h1 style={{ fontSize: "1.4rem" }}>{league.name} — Fixtures & Results</h1>
          </div>
        </div>
      </div>

      {/* League tab nav */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mb-2" style={{ borderBottom: "1px solid rgba(39,39,42,0.7)" }}>
        {TABS.map((tab) => {
          const active = tab.label === "Fixtures";
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

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "All" ? `/leagues/${league.slug}/matches` : `/leagues/${league.slug}/matches?filter=${f}`}
            className={[
              "px-3 py-1.5 rounded-full text-xs font-bold transition-colors",
              activeFilter === f
                ? "text-black"
                : "bg-white/[0.04] text-zinc-400 border border-white/[0.08] hover:text-white",
            ].join(" ")}
            style={activeFilter === f ? { backgroundColor: "#00FF87" } : {}}
          >
            {f}
          </Link>
        ))}
      </div>

      {/* Fixtures list */}
      {dates.length === 0 ? (
        <div className="section-block text-center py-12">
          <p className="text-zinc-500 text-sm">No fixtures found for this filter.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {dates.map((date) => {
            const dayFixtures = byDate.get(date)!
            const label = new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
              weekday: "short", month: "short", day: "numeric", year: "numeric",
            })
            return (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-bold">{label}</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: "rgba(39,39,42,0.6)" }} />
                  <span className="text-[10px] text-zinc-600">{dayFixtures.length} matches</span>
                </div>

                {/* Fixture rows */}
                <div className="space-y-1.5">
                  {dayFixtures.map((fixture) => {
                    const finished = isFinished(fixture.status)
                    const live = isLive(fixture.status)
                    const upcoming = isUpcoming(fixture.status)
                    const label = statusLabel(fixture.status)

                    return (
                      <Link
                        key={fixture.fixture_id}
                        href={`/leagues/${league.slug}/matches/${fixture.slug}`}
                        className="flex items-center gap-3 rounded-lg px-4 py-3 border transition-colors hover:border-white/20"
                        style={{
                          backgroundColor: "rgba(24,24,27,0.8)",
                          borderColor: live ? "rgba(0,255,135,0.2)" : "rgba(39,39,42,0.8)",
                        }}
                      >
                        {/* Time / Status */}
                        <div className="shrink-0 w-14 text-center">
                          {upcoming ? (
                            <span className="text-xs font-bold text-zinc-400">{fixture.kickoff_utc}</span>
                          ) : live ? (
                            <span className="status-pill text-[9px]">LIVE</span>
                          ) : (
                            <span
                              className="text-[10px] font-bold uppercase tracking-wide"
                              style={{ color: "#00FF87" }}
                            >
                              {label}
                            </span>
                          )}
                          {fixture.matchday && (
                            <p className="text-[9px] text-zinc-600 mt-0.5">MD {fixture.matchday}</p>
                          )}
                        </div>

                        {/* Home team */}
                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                          <span className="text-xs font-bold text-white truncate text-right">
                            {fixture.home_team.name}
                          </span>
                          <Image
                            src={fixture.home_team.logo}
                            alt={fixture.home_team.name}
                            width={20}
                            height={20}
                            className="object-contain shrink-0"
                            unoptimized
                          />
                        </div>

                        {/* Score / VS */}
                        <div className="shrink-0 w-16 text-center">
                          {finished || live ? (
                            <span
                              className="text-sm font-black tabular-nums"
                              style={{ color: "#ffffff", letterSpacing: "0.05em" }}
                            >
                              {fixture.score.home ?? 0} — {fixture.score.away ?? 0}
                            </span>
                          ) : (
                            <span
                              className="text-xs font-black"
                              style={{ color: "#00FF87", letterSpacing: "0.1em" }}
                            >
                              VS
                            </span>
                          )}
                        </div>

                        {/* Away team */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Image
                            src={fixture.away_team.logo}
                            alt={fixture.away_team.name}
                            width={20}
                            height={20}
                            className="object-contain shrink-0"
                            unoptimized
                          />
                          <span className="text-xs font-bold text-white truncate">
                            {fixture.away_team.name}
                          </span>
                        </div>

                        {/* Stage */}
                        <div className="shrink-0 hidden sm:block">
                          <span className="text-[9px] text-zinc-600 uppercase tracking-wide">
                            {fixture.stage}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
