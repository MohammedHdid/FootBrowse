import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { teams, getTeam, getTeamPlayers } from "@/lib/data";
import { getClubTeamPlayers } from "@/lib/club-players";
import {
  getAllClubTeams,
  getClubTeam,
  getClubSquad,
  getCoach,
  groupByPosition,
  type ClubPlayer,
} from "@/lib/club-teams";
import { getLeague, formatSeason } from "@/lib/leagues";
import { getTeamStats } from "@/lib/team-stats";
import { getFixtures, isFinished, isUpcoming } from "@/lib/fixtures";
import { getStadium } from "@/lib/data";
import { getUniqueTeamInjuries } from "@/lib/injuries";
import TeamPageClient, { type TeamPageData } from "./TeamPageClient";

interface Props {
  params: { slug: string; teamSlug: string };
}


// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  const clubParams = getAllClubTeams().map((t) => ({
    slug:     t.primary_league_slug,
    teamSlug: t.slug,
  }));
  const wcParams = teams.map((t) => ({
    slug:     "world-cup",
    teamSlug: t.slug,
  }));
  return [...clubParams, ...wcParams];
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export function generateMetadata({ params }: Props): Metadata {
  const isWC   = params.slug === "world-cup";
  const wcTeam = isWC ? getTeam(params.teamSlug) : null;
  const club   = !wcTeam ? getClubTeam(params.teamSlug) : null;
  const name   = wcTeam?.name ?? club?.name ?? params.teamSlug;
  const league = getLeague(params.slug);
  const leagueName = league?.name ?? params.slug;
  const season = league ? formatSeason(league) : "";
  return {
    title: `${name} ${season} — Squad, Fixtures & Stats | FootBrowse`,
    description: `${name} full squad, fixtures, and stats for ${leagueName} ${season}. View players, coach, and performance on FootBrowse.`,
    alternates: {
      canonical: `https://footbrowse.com/leagues/${params.slug}/teams/${params.teamSlug}`,
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeamPage({ params }: Props) {
  const isWC   = params.slug === "world-cup";
  const wcTeam = isWC ? getTeam(params.teamSlug) : null;
  const club   = !wcTeam ? getClubTeam(params.teamSlug) : null;
  if (!wcTeam && !club) notFound();

  const league = getLeague(params.slug);
  if (!league) notFound();

  const season = formatSeason(league);

  // ── Coach (API-first, then WC fallback) ────────────────────────────────────
  const apiCoach = getCoach(params.teamSlug);
  const coachName   = apiCoach?.name   ?? wcTeam?.coach   ?? null;
  const coachPhoto  = apiCoach?.photo  ?? wcTeam?.coach_photo ?? null;
  const coachNat    = apiCoach?.nationality ?? null;
  const coachAge    = apiCoach?.age ?? null;
  const coachCareer = apiCoach?.career ?? [];

  // ── Squad ──────────────────────────────────────────────────────────────────
  // WC: SyncedPlayer[] → normalise to ClubPlayer-like for display
  const wcRawPlayers = isWC ? getTeamPlayers(params.teamSlug) : [];
  const wcSquadPlayers: (ClubPlayer & { slug?: string })[] = wcRawPlayers.map((p) => ({
    id:       p.id,
    name:     p.name,
    age:      p.dateOfBirth
      ? Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / 31557600000)
      : 0,
    number:   p.shirtNumber,
    position: p.position,
    photo:    p.photo_url ?? "",
    slug:     p.slug,
  }));
  const wcGroups = groupByPosition(wcSquadPlayers);

  const clubSquad = !isWC ? getClubSquad(params.teamSlug) : null;
  // Build id→slug map from club-players.json so squad cards link to player pages
  const clubPlayerSlugs = new Map<number, string>();
  if (!isWC) {
    for (const p of getClubTeamPlayers(params.teamSlug)) {
      clubPlayerSlugs.set(p.id, p.slug);
    }
  }
  const clubSquadWithSlugs = clubSquad
    ? clubSquad.players.map((p) => ({ ...p, slug: clubPlayerSlugs.get(p.id) }))
    : [];
  const clubGroups = clubSquad ? groupByPosition(clubSquadWithSlugs) : [];

  const positionGroups = isWC ? wcGroups : clubGroups;
  const totalPlayers   = isWC ? wcSquadPlayers.length : (clubSquad?.players.length ?? 0);

  // ── League stats ───────────────────────────────────────────────────────────
  const stats = getTeamStats(params.teamSlug).find((s) => s.league_slug === params.slug);
  const formStr = stats?.form ?? (isWC ? (wcTeam?.form ?? []).join("") : "");
  const formChars = formStr.slice(-10).split("").filter((c) => ["W", "D", "L"].includes(c));

  // ── Fixtures ───────────────────────────────────────────────────────────────
  const allFixtures = getFixtures(league);
  const teamFixtures = allFixtures.filter(
    (f) => f.home_team.slug === params.teamSlug || f.away_team.slug === params.teamSlug,
  );
  const upcoming = teamFixtures
    .filter((f) => isUpcoming(f.status))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);
  const results = teamFixtures
    .filter((f) => isFinished(f.status))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // ── Venue ──────────────────────────────────────────────────────────────────
  const wcStadium = wcTeam ? getStadium(wcTeam.stadium_slug) : null;
  const venue = club?.venue?.name ? club.venue : wcStadium ? {
    name:     wcStadium.name,
    city:     wcStadium.city,
    capacity: wcStadium.capacity,
    image:    wcStadium.photo_url ?? null,
  } : null;

  // ── Injuries ───────────────────────────────────────────────────────────────
  const injuries = !isWC ? getUniqueTeamInjuries(params.slug, params.teamSlug) : [];

  // ── Hero display ───────────────────────────────────────────────────────────
  const teamName  = wcTeam?.name ?? club!.name;
  const teamLogo  = wcTeam?.badge_url ?? club?.logo ?? "";
  const teamFlag  = wcTeam?.flag_large ?? null;
  const teamColor = wcTeam?.color_primary ?? null;

  // ── JSON-LD ────────────────────────────────────────────────────────────────
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type":    "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",     item: "https://footbrowse.com" },
      { "@type": "ListItem", position: 2, name: "Leagues",  item: "https://footbrowse.com/leagues" },
      { "@type": "ListItem", position: 3, name: league.name, item: `https://footbrowse.com/leagues/${league.slug}` },
      { "@type": "ListItem", position: 4, name: "Teams",    item: `https://footbrowse.com/leagues/${league.slug}/teams` },
      { "@type": "ListItem", position: 5, name: teamName,   item: `https://footbrowse.com/leagues/${league.slug}/teams/${params.teamSlug}` },
    ],
  };

  const teamJsonLd = {
    "@context": "https://schema.org",
    "@type":    "SportsTeam",
    name:       teamName,
    sport:      "Football",
    logo:       teamLogo,
    url:        `https://footbrowse.com/leagues/${league.slug}/teams/${params.teamSlug}`,
    ...(coachName ? { coach: { "@type": "Person", name: coachName } } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(teamJsonLd) }} />

      <div className="space-y-8">

        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumb-sep">›</span>
          <Link href={`/leagues/${league.slug}`}>{league.name}</Link>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">{teamName}</span>
        </nav>

        {/* WC colour accent bar */}
        {teamColor && teamColor !== "#FFFFFF" && teamColor !== "#ffffff" && (
          <div className="h-1 w-full rounded-full" style={{ backgroundColor: teamColor }} />
        )}

        {/* ── Hero ── */}
        <header className="page-header">
          <div className="flex items-start gap-5 flex-wrap sm:flex-nowrap">

            {/* Logo / crest block */}
            <div className="flex items-center gap-3 shrink-0">
              {/* For WC: show flag large + badge side by side */}
              {teamFlag ? (
                <>
                  <Image
                    src={teamFlag}
                    alt={`${teamName} flag`}
                    width={160}
                    height={107}
                    priority
                    className="rounded-lg shadow-xl object-cover"
                    style={{ width: 110, height: "auto" }}
                    unoptimized
                  />
                  {teamLogo && (
                    <Image
                      src={teamLogo}
                      alt={`${teamName} crest`}
                      width={64}
                      height={64}
                      className="object-contain drop-shadow-lg"
                      style={{ width: 56, height: 56 }}
                      unoptimized
                    />
                  )}
                </>
              ) : (
                <div
                  className="rounded-2xl overflow-hidden flex items-center justify-center bg-slate-50 shadow-inner p-1.5 shrink-0"
                  style={{
                    width: 110, height: 110,
                  }}
                >
                  <Image
                    src={teamLogo}
                    alt={`${teamName} crest`}
                    width={98}
                    height={98}
                    priority
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
            </div>

            {/* Text info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Image src={league.logo} alt={league.name} width={18} height={18} className="object-contain" unoptimized />
                <span className="tag text-xs">{league.name}</span>
                <span className="badge-blue">{season}</span>
                {wcTeam && <span className="badge-green">{wcTeam.confederation}</span>}
                {wcTeam?.group && <span className="tag">Group {wcTeam.group}</span>}
                {club?.country && <span className="tag">{club.country}</span>}
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>
                {teamName}
              </h1>
              {wcTeam?.nickname && (
                <p className="text-sm mt-1 italic" style={{ color: teamColor && teamColor !== "#FFFFFF" ? teamColor : "#00FF87" }}>
                  &ldquo;{wcTeam.nickname}&rdquo;
                </p>
              )}

              {/* Founded / venue line */}
              <p className="text-zinc-400 text-sm mt-1">
                {venue?.name && <>{venue.name}{venue.city ? ` · ${venue.city}` : ""}{venue.capacity ? ` · ${venue.capacity.toLocaleString()} cap.` : ""}</>}
                {!venue?.name && (club?.founded || wcTeam?.year_formed) && (
                  <>Est. {club?.founded ?? wcTeam?.year_formed}</>
                )}
              </p>
              {venue?.name && (club?.founded || wcTeam?.year_formed) && (
                <p className="text-zinc-600 text-xs mt-0.5">Est. {club?.founded ?? wcTeam?.year_formed}</p>
              )}
            </div>
          </div>
        </header>

      </div>

      {/* Team tabs client — Overview | Squad | Fixtures | Stats */}
      <TeamPageClient data={{
        teamSlug:     params.teamSlug,
        teamName,
        teamLogo,
        teamFlag,
        teamColor,
        isWC,

        leagueSlug:   league.slug,
        leagueName:   league.name,
        leagueLogo:   league.logo ?? "",
        season,

        coachName,
        coachPhoto,
        coachNat,
        coachAge,
        coachCareer: coachCareer.map((c) => ({
          team_name: c.team_name,
          team_logo: c.team_logo ?? null,
          start:     c.start ?? null,
          end:       c.end ?? null,
        })),

        formChars,

        stats: stats ? {
          league_name:    stats.league_name,
          played:         stats.played,
          wins:           stats.wins,
          draws:          stats.draws,
          losses:         stats.losses,
          goals_for:      stats.goals_for,
          goals_against:  stats.goals_against,
          clean_sheets:   stats.clean_sheets,
          failed_to_score: stats.failed_to_score,
        } : null,

        upcoming: upcoming.map((f) => ({
          fixture_id:  f.fixture_id,
          slug:        f.slug,
          date:        f.date,
          kickoff_utc: f.kickoff_utc,
          home_team:   { slug: f.home_team.slug, name: f.home_team.name, logo: f.home_team.logo },
          away_team:   { slug: f.away_team.slug, name: f.away_team.name, logo: f.away_team.logo },
          score:       { home: f.score.home ?? null, away: f.score.away ?? null },
          stage:       f.stage ?? null,
        })),

        results: results.map((f) => ({
          fixture_id:  f.fixture_id,
          slug:        f.slug,
          date:        f.date,
          kickoff_utc: f.kickoff_utc,
          home_team:   { slug: f.home_team.slug, name: f.home_team.name, logo: f.home_team.logo },
          away_team:   { slug: f.away_team.slug, name: f.away_team.name, logo: f.away_team.logo },
          score:       { home: f.score.home ?? null, away: f.score.away ?? null },
          stage:       f.stage ?? null,
        })),

        positionGroups: positionGroups.map(({ position, players }) => ({
          position,
          players: (players as (typeof players[number] & { slug?: string })[]).map((p) => ({
            id:     p.id,
            name:   p.name,
            age:    p.age,
            number: p.number ?? null,
            photo:  p.photo ?? "",
            slug:   p.slug ?? null,
          })),
        })),
        totalPlayers,

        venue: venue?.name ? {
          name:     venue.name,
          city:     venue.city ?? null,
          capacity: venue.capacity ?? null,
          image:    venue.image ?? null,
        } : null,

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        injuries: injuries as any,

        wcInfo: wcTeam ? {
          fifa_rank:      wcTeam.fifa_rank,
          wc_titles:      wcTeam.wc_titles,
          wc_appearances: wcTeam.wc_appearances,
          group:          wcTeam.group ?? null,
          best_result:    wcTeam.best_result ?? null,
          confederation:  wcTeam.confederation,
          nickname:       wcTeam.nickname ?? null,
        } : null,

        clubInfo: club ? {
          founded: club.founded ?? null,
          country: club.country ?? null,
        } : null,
      } satisfies TeamPageData} />

    </>
  );
}
