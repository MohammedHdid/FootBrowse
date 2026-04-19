import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { matches, getMatch, getStadium, getTeamPlayers, getTeam } from "@/lib/data";
import { getLeague } from "@/lib/leagues";
import { getFixtures, isFinished, isLive, isUpcoming, statusLabel, type Fixture } from "@/lib/fixtures";
import { getStandings } from "@/lib/standings";
import { getMatchEvents } from "@/lib/match-events";
import { getTeamStats } from "@/lib/team-stats";
import { getH2HForTeams } from "@/lib/h2h";
import { getUniqueTeamInjuries } from "@/lib/injuries";
import { getClubSquad, getClubTeam, type ClubSquad } from "@/lib/club-teams";
import { getPrediction } from "@/lib/predictions";
import { getMatchOdds } from "@/lib/odds";
import { getLineup } from "@/lib/lineups";
import { getWcFixtureId, getWcTeamId } from "@/lib/wc-ids";
import { supabase } from "@/lib/supabase";
import type { SyncedPlayer } from "@/lib/types";
import MatchPageClient, { type MatchPageData } from "./MatchPageClient";

interface Props {
  params: { slug: string; "match-slug": string };
  searchParams?: { tab?: string };
}

// ── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const wcParams = matches.map((m) => ({ slug: "world-cup", "match-slug": m.slug }));
  const { data } = await supabase
    .from("matches")
    .select("slug, league:leagues!league_id(slug)");
  const fixtureParams = (data ?? []).map((m: any) => ({
    slug: (m.league as any)?.slug as string | undefined,
    "match-slug": m.slug as string,
  })).filter((p): p is { slug: string; "match-slug": string } => !!p.slug);
  return [...wcParams, ...fixtureParams];
}

// ── Metadata ──────────────────────────────────────────────────────────────────

const TAB_META: Record<string, { suffix: string; descFn: (h: string, a: string) => string }> = {
  "events":   { suffix: "Events & Timeline",    descFn: (h, a) => `Live events, goals and timeline for ${h} vs ${a}.` },
  "stats":    { suffix: "Match Statistics",     descFn: (h, a) => `In-depth match stats for ${h} vs ${a}: shots, possession, xG and more.` },
  "h2h":      { suffix: "Head-to-Head",         descFn: (h, a) => `Head-to-head record between ${h} and ${a}. Historical meetings, win rates and recent results.` },
  "odds":     { suffix: "Prediction & Odds",    descFn: (h, a) => `${h} vs ${a} prediction, betting odds and AI probability analysis.` },
  "lineups":  { suffix: "Lineups & Availability", descFn: (h, a) => `Starting XIs, formations and injury availability for ${h} vs ${a}.` },
  "squad":    { suffix: "Squad",                descFn: (h, a) => `Full squad rosters and player profiles for ${h} vs ${a}.` },
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const matchSlug = params["match-slug"];
  const tab = searchParams?.tab ?? "";
  const canonical = `https://footbrowse.com/leagues/${params.slug}/matches/${matchSlug}`;
  const tabCanonical = tab ? `${canonical}?tab=${tab}` : canonical;

  if (params.slug === "world-cup") {
    const wc = getMatch(matchSlug);
    if (wc) return { title: wc.meta_title, description: wc.meta_description, alternates: { canonical: tabCanonical } };
  }

  const league = await getLeague(params.slug);
  if (league) {
    const fixtures = await getFixtures(league);
    const f = fixtures.find((f) => f.slug === matchSlug);
    if (f) {
      const h = f.home_team.name, a = f.away_team.name;
      const tabInfo = TAB_META[tab];
      const title = tabInfo
        ? `${h} vs ${a} ${tabInfo.suffix} — ${league.name} | FootBrowse`
        : `${h} vs ${a} Prediction, Odds & Analysis — ${league.name} | FootBrowse`;
      const description = tabInfo
        ? tabInfo.descFn(h, a)
        : `AI-powered prediction, betting odds, head-to-head and full match analysis for ${h} vs ${a} in ${league.name}.`;
      return { title, description, alternates: { canonical: tabCanonical } };
    }
  }
  return {};
}

