import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAllLeagues, getLeague, formatSeason } from "@/lib/leagues";
import { getLeagueTeams } from "@/lib/league-teams";
import { getStandings } from "@/lib/standings";
import { getAllClubTeams } from "@/lib/club-teams";
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
    title: `${league.name} ${season} Teams & Clubs | FootBrowse`,
    description: `All ${league.name} ${season} teams — squad profiles, stadiums and stats on FootBrowse.`,
    alternates: { canonical: `https://footbrowse.com/leagues/${league.slug}/teams` },
  };
}

const TABS = [
  { label: "Overview",  href: (s: string) => `/leagues/${s}` },
  { label: "Fixtures",  href: (s: string) => `/leagues/${s}/matches` },
  { label: "Standings", href: (s: string) => `/leagues/${s}/standings` },
  { label: "Teams",     href: (s: string) => `/leagues/${s}/teams` },
  { label: "Players",   href: (s: string) => `/leagues/${s}/players` },
];

export default function LeagueTeamsPage({ params }: Props) {
  const league = getLeague(params.slug);
  if (!league) notFound();

  const season = formatSeason(league);
  let teams = getLeagueTeams(league);

  // Build club team slug lookup for profile page links
  const clubTeamSlugs = new Set(getAllClubTeams().map((t) => t.slug));

  // Sort by standings position if available
  const standings = getStandings(league);
  if (standings && standings.groups.length > 0) {
    // Build rank lookup: team slug → rank (use first group for single-table leagues)
    const rankMap = new Map<string, number>();
    for (const group of standings.groups) {
      for (const row of group.table) {
        rankMap.set(row.team.slug, row.rank);
        rankMap.set(String(row.team.id), row.rank);
      }
    }
    teams = [...teams].sort((a, b) => {
      const ra = rankMap.get(a.slug) ?? rankMap.get(String(a.id)) ?? 999;
      const rb = rankMap.get(b.slug) ?? rankMap.get(String(b.id)) ?? 999;
      return ra - rb;
    });
  }

  return (
    <div className="space-y-8">

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <Link href={`/leagues/${league.slug}`}>{league.name}</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">Teams</span>
      </nav>

      {/* Hero */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] p-2">
            <Image src={league.logo} alt={league.name} width={32} height={32} className="object-contain" unoptimized />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-green">{teams.length} Teams</span>
              <span className="tag">{season}</span>
            </div>
            <h1 style={{ fontSize: "1.4rem" }}>{league.name} — Teams</h1>
          </div>
        </div>
      </div>

      <LeagueTabBar slug={league.slug} active="Teams" />

      {/* Teams grid */}
      {teams.length === 0 ? (
        <div className="section-block text-center py-12">
          <p className="text-zinc-500 text-sm">Team data not available for this league yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team, i) => {
            // Link to club profile page, WC national team page, or nothing
            const href = clubTeamSlugs.has(team.slug)
              ? `/leagues/${params.slug}/teams/${team.slug}`
              : team.existing_slug
              ? `/teams/${team.existing_slug}`
              : null;

            const CardContent = (
              <div className="entity-card flex items-center gap-4 group cursor-pointer">
                {/* Logo */}
                <div className="shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06] p-2">
                  <Image
                    src={team.logo}
                    alt={`${team.name} logo`}
                    width={36}
                    height={36}
                    className="object-contain"
                    unoptimized
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-black text-white text-sm leading-tight truncate"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {team.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {team.venue.city && (
                      <span className="text-[11px] text-zinc-500 truncate">{team.venue.city}</span>
                    )}
                    {!team.venue.city && team.country && (
                      <span className="text-[11px] text-zinc-500 truncate">{team.country}</span>
                    )}
                    {team.founded && (
                      <span className="tag text-[10px]">Est. {team.founded}</span>
                    )}
                  </div>
                </div>

                {/* Rank badge or arrow */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {standings && (
                    <span
                      className="text-[10px] font-black tabular-nums"
                      style={{ color: i < 4 ? "#00FF87" : i >= teams.length - 3 ? "#EF4444" : "#52525B" }}
                    >
                      #{i + 1}
                    </span>
                  )}
                  <span
                    className="text-sm font-bold opacity-30 group-hover:opacity-100 transition-opacity"
                    style={{ color: "#00FF87" }}
                  >
                    →
                  </span>
                </div>
              </div>
            );

            return href ? (
              <Link key={team.id} href={href}>
                {CardContent}
              </Link>
            ) : (
              <div key={team.id}>{CardContent}</div>
            );
          })}
        </div>
      )}

      {/* Note for teams with no profile yet */}
      {teams.some((t) => !clubTeamSlugs.has(t.slug) && !t.existing_slug) && (
        <p className="text-[11px] text-zinc-600 text-center pt-2">
          Some club profiles are still syncing.
        </p>
      )}
    </div>
  );
}
