import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAllLeagues, getLeague, formatSeason } from "@/lib/leagues";
import { getTopScorers, type TopPlayer } from "@/lib/topscorers";
import { getAllPlayers } from "@/lib/data";
import LeagueTabBar from "@/components/LeagueTabBar";

interface Props {
  params: { slug: string };
  searchParams: { tab?: string };
}

export function generateStaticParams() {
  return getAllLeagues().map((l) => ({ slug: l.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const league = getLeague(params.slug);
  if (!league) return {};
  const season = formatSeason(league);
  return {
    title: `${league.name} ${season} Top Scorers & Assists | FootBrowse`,
    description: `${league.name} ${season} top scorers, top assists and most cards — full player stats on FootBrowse.`,
    alternates: { canonical: `https://footbrowse.com/leagues/${league.slug}/players` },
  };
}

const LEAGUE_TABS = [
  { label: "Overview",  href: (s: string) => `/leagues/${s}` },
  { label: "Fixtures",  href: (s: string) => `/leagues/${s}/matches` },
  { label: "Standings", href: (s: string) => `/leagues/${s}/standings` },
  { label: "Teams",     href: (s: string) => `/leagues/${s}/teams` },
  { label: "Players",   href: (s: string) => `/leagues/${s}/players` },
];

const STAT_TABS = ["Scorers", "Assists", "Cards"] as const;
type StatTab = (typeof STAT_TABS)[number];

function PlayerRow({ player, statValue, statLabel, rank, href }: {
  player: TopPlayer;
  statValue: number;
  statLabel: string;
  rank: number;
  href?: string;
}) {
  const isTop3 = rank <= 3;
  const Wrapper = href
    ? ({ children }: { children: React.ReactNode }) => (
        <Link href={href} className="block group">
          {children}
        </Link>
      )
    : ({ children }: { children: React.ReactNode }) => <>{children}</>;

  return (
    <Wrapper>
    <div
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-800 cursor-pointer"
      style={{
        borderBottom: "1px solid #1e293b",
        backgroundColor: isTop3 ? "rgba(0,255,135,0.05)" : "transparent",
      }}
    >
      {/* Rank */}
      <div className="shrink-0 w-7 text-center">
        <span
          className="text-sm font-black tabular-nums"
          style={{ color: isTop3 ? "#00FF87" : "#52525B" }}
        >
          {rank}
        </span>
      </div>

      {/* Player photo */}
      <div className="shrink-0 w-9 h-9 rounded-full overflow-hidden bg-zinc-800 border border-white/[0.08]">
        <Image
          src={player.photo}
          alt={player.name}
          width={36}
          height={36}
          className="object-cover w-full h-full"
          unoptimized
        />
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-bold text-white truncate leading-tight"
          style={{ letterSpacing: "-0.01em" }}
        >
          {player.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <Image
            src={player.team.logo}
            alt={player.team.name}
            width={14}
            height={14}
            className="object-contain shrink-0"
            unoptimized
          />
          <span className="text-[11px] text-zinc-500 truncate">{player.team.name}</span>
          <span className="text-[10px] text-zinc-600 shrink-0">{player.nationality}</span>
        </div>
      </div>

      {/* Apps */}
      <div className="shrink-0 hidden sm:block text-center w-10">
        <p className="stat-label">Apps</p>
        <p className="text-xs font-bold text-zinc-400 mt-0.5 tabular-nums">{player.appearances}</p>
      </div>

      {/* Main stat */}
      <div className="shrink-0 text-center w-12">
        <p className="stat-label">{statLabel}</p>
        <p
          className="text-lg font-black tabular-nums mt-0.5"
          style={{ color: isTop3 ? "#00FF87" : "#ffffff", letterSpacing: "-0.02em" }}
        >
          {statValue}
        </p>
      </div>

      {/* Arrow if clickable */}
      {href && (
        <span className="shrink-0 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#00FF87" }}>→</span>
      )}
    </div>
    </Wrapper>
  );
}

export default function LeaguePlayersPage({ params, searchParams }: Props) {
  const league = getLeague(params.slug);
  if (!league) notFound();

  const season = formatSeason(league);
  const data = getTopScorers(league);

  const activeTab: StatTab =
    searchParams.tab === "Assists" ? "Assists"
    : searchParams.tab === "Cards" ? "Cards"
    : "Scorers";

  // Build player_id → slug lookup across WC + club players
  const playerSlugMap = new Map<number, string>();
  for (const p of getAllPlayers()) playerSlugMap.set(p.id, p.slug);

  const scorers  = data?.scorers ?? [];
  const assisters = data?.assisters ?? [];

  // Build cards list by merging + de-duping scorers+assisters, sort by yellow+red
  const cardPlayers = [...scorers, ...assisters]
    .filter((p, i, arr) => arr.findIndex(x => x.player_id === p.player_id) === i)
    .map(p => ({ ...p, total_cards: p.yellow_cards + p.red_cards }))
    .filter(p => p.total_cards > 0)
    .sort((a, b) => b.total_cards - a.total_cards)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  const activeList: TopPlayer[] =
    activeTab === "Assists" ? assisters
    : activeTab === "Cards" ? cardPlayers
    : scorers;

  return (
    <div className="space-y-8">

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <Link href={`/leagues/${league.slug}`}>{league.name}</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">Players</span>
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

      <LeagueTabBar slug={league.slug} active="Players" />

      {/* Stat tab pills */}
      <div className="flex gap-2">
        {STAT_TABS.map((tab) => (
          <Link
            key={tab}
            href={tab === "Scorers"
              ? `/leagues/${league.slug}/players`
              : `/leagues/${league.slug}/players?tab=${tab}`}
            className={[
              "px-3 py-1.5 rounded-full text-xs font-bold transition-colors",
              activeTab === tab
                ? "text-black"
                : "bg-white/[0.04] text-zinc-400 border border-white/[0.08] hover:text-white",
            ].join(" ")}
            style={activeTab === tab ? { backgroundColor: "#00FF87" } : {}}
          >
            {tab === "Scorers" ? `⚽ ${tab}` : tab === "Assists" ? `🅰️ ${tab}` : `🟨 ${tab}`}
          </Link>
        ))}
      </div>

      {/* No data */}
      {!data ? (
        <div className="section-block text-center py-12 space-y-2">
          <p className="text-zinc-400 text-sm font-bold">
            {league.id === 1
              ? "World Cup 2026 player stats will be available from June 11, 2026."
              : "Player stats not available for this league yet."}
          </p>
          {league.id === 1 && (
            <p className="text-zinc-600 text-xs">
              WC 2026 qualification data is excluded — it would mix non-tournament goals into the rankings.
            </p>
          )}
        </div>
      ) : activeList.length === 0 ? (
        <div className="section-block text-center py-12">
          <p className="text-zinc-500 text-sm">No data for this category.</p>
        </div>
      ) : (
        <div
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: "rgba(39,39,42,0.8)" }}
        >
          {/* Column headers */}
          <div
            className="flex items-center gap-3 px-4 py-2.5 text-[10px] uppercase tracking-[0.12em] font-bold text-zinc-500"
            style={{
              backgroundColor: "#0f172a",
              borderBottom: "1px solid #334155",
            }}
          >
            <span className="w-7 text-center">#</span>
            <span className="w-9 shrink-0" />
            <span className="flex-1">Player</span>
            <span className="hidden sm:block w-10 text-center">Apps</span>
            <span className="w-12 text-center">
              {activeTab === "Scorers" ? "Goals" : activeTab === "Assists" ? "Assists" : "Cards"}
            </span>
          </div>

          {/* Rows */}
          {activeList.map((player) => {
            const slug = playerSlugMap.get(player.player_id);
            return (
              <PlayerRow
                key={player.player_id}
                player={player}
                rank={player.rank}
                href={slug ? `/players/${slug}` : undefined}
                statValue={
                  activeTab === "Scorers" ? player.goals
                  : activeTab === "Assists" ? player.assists
                  : player.yellow_cards + player.red_cards
                }
                statLabel={
                  activeTab === "Scorers" ? "Goals"
                  : activeTab === "Assists" ? "Ast"
                  : "Cards"
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