// ── Static broadcast data ─────────────────────────────────────────────────────

const LEAGUE_BROADCASTS: Record<string, Array<{ country: string; channels: string[] }>> = {
  "premier-league": [
    { country: "UK",            channels: ["Sky Sports", "TNT Sports", "Amazon Prime"] },
    { country: "USA",           channels: ["NBC", "Peacock", "USA Network"] },
    { country: "International", channels: ["beIN Sports", "DAZN"] },
  ],
  "la-liga": [
    { country: "Spain",         channels: ["Movistar+", "LaLiga TV"] },
    { country: "USA",           channels: ["ESPN+", "ESPN Deportes"] },
    { country: "International", channels: ["beIN Sports", "DAZN"] },
  ],
  "bundesliga": [
    { country: "Germany",       channels: ["Sky Sport", "DAZN", "Sat.1"] },
    { country: "UK",            channels: ["Sky Sport", "TNT Sports"] },
    { country: "USA",           channels: ["ESPN+", "Fubo"] },
  ],
  "serie-a": [
    { country: "Italy",         channels: ["DAZN", "Sky Sport Italy"] },
    { country: "UK",            channels: ["TNT Sports"] },
    { country: "USA",           channels: ["Paramount+", "CBS Sports"] },
  ],
  "ligue-1": [
    { country: "France",        channels: ["Canal+", "Amazon Prime Video"] },
    { country: "UK",            channels: ["beIN Sports"] },
    { country: "USA",           channels: ["beIN Sports Connect"] },
  ],
  "uefa-champions-league": [
    { country: "UK",            channels: ["TNT Sports", "Channel 4"] },
    { country: "USA",           channels: ["Paramount+", "CBS Sports Golazo"] },
    { country: "International", channels: ["DAZN", "beIN Sports"] },
  ],
};

// ── Club squad adapter ────────────────────────────────────────────────────────

const CLUB_POS_MAP: Record<string, string> = {
  Goalkeeper: "Goalkeeper",
  Defender:   "Centre-Back",
  Midfielder: "Central Midfield",
  Forward:    "Centre-Forward",
  Attacker:   "Centre-Forward",
};

