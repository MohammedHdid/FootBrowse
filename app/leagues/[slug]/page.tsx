import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAllLeagues, getLeague, formatSeason } from "@/lib/leagues";
import { getFixtures, isUpcoming, isFinished } from "@/lib/fixtures";
import { getStandings, zoneColor } from "@/lib/standings";
import LeagueTabBar from "@/components/LeagueTabBar";

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
    title: `${league.name} ${season} Standings, Fixtures & Teams | FootBrowse`,
    description: `Follow the ${league.name} ${season} season — fixtures, standings, team profiles and top scorers on FootBrowse.`,
    alternates: { canonical: `https://footbrowse.com/leagues/${league.slug}` },
  };
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function LeaguePage({ params }: Props) {
  const league = getLeague(params.slug);
  if (!league) notFound();

  const season = formatSeason(league);

  // Upcoming fixtures
  const allFixtures = getFixtures(league);
  const upcoming = allFixtures
    .filter((f) => isUpcoming(f.status))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);
  const recentResults = allFixtures
    .filter((f) => isFinished(f.status))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Standings
  const standings = getStandings(league);
  const topRows = standings?.groups?.[0]?.table?.slice(0, 8) ?? [];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",    item: "https://footbrowse.com" },
      { "@type": "ListItem", position: 2, name: "Leagues", item: "https://footbrowse.com/leagues" },
      { "@type": "ListItem", position: 3, name: league.name, item: `https://footbrowse.com/leagues/${league.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="space-y-6">

        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">{league.name}</span>
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

        {/* Sticky tab bar */}
        <LeagueTabBar slug={league.slug} active="Overview" />

        {/* ── Standings snippet ── */}
        {topRows.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title text-lg">Standings</h2>
              <Link href={`/leagues/${league.slug}/standings`} className="arrow-link text-xs">Full table →</Link>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
              <div
                className="grid px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-600"
                style={{ gridTemplateColumns: "24px 1fr 28px 28px 36px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <span>Pos</span>
                <span>Club</span>
                <span className="text-center">P</span>
                <span className="text-center">GD</span>
                <span className="text-center">Pts</span>
              </div>
              {topRows.map((row, idx) => {
                const rankColor = zoneColor(row.description ?? null);
                return (
                  <Link
                    key={row.team.slug}
                    href={`/leagues/${league.slug}/teams/${row.team.slug}`}
                    className="grid px-3 py-2 items-center hover:bg-white/[0.03] transition-colors"
                    style={{
                      gridTemplateColumns: "24px 1fr 28px 28px 36px",
                      borderBottom: idx < topRows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : undefined,
                    }}
                  >
                    <span className="text-xs font-black" style={{ color: rankColor ?? "#52525b" }}>{row.rank}</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <Image src={row.team.logo} alt={row.team.name} width={16} height={16} className="object-contain shrink-0" unoptimized />
                      <span className="text-xs font-semibold text-zinc-200 truncate">{row.team.name}</span>
                    </div>
                    <span className="text-center text-xs text-zinc-500 tabular-nums">{row.played}</span>
                    <span className="text-center text-xs font-bold tabular-nums"
                      style={{ color: row.goal_diff > 0 ? "#00FF87" : row.goal_diff < 0 ? "#EF4444" : "#52525b" }}>
                      {row.goal_diff > 0 ? "+" : ""}{row.goal_diff}
                    </span>
                    <span className="text-center text-xs font-black text-white tabular-nums">{row.points}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Upcoming Fixtures ── */}
        {upcoming.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title text-lg">Upcoming Fixtures</h2>
              <Link href={`/leagues/${league.slug}/matches`} className="arrow-link text-xs">All fixtures →</Link>
            </div>
            <div className="space-y-1.5">
              {upcoming.map((f) => (
                <Link
                  key={f.fixture_id}
                  href={`/leagues/${league.slug}/matches/${f.slug}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
                  style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                >
                  <span className="shrink-0 text-[11px] font-bold text-zinc-500 tabular-nums w-14">{fmtDate(f.date)}</span>
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Image src={f.home_team.logo} alt={f.home_team.name} width={14} height={14} className="object-contain shrink-0" unoptimized />
                      <span className="text-xs font-medium text-zinc-300 truncate">{f.home_team.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Image src={f.away_team.logo} alt={f.away_team.name} width={14} height={14} className="object-contain shrink-0" unoptimized />
                      <span className="text-xs font-medium text-zinc-300 truncate">{f.away_team.name}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-zinc-500 tabular-nums shrink-0">{f.kickoff_utc}</span>
                  <span className="shrink-0 text-zinc-700 text-xs font-bold">›</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Recent Results ── */}
        {recentResults.length > 0 && upcoming.length === 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title text-lg">Recent Results</h2>
              <Link href={`/leagues/${league.slug}/matches`} className="arrow-link text-xs">All fixtures →</Link>
            </div>
            <div className="space-y-1.5">
              {recentResults.map((f) => (
                <Link
                  key={f.fixture_id}
                  href={`/leagues/${league.slug}/matches/${f.slug}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
                  style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                >
                  <span className="shrink-0 text-[11px] font-bold text-zinc-500 tabular-nums w-14">{fmtDate(f.date)}</span>
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Image src={f.home_team.logo} alt={f.home_team.name} width={14} height={14} className="object-contain shrink-0" unoptimized />
                      <span className="text-xs font-medium text-zinc-300 truncate">{f.home_team.name}</span>
                      <span className="ml-auto text-xs font-black text-white tabular-nums shrink-0">{f.score.home ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Image src={f.away_team.logo} alt={f.away_team.name} width={14} height={14} className="object-contain shrink-0" unoptimized />
                      <span className="text-xs font-medium text-zinc-300 truncate">{f.away_team.name}</span>
                      <span className="ml-auto text-xs font-black text-white tabular-nums shrink-0">{f.score.away ?? "—"}</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-zinc-700 text-xs font-bold">›</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Season info */}
        <div className="section-block">
          <p className="section-title text-sm mb-4">Season Info</p>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <dt className="stat-label">Season</dt>
              <dd className="text-sm font-black text-white mt-1">{season}</dd>
            </div>
            <div>
              <dt className="stat-label">Type</dt>
              <dd className="text-sm font-black text-white mt-1">{league.type}</dd>
            </div>
            <div>
              <dt className="stat-label">Country</dt>
              <dd className="text-sm font-black text-white mt-1">{league.country}</dd>
            </div>
            <div>
              <dt className="stat-label">Fixtures</dt>
              <dd className="text-sm font-black mt-1" style={{ color: "#00FF87" }}>{allFixtures.length}</dd>
            </div>
          </dl>
        </div>

      </div>
    </>
  );
}