function adaptClubSquad(squad: ClubSquad | null): SyncedPlayer[] {
  if (!squad) return [];
  return squad.players.map((p): SyncedPlayer => ({
    id:           p.id,
    slug:         String(p.id),
    name:         p.name,
    firstName:    p.name.split(" ")[0],
    lastName:     p.name.split(" ").slice(1).join(" ") || p.name,
    position:     CLUB_POS_MAP[p.position] ?? p.position,
    dateOfBirth:  p.age ? new Date(new Date().getFullYear() - p.age, 0, 1).toISOString() : null,
    nationality:  "",
    shirtNumber:  p.number,
    marketValue:  null,
    photo_url:    p.photo || null,
    thumbnail_url: p.photo || null,
    bio:          null,
    teamId:       squad.team_id,
    teamName:     squad.team_name,
    teamSlug:     squad.team_slug,
    teamCrest:    "",
  }));
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function LeagueMatchPage({ params }: { params: Props["params"] }) {
  const matchSlug = params["match-slug"];
  const isWcSlug  = params.slug === "world-cup";
  const league    = await getLeague(params.slug);
  if (!league) notFound();

  // ── Resolve match data ───────────────────────────────────────────────────
  const wcMatch = isWcSlug ? getMatch(matchSlug) : null;
  const isWC    = isWcSlug && wcMatch != null;
  let clubFixture: Fixture | null = null;

  if (!isWC) {
    const allFixtures = await getFixtures(league);
    clubFixture = allFixtures.find((f) => f.slug === matchSlug) ?? null;
    if (!clubFixture) notFound();
  }

  // league.national doesn't exist in new League type — national team support is WC-only for now
  const isNational = false;

  // ── Team identity ────────────────────────────────────────────────────────
  const homeId    = isWC ? (getWcTeamId(wcMatch!.team_a.slug) ?? 0) : clubFixture!.home_team.id;
  const awayId    = isWC ? (getWcTeamId(wcMatch!.team_b.slug) ?? 0) : clubFixture!.away_team.id;
  const homeName  = isWC ? wcMatch!.team_a.name  : clubFixture!.home_team.name;
  const awayName  = isWC ? wcMatch!.team_b.name  : clubFixture!.away_team.name;
  let homeLogo    = isWC ? `https://flagcdn.com/w320/${wcMatch!.team_a.code}.png` : clubFixture!.home_team.logo;
  let awayLogo    = isWC ? `https://flagcdn.com/w320/${wcMatch!.team_b.code}.png` : clubFixture!.away_team.logo;
  const homeSlug  = isWC ? wcMatch!.team_a.slug  : clubFixture!.home_team.slug;
  const awaySlug  = isWC ? wcMatch!.team_b.slug  : clubFixture!.away_team.slug;
  const matchDate = isWC ? wcMatch!.date          : clubFixture!.date;
  const kickoffUtc = isWC ? wcMatch!.kickoff_utc  : clubFixture!.kickoff_utc;
  const fixtureStatus = isWC ? "NS" : clubFixture!.status;
  const fixtureId     = isWC ? getWcFixtureId(matchSlug) : clubFixture!.fixture_id;

  // ── Status flags ─────────────────────────────────────────────────────────
  const finished = isFinished(fixtureStatus);
  const live     = isLive(fixtureStatus);
  const upcoming = isUpcoming(fixtureStatus) || isWC;

  // ── National team enrichment ─────────────────────────────────────────────
  const homeNationalTeam = isWC ? getTeam(homeSlug) : null;
  const awayNationalTeam = isWC ? getTeam(awaySlug) : null;
  const homeFifaRank = isWC ? wcMatch!.team_a.fifa_rank : null;
  const awayFifaRank = isWC ? wcMatch!.team_b.fifa_rank : null;
  const homeIsFlag = isWC;
  const awayIsFlag = isWC;

  // ── Team form / record (still reads static files) ─────────────────────────
  const homeTeamStats = !isWC ? getTeamStats(homeSlug).find((s) => s.league_slug === params.slug) : null;
  const awayTeamStats = !isWC ? getTeamStats(awaySlug).find((s) => s.league_slug === params.slug) : null;
  const homeForm = isWC ? (homeNationalTeam?.form ?? []).join("") : (homeTeamStats?.form ?? "");
  const awayForm = isWC ? (awayNationalTeam?.form ?? []).join("") : (awayTeamStats?.form ?? "");

  // ── H2H (reads Supabase, falls back to local JSON) ────────────────────────
  const h2h = homeId && awayId ? await getH2HForTeams(homeId, awayId) : null;

  // ── WC squads (sync) ──────────────────────────────────────────────────────
  const wcSquadA = isWC ? getTeamPlayers(homeSlug) : [];
  const wcSquadB = isWC ? getTeamPlayers(awaySlug) : [];

  // ── Parallel async fetches ────────────────────────────────────────────────
  const [
    matchEventsData,
    clubSquadHome,
    clubSquadAway,
    homeInjuries,
    awayInjuries,
    prediction,
    oddsData,
    lineup,
    homeClubTeam,
    standingsData,
  ] = await Promise.all([
    fixtureId ? getMatchEvents(fixtureId) : Promise.resolve(null),
    !isWC ? getClubSquad(homeSlug) : Promise.resolve(null),
    !isWC ? getClubSquad(awaySlug) : Promise.resolve(null),
    !isWC ? getUniqueTeamInjuries(params.slug, homeSlug) : Promise.resolve([]),
    !isWC ? getUniqueTeamInjuries(params.slug, awaySlug) : Promise.resolve([]),
    fixtureId ? getPrediction(fixtureId) : Promise.resolve(null),
    fixtureId ? getMatchOdds(fixtureId) : Promise.resolve(null),
    (fixtureId && !isWC) ? getLineup(fixtureId) : Promise.resolve(null),
    !isWC ? getClubTeam(homeSlug) : Promise.resolve(null),
    !isWC ? getStandings(league) : Promise.resolve(null),
  ]);

  // ── Match events ─────────────────────────────────────────────────────────
  const events    = matchEventsData?.events ?? [];
  const clubScore = matchEventsData?.score ?? clubFixture?.score ?? { home: null, away: null };
  const homeStats = matchEventsData?.home_stats ?? null;
  const awayStats = matchEventsData?.away_stats ?? null;
  const homeTeamId = clubFixture?.home_team.id ?? 0;

  // ── Standings ─────────────────────────────────────────────────────────────
  let homeStandingRow = null;
  let awayStandingRow = null;
  if (standingsData) {
    const allRows = standingsData.groups.flatMap((g) => g.table);
    const homeRow = allRows.find((r) => r.team.slug === homeSlug) ?? null;
    const awayRow = allRows.find((r) => r.team.slug === awaySlug) ?? null;
    if (homeRow) {
      homeStandingRow = {
        rank: homeRow.rank, points: homeRow.points, played: homeRow.played,
        won: homeRow.won, drawn: homeRow.drawn, lost: homeRow.lost,
        goal_diff: homeRow.goal_diff, description: homeRow.description,
      };
    }
    if (awayRow) {
      awayStandingRow = {
        rank: awayRow.rank, points: awayRow.points, played: awayRow.played,
        won: awayRow.won, drawn: awayRow.drawn, lost: awayRow.lost,
        goal_diff: awayRow.goal_diff, description: awayRow.description,
      };
    }
  }

  // ── Related matches ──────────────────────────────────────────────────────
  let relatedMatches: Array<{ label: string; href: string; meta: string }> = [];
  if (isWC) {
    relatedMatches = matches
      .filter((m) => m.slug !== wcMatch!.slug)
      .sort((a, b) => {
        let sa = 0, sb = 0;
        if (wcMatch!.group && a.group === wcMatch!.group) sa += 100;
        if (wcMatch!.group && b.group === wcMatch!.group) sb += 100;
        if (a.stage === wcMatch!.stage) sa += 50;
        if (b.stage === wcMatch!.stage) sb += 50;
        return sb - sa;
      })
      .slice(0, 5)
      .map((m) => ({
        label: `${m.team_a.name} vs ${m.team_b.name}`,
        href:  `/leagues/world-cup/matches/${m.slug}`,
        meta:  new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      }));
  } else {
    const allFixtures = await getFixtures(league);
    relatedMatches = allFixtures
      .filter((f) => f.slug !== matchSlug && (f.status === "NS" || isFinished(f.status)))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)
      .map((f) => ({
        label: `${f.home_team.name} vs ${f.away_team.name}`,
        href:  `/leagues/${league.slug}/matches/${f.slug}`,
        meta:  new Date(f.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      }));
  }

  // ── FAQ ──────────────────────────────────────────────────────────────────
  const clubFaq: Array<{ q: string; a: string }> = !isWC ? [
    {
      q: `When does ${homeName} vs ${awayName} kick off?`,
      a: `${homeName} vs ${awayName} is scheduled for ${new Date(matchDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} at ${kickoffUtc} UTC.`,
    },
    ...(homeClubTeam?.venue?.name ? [{
      q: `Where is ${homeName} vs ${awayName} being played?`,
      a: `The match will be played at ${homeClubTeam.venue.name}${homeClubTeam.venue.city ? `, ${homeClubTeam.venue.city}` : ""}${homeClubTeam.venue.capacity ? ` (capacity ${homeClubTeam.venue.capacity.toLocaleString()})` : ""}.`,
    }] : []),
    ...(h2h && h2h.played > 0 ? [{
      q: `What is the head-to-head record between ${homeName} and ${awayName}?`,
      a: `In their last ${h2h.played} meetings, ${homeName} won ${h2h.homeWins} times, ${awayName} won ${h2h.awayWins} times, and ${h2h.draws} matches ended in a draw.`,
    }] : []),
    ...(homeForm || awayForm ? [{
      q: `What is the current form of ${homeName} and ${awayName}?`,
      a: `${homeName}'s last 5 results: ${homeForm.slice(-5) || "N/A"}. ${awayName}'s last 5 results: ${awayForm.slice(-5) || "N/A"}.`,
    }] : []),
  ] : [];
  const faqItems = isWC ? (wcMatch!.content.faq ?? []) : clubFaq;

  // ── JSON-LD ───────────────────────────────────────────────────────────────
  const stadium = isWC ? getStadium(wcMatch!.stadium_slug) : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",       item: "https://footbrowse.com" },
      { "@type": "ListItem", position: 2, name: league.name,  item: `https://footbrowse.com/leagues/${league.slug}` },
      { "@type": "ListItem", position: 3, name: `${homeName} vs ${awayName}`,
        item: `https://footbrowse.com/leagues/${league.slug}/matches/${matchSlug}` },
    ],
  };

  const faqJsonLd = faqItems.length > 0 ? {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({
      "@type": "Question", name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  } : null;

  const eventJsonLd = {
    "@context": "https://schema.org", "@type": "SportsEvent",
    name: `${homeName} vs ${awayName} — ${league.name}`,
    startDate: `${matchDate}T${kickoffUtc}:00Z`,
    ...(isWC && stadium ? {
      location: { "@type": "StadiumOrArena", name: stadium.name,
        address: { "@type": "PostalAddress", addressLocality: wcMatch!.city } },
    } : homeClubTeam?.venue?.name ? {
      location: { "@type": "StadiumOrArena", name: homeClubTeam.venue.name,
        address: { "@type": "PostalAddress", addressLocality: homeClubTeam.venue.city ?? "" } },
    } : {}),
    homeTeam: { "@type": "SportsTeam", name: homeName },
    awayTeam: { "@type": "SportsTeam", name: awayName },
    sport: "Football",
  };

  // ── Build MatchPageData ───────────────────────────────────────────────────
  const squadA = isWC ? (wcSquadA as SyncedPlayer[]) : adaptClubSquad(clubSquadHome);
  const squadB = isWC ? (wcSquadB as SyncedPlayer[]) : adaptClubSquad(clubSquadAway);

  const matchData: MatchPageData = {
    leagueSlug:   league.slug,
    leagueName:   league.name,
    leagueLogo:   league.logo,
    isWC,
    isNational,
    homeId,
    awayId,
    homeName,
    awayName,
    homeLogo,
    awayLogo,
    homeSlug,
    awaySlug,
    homeIsFlag,
    awayIsFlag,
    homeFifaRank: homeFifaRank ?? null,
    awayFifaRank: awayFifaRank ?? null,
    matchDate,
    kickoffUtc,
    kickoffEst:   isWC ? (wcMatch!.kickoff_est ?? null) : null,
    fixtureStatus,
    fixtureStatusLabel: statusLabel(fixtureStatus),
    fixtureId:    fixtureId ?? null,
    matchday:     isWC ? null : (clubFixture!.matchday ?? null),
    stage:        isWC ? null : (clubFixture!.stage !== "Regular Season" ? clubFixture!.stage : null),
    city:         isWC ? wcMatch!.city : null,
    group:        isWC ? (wcMatch!.group ?? null) : null,
    finished,
    live,
    upcoming,
    score: clubScore,
    homeTeamId,
    events,
    homeStats,
    awayStats,
    homeForm,
    awayForm,
    homeTeamRecord: homeTeamStats ?? null,
    awayTeamRecord: awayTeamStats ?? null,
    homeNationalInfo: isWC ? {
      fifaRank:   homeFifaRank ?? null,
      yearFormed: homeNationalTeam?.year_formed ?? null,
      wcTitles:   homeNationalTeam?.wc_titles ?? 0,
    } : null,
    awayNationalInfo: isWC ? {
      fifaRank:   awayFifaRank ?? null,
      yearFormed: awayNationalTeam?.year_formed ?? null,
      wcTitles:   awayNationalTeam?.wc_titles ?? 0,
    } : null,
    h2h,
    prediction: prediction ? {
      advice:          prediction.advice,
      winner_name:     prediction.winner_name,
      winner_comment:  prediction.winner_comment,
      percent:         prediction.percent,
      under_over:      prediction.under_over,
      goals_home:      prediction.goals_home,
      goals_away:      prediction.goals_away,
    } : null,
    oddsData: oddsData ? {
      bookmaker_name: oddsData.bookmaker_name,
      home_win:       oddsData.home_win,
      draw:           oddsData.draw,
      away_win:       oddsData.away_win,
    } : null,
    lineup: lineup ? {
      home: {
        team_id:     lineup.home.team_id,
        team_name:   lineup.home.team_name,
        formation:   lineup.home.formation,
        coach:       lineup.home.coach,
        startXI:     lineup.home.startXI,
        substitutes: lineup.home.substitutes,
      },
      away: {
        team_id:     lineup.away.team_id,
        team_name:   lineup.away.team_name,
        formation:   lineup.away.formation,
        coach:       lineup.away.coach,
        startXI:     lineup.away.startXI,
        substitutes: lineup.away.substitutes,
      },
    } : null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    squadA: squadA as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    squadB: squadB as any,
    teamAInfo: isWC
      ? { name: wcMatch!.team_a.name, slug: wcMatch!.team_a.slug, code: wcMatch!.team_a.code, logo: homeLogo }
      : { name: homeName, slug: homeSlug, code: "", logo: homeLogo, teamHrefPrefix: `/leagues/${league.slug}/teams/` },
    teamBInfo: isWC
      ? { name: wcMatch!.team_b.name, slug: wcMatch!.team_b.slug, code: wcMatch!.team_b.code, logo: awayLogo }
      : { name: awayName, slug: awaySlug, code: "", logo: awayLogo, teamHrefPrefix: `/leagues/${league.slug}/teams/` },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    homeInjuries: homeInjuries as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    awayInjuries: awayInjuries as any,
    venueName:       isWC ? null : (homeClubTeam?.venue?.name ?? null),
    venueCity:       isWC ? null : (homeClubTeam?.venue?.city ?? null),
    venueCapacity:   isWC ? null : (homeClubTeam?.venue?.capacity ?? null),
    homeClubFounded: isWC ? null : (homeClubTeam?.founded ?? null),
    stadiumInfo: stadium ? {
      slug:           stadium.slug,
      name:           stadium.name,
      city:           stadium.city,
      state:          stadium.state,
      capacity:       stadium.capacity,
      surface:        stadium.surface,
      roof:           stadium.roof,
      photo_url:      stadium.photo_url ?? null,
      is_final_venue: stadium.is_final_venue ?? false,
    } : null,
    wcPreview: isWC ? (wcMatch!.content.preview ?? null) : null,
    tvChannels: isWC ? (wcMatch!.tv_channels ?? []) : (LEAGUE_BROADCASTS[params.slug] ?? []),
    travel: isWC ? {
      nearest_airport:      wcMatch!.travel?.nearest_airport ?? null,
      hotel_affiliate_url:  wcMatch!.travel?.hotel_affiliate_url ?? "",
      flight_affiliate_url: wcMatch!.travel?.flight_affiliate_url ?? "",
    } : null,
    homeStandingRow,
    awayStandingRow,
    relatedMatches,
    faqItems,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }} />

      {/* Breadcrumb — server-rendered above sticky hero */}
      <nav className="breadcrumb px-4 pt-3 pb-2 max-w-2xl mx-auto">
        <Link href="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <Link href={`/leagues/${league.slug}`}>{league.name}</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{homeName} vs {awayName}</span>
      </nav>

      <MatchPageClient data={matchData} />
    </>
  );
}
