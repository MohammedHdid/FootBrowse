import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { matches, getMatch, getStadium, getTeamPlayers, getTeam } from "@/lib/data";
import { getAllLeagues, getLeague } from "@/lib/leagues";
import { getFixtures, isFinished, isLive, isUpcoming, statusLabel, type Fixture } from "@/lib/fixtures";
import { getMatchEvents } from "@/lib/match-events";
import { getTeamStats } from "@/lib/team-stats";
import { getH2HForTeams } from "@/lib/h2h";
import { getUniqueTeamInjuries } from "@/lib/injuries";
import { getClubSquad, getClubTeam, type ClubSquad } from "@/lib/club-teams";
import { getPrediction } from "@/lib/predictions";
import { getMatchOdds } from "@/lib/odds";
import type { SyncedPlayer } from "@/lib/types";
import InjuryList from "@/components/InjuryList";
import AdSlot from "@/components/AdSlot";
import MatchSquads from "@/components/MatchSquads";
import MatchFlagImg from "@/components/MatchFlagImg";

interface Props {
  params: { slug: string; "match-slug": string };
}

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  const wcParams = matches.map((m) => ({ slug: "world-cup", "match-slug": m.slug }));
  const clubParams = getAllLeagues()
    .filter((l) => l.slug !== "world-cup")
    .flatMap((league) => getFixtures(league).map((f) => ({ slug: league.slug, "match-slug": f.slug })));
  return [...wcParams, ...clubParams];
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export function generateMetadata({ params }: Props): Metadata {
  const matchSlug = params["match-slug"];
  const canonical = `https://footbrowse.com/leagues/${params.slug}/matches/${matchSlug}`;

  if (params.slug === "world-cup") {
    const wc = getMatch(matchSlug);
    if (wc) return { title: wc.meta_title, description: wc.meta_description, alternates: { canonical } };
  }

  const league = getLeague(params.slug);
  if (league) {
    const f = getFixtures(league).find((f) => f.slug === matchSlug);
    if (f) return {
      title: `${f.home_team.name} vs ${f.away_team.name} — ${league.name} | FootBrowse`,
      description: `Match preview, events and stats for ${f.home_team.name} vs ${f.away_team.name} in the ${league.name}.`,
      alternates: { canonical },
    };
  }
  return {};
}

// ── Static broadcast data by league ──────────────────────────────────────────

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

// ── Inline helpers ────────────────────────────────────────────────────────────

const FORM_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  W: { bg: "rgba(0,255,135,0.12)",  color: "#00FF87", border: "rgba(0,255,135,0.3)" },
  D: { bg: "rgba(234,179,8,0.12)",  color: "#EAB308", border: "rgba(234,179,8,0.3)" },
  L: { bg: "rgba(239,68,68,0.12)",  color: "#EF4444", border: "rgba(239,68,68,0.3)" },
};

function FormPills({ form, max = 6 }: { form: string; max?: number }) {
  const chars = form.slice(-max).split("").filter((c) => ["W","D","L"].includes(c));
  if (!chars.length) return <span className="text-[10px] text-zinc-700">No data</span>;
  return (
    <div className="flex gap-1">
      {chars.map((r, i) => {
        const s = FORM_STYLE[r];
        return (
          <span key={i} className="w-6 h-6 rounded text-[10px] font-black flex items-center justify-center"
            style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
            {r}
          </span>
        );
      })}
    </div>
  );
}

function StatBar({ home, away, label }: { home: number | null; away: number | null; label: string }) {
  if (home === null && away === null) return null;
  const h = home ?? 0, a = away ?? 0;
  const total = h + a;
  const pct = total > 0 ? (h / total) * 100 : 50;
  return (
    <div className="py-2.5 border-b border-white/[0.04] last:border-0">
      <div className="flex justify-between items-center text-xs mb-1.5">
        <span className="font-bold text-white tabular-nums">{h}</span>
        <span className="text-zinc-500 uppercase tracking-widest text-[10px]">{label}</span>
        <span className="font-bold text-white tabular-nums">{a}</span>
      </div>
      <div className="flex h-1 rounded-full overflow-hidden gap-px">
        <div style={{ width: `${pct}%`, backgroundColor: "rgba(0,255,135,0.5)" }} />
        <div style={{ flex: 1, backgroundColor: "rgba(59,130,246,0.5)" }} />
      </div>
    </div>
  );
}

// Map API-Football simple positions to the detailed names MatchSquads/positions.ts knows
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

export default function LeagueMatchPage({ params }: Props) {
  const matchSlug = params["match-slug"];
  const isWC      = params.slug === "world-cup";
  const league    = getLeague(params.slug);
  if (!league) notFound();

  // ── Resolve match data ────────────────────────────────────────────────────
  const wcMatch   = isWC ? getMatch(matchSlug) : null;
  let clubFixture: Fixture | null = null;

  if (!isWC) {
    clubFixture = getFixtures(league).find((f) => f.slug === matchSlug) ?? null;
    if (!clubFixture) notFound();
  } else if (!wcMatch) {
    notFound();
  }

  // ── Unified team identity ─────────────────────────────────────────────────
  const homeId    = isWC ? (wcMatch!.team_a as unknown as { api_id?: number }).api_id ?? 0 : clubFixture!.home_team.id;
  const awayId    = isWC ? (wcMatch!.team_b as unknown as { api_id?: number }).api_id ?? 0 : clubFixture!.away_team.id;
  const homeName  = isWC ? wcMatch!.team_a.name  : clubFixture!.home_team.name;
  const awayName  = isWC ? wcMatch!.team_b.name  : clubFixture!.away_team.name;
  const homeLogo  = isWC ? `https://flagcdn.com/w160/${wcMatch!.team_a.code}.png` : clubFixture!.home_team.logo;
  const awayLogo  = isWC ? `https://flagcdn.com/w160/${wcMatch!.team_b.code}.png` : clubFixture!.away_team.logo;
  const homeSlug  = isWC ? wcMatch!.team_a.slug  : clubFixture!.home_team.slug;
  const awaySlug  = isWC ? wcMatch!.team_b.slug  : clubFixture!.away_team.slug;
  const matchDate = isWC ? wcMatch!.date          : clubFixture!.date;
  const kickoffUtc = isWC ? wcMatch!.kickoff_utc  : clubFixture!.kickoff_utc;
  const fixtureStatus = isWC ? "NS" : clubFixture!.status;
  const fixtureId     = isWC ? null : clubFixture!.fixture_id;

  // ── Status flags ──────────────────────────────────────────────────────────
  const finished = isFinished(fixtureStatus);
  const live     = isLive(fixtureStatus);
  const upcoming = isUpcoming(fixtureStatus) || isWC;

  // ── Match events (club/live only) ─────────────────────────────────────────
  const matchEvents  = fixtureId ? getMatchEvents(fixtureId) : null;
  const events       = matchEvents?.events ?? [];
  const clubScore    = matchEvents?.score ?? clubFixture?.score ?? { home: null, away: null };
  const homeStats    = matchEvents?.home_stats ?? null;
  const awayStats    = matchEvents?.away_stats ?? null;
  const goalEvents   = events.filter((e) => e.type === "Goal");
  const homeGoals    = goalEvents.filter((e) => e.team_id === clubFixture?.home_team.id);
  const awayGoals    = goalEvents.filter((e) => e.team_id === clubFixture?.away_team.id);

  // ── Team form ─────────────────────────────────────────────────────────────
  const wcTeamA    = isWC ? getTeam(homeSlug) : null;
  const wcTeamB    = isWC ? getTeam(awaySlug) : null;
  const homeTeamStats = !isWC ? getTeamStats(homeSlug).find((s) => s.league_slug === params.slug) : null;
  const awayTeamStats = !isWC ? getTeamStats(awaySlug).find((s) => s.league_slug === params.slug) : null;
  const homeForm   = isWC ? (wcTeamA?.form ?? []).join("") : (homeTeamStats?.form ?? "");
  const awayForm   = isWC ? (wcTeamB?.form ?? []).join("") : (awayTeamStats?.form ?? "");

  // ── H2H ──────────────────────────────────────────────────────────────────
  const wcH2H   = isWC ? wcMatch!.h2h : null;
  const clubH2H = !isWC && homeId && awayId ? getH2HForTeams(homeId, awayId) : null;

  // ── Squads ────────────────────────────────────────────────────────────────
  const wcSquadA      = isWC ? getTeamPlayers(homeSlug) : [];
  const wcSquadB      = isWC ? getTeamPlayers(awaySlug) : [];
  const clubSquadHome = !isWC ? getClubSquad(homeSlug) : null;
  const clubSquadAway = !isWC ? getClubSquad(awaySlug) : null;

  // ── Injuries ──────────────────────────────────────────────────────────────
  const homeInjuries = !isWC ? getUniqueTeamInjuries(params.slug, homeSlug) : [];
  const awayInjuries = !isWC ? getUniqueTeamInjuries(params.slug, awaySlug) : [];

  // ── Predictions & Odds (club — from API sync) ──────────────────────────────
  const prediction = !isWC && fixtureId ? getPrediction(fixtureId) : null;
  const oddsData   = !isWC && fixtureId ? getMatchOdds(fixtureId)  : null;

  // ── Venue ─────────────────────────────────────────────────────────────────
  const stadium     = isWC ? getStadium(wcMatch!.stadium_slug) : null;
  const homeClubTeam = !isWC ? getClubTeam(homeSlug) : null;

  // ── WC extras ─────────────────────────────────────────────────────────────
  const colorA = wcTeamA?.color_primary ?? "#00e87a";
  const colorB = wcTeamB?.color_primary ?? "#3b82f6";

  // ── Related matches ───────────────────────────────────────────────────────
  const relatedMatches: Array<{ label: string; href: string; meta: string }> = isWC
    ? matches
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
        }))
    : getFixtures(league)
        .filter((f) => f.slug !== matchSlug && (f.status === "NS" || isFinished(f.status)))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5)
        .map((f) => ({
          label: `${f.home_team.name} vs ${f.away_team.name}`,
          href:  `/leagues/${league.slug}/matches/${f.slug}`,
          meta:  new Date(f.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        }));

  // ── Auto FAQ (club) ───────────────────────────────────────────────────────
  const clubFaq: Array<{ q: string; a: string }> = !isWC ? [
    {
      q: `When does ${homeName} vs ${awayName} kick off?`,
      a: `${homeName} vs ${awayName} is scheduled for ${new Date(matchDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} at ${kickoffUtc} UTC.`,
    },
    ...(homeClubTeam?.venue?.name ? [{
      q: `Where is ${homeName} vs ${awayName} being played?`,
      a: `The match will be played at ${homeClubTeam.venue.name}${homeClubTeam.venue.city ? `, ${homeClubTeam.venue.city}` : ""}${homeClubTeam.venue.capacity ? ` (capacity ${homeClubTeam.venue.capacity.toLocaleString()})` : ""}.`,
    }] : []),
    ...(clubH2H && clubH2H.played > 0 ? [{
      q: `What is the head-to-head record between ${homeName} and ${awayName}?`,
      a: `In their last ${clubH2H.played} meetings, ${homeName} won ${clubH2H.homeWins} times, ${awayName} won ${clubH2H.awayWins} times, and ${clubH2H.draws} matches ended in a draw.`,
    }] : []),
    ...(homeForm || awayForm ? [{
      q: `What is the current form of ${homeName} and ${awayName}?`,
      a: `${homeName}'s last 5 results: ${homeForm.slice(-5) || "N/A"}. ${awayName}'s last 5 results: ${awayForm.slice(-5) || "N/A"}.`,
    }] : []),
  ] : [];

  // ── JSON-LD ───────────────────────────────────────────────────────────────
  const breadcrumbJsonLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",    item: "https://footbrowse.com" },
      { "@type": "ListItem", position: 2, name: "Leagues", item: "https://footbrowse.com/leagues" },
      { "@type": "ListItem", position: 3, name: league.name, item: `https://footbrowse.com/leagues/${league.slug}` },
      { "@type": "ListItem", position: 4, name: "Fixtures", item: `https://footbrowse.com/leagues/${league.slug}/matches` },
      { "@type": "ListItem", position: 5, name: `${homeName} vs ${awayName}`,
        item: `https://footbrowse.com/leagues/${league.slug}/matches/${matchSlug}` },
    ],
  };

  const faqItems = isWC ? (wcMatch!.content.faq ?? []) : clubFaq;
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }} />

      <article className="space-y-8">

        {/* ── Breadcrumb ── */}
        <nav className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumb-sep">›</span>
          <Link href="/leagues">Leagues</Link>
          <span className="breadcrumb-sep">›</span>
          <Link href={`/leagues/${league.slug}`}>{league.name}</Link>
          <span className="breadcrumb-sep">›</span>
          <Link href={`/leagues/${league.slug}/matches`}>Fixtures</Link>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">{homeName} vs {awayName}</span>
        </nav>

        {/* ── Hero Header ── */}
        <header className="page-header">
          <div className="flex items-center gap-2 mb-5">
            <Image src={league.logo} alt={league.name} width={18} height={18} className="object-contain rounded-sm" unoptimized />
            <span className="badge-blue">{league.name}</span>
            {isWC && wcMatch!.group && <span className="badge-green">Group {wcMatch!.group}</span>}
            {!isWC && clubFixture!.stage && clubFixture!.stage !== "Regular Season" && (
              <span className="tag text-xs">{clubFixture!.stage}</span>
            )}
            {finished ? (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: "#71717A", backgroundColor: "rgba(255,255,255,0.06)" }}>
                {statusLabel(fixtureStatus)}
              </span>
            ) : live ? (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: "#EF4444", backgroundColor: "rgba(239,68,68,0.1)" }}>
                {statusLabel(fixtureStatus)}
              </span>
            ) : (
              <span className="badge-green">Upcoming</span>
            )}
          </div>

          {/* Teams + score/VS */}
          <div className="flex items-center justify-between gap-4">
            {/* Home */}
            <div className="flex-1 text-center">
              <Link href={`/leagues/${league.slug}/teams/${homeSlug}`}>
                {isWC ? (
                  <Image src={homeLogo} alt={homeName} width={160} height={107} priority
                    className="mx-auto rounded shadow-lg object-cover" style={{ height: 72, width: "auto" }} />
                ) : (
                  <Image src={homeLogo} alt={homeName} width={72} height={72} priority unoptimized
                    className="mx-auto object-contain" style={{ height: 64, width: "auto" }} />
                )}
                <p className="mt-3 text-xl sm:text-2xl font-black text-white hover:opacity-70 transition-opacity"
                  style={{ letterSpacing: "-0.03em" }}>
                  {homeName}
                </p>
              </Link>
              {isWC && <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">FIFA #{wcMatch!.team_a.fifa_rank}</p>}
              {homeTeamStats && (
                <p className="text-xs text-zinc-500 mt-1">
                  {homeTeamStats.wins}W {homeTeamStats.draws}D {homeTeamStats.losses}L
                </p>
              )}
            </div>

            {/* Score / VS */}
            <div className="text-center px-2 sm:px-6 shrink-0">
              {finished || live ? (
                <div>
                  <p className="text-4xl sm:text-5xl font-black text-white tabular-nums" style={{ letterSpacing: "-0.05em" }}>
                    {clubScore.home ?? 0}<span className="mx-2 text-zinc-600">–</span>{clubScore.away ?? 0}
                  </p>
                  <p className="text-xs font-bold mt-1 uppercase tracking-widest" style={{ color: live ? "#EF4444" : "#00FF87" }}>
                    {statusLabel(fixtureStatus)}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-4xl sm:text-5xl font-black" style={{ color: "#00FF87", letterSpacing: "-0.04em" }}>VS</p>
                  <p className="text-xs text-zinc-600 mt-1 uppercase tracking-widest">{kickoffUtc} UTC</p>
                </div>
              )}
            </div>

            {/* Away */}
            <div className="flex-1 text-center">
              <Link href={`/leagues/${league.slug}/teams/${awaySlug}`}>
                {isWC ? (
                  <Image src={awayLogo} alt={awayName} width={160} height={107} priority
                    className="mx-auto rounded shadow-lg object-cover" style={{ height: 72, width: "auto" }} />
                ) : (
                  <Image src={awayLogo} alt={awayName} width={72} height={72} priority unoptimized
                    className="mx-auto object-contain" style={{ height: 64, width: "auto" }} />
                )}
                <p className="mt-3 text-xl sm:text-2xl font-black text-white hover:opacity-70 transition-opacity"
                  style={{ letterSpacing: "-0.03em" }}>
                  {awayName}
                </p>
              </Link>
              {isWC && <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">FIFA #{wcMatch!.team_b.fifa_rank}</p>}
              {awayTeamStats && (
                <p className="text-xs text-zinc-500 mt-1">
                  {awayTeamStats.wins}W {awayTeamStats.draws}D {awayTeamStats.losses}L
                </p>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-zinc-400"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.25rem" }}>
            <span>📅 {new Date(matchDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
            <span>🕐 {kickoffUtc} UTC{isWC ? ` · ${wcMatch!.kickoff_est} EST` : ""}</span>
            {isWC && <span>📍 {wcMatch!.city}</span>}
            {!isWC && clubFixture!.matchday && <span className="text-zinc-500">Matchday {clubFixture!.matchday}</span>}
            {isWC && stadium && (
              <Link href={`/stadiums/${stadium.slug}`} className="font-semibold hover:opacity-70" style={{ color: "#00FF87" }}>
                {stadium.name} →
              </Link>
            )}
            {!isWC && homeClubTeam?.venue?.name && (
              <span>📍 {homeClubTeam.venue.name}{homeClubTeam.venue.city ? `, ${homeClubTeam.venue.city}` : ""}</span>
            )}
          </div>
        </header>

        <AdSlot slot="1234567890" format="auto" />

        {/* ════════════════════════════════════════════════
            FINISHED / LIVE MODE
            ════════════════════════════════════════════════ */}
        {(finished || live) && (
          <>
            {/* Goal scorers */}
            {(homeGoals.length > 0 || awayGoals.length > 0) && (
              <section className="section-block">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">Goal Scorers</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    {homeGoals.map((e, i) => (
                      <p key={i} className="text-sm text-zinc-300 flex items-center gap-2">
                        <span>⚽</span>
                        <span className="font-semibold">{e.player}</span>
                        <span className="text-zinc-600 text-xs tabular-nums">{e.minute}{e.extra ? `+${e.extra}` : ""}&apos;</span>
                      </p>
                    ))}
                  </div>
                  <div className="space-y-1.5 text-right">
                    {awayGoals.map((e, i) => (
                      <p key={i} className="text-sm text-zinc-300 flex items-center justify-end gap-2">
                        <span className="text-zinc-600 text-xs tabular-nums">{e.minute}{e.extra ? `+${e.extra}` : ""}&apos;</span>
                        <span className="font-semibold">{e.player}</span>
                        <span>⚽</span>
                      </p>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Events timeline */}
            {events.length > 0 && (
              <section className="section-block">
                <h2 className="section-title text-xl mb-4">Match Events</h2>
                <div className="space-y-1">
                  {events.map((e, i) => {
                    const isHome = e.team_id === clubFixture?.home_team.id;
                    const icon =
                      e.type === "Goal"             ? "⚽" :
                      e.detail === "Yellow Card"     ? "🟨" :
                      e.detail === "Red Card"        ? "🟥" :
                      e.detail === "Yellow-Red Card" ? "🟥" :
                      e.type === "subst"             ? "🔄" : "•";
                    return (
                      <div key={i} className={`flex items-center gap-3 text-sm py-2 px-3 rounded-lg ${isHome ? "" : "flex-row-reverse"}`}
                        style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
                        <span className="text-zinc-500 tabular-nums text-xs w-8 shrink-0">
                          {e.minute}{e.extra ? `+${e.extra}` : ""}&apos;
                        </span>
                        <span className="shrink-0">{icon}</span>
                        <div className={`flex-1 ${isHome ? "" : "text-right"}`}>
                          <span className="font-semibold text-zinc-200">{e.player}</span>
                          {e.type === "subst" && e.assist && <span className="text-zinc-600 text-xs"> ↑ {e.assist}</span>}
                          {e.detail && e.type !== "subst" && e.type !== "Goal" && <span className="text-zinc-600 text-xs"> — {e.detail}</span>}
                        </div>
                        <span className="text-[10px] text-zinc-700 shrink-0">{isHome ? "H" : "A"}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Match statistics */}
            {homeStats && awayStats && (
              <section className="section-block">
                <h2 className="section-title text-xl mb-4">Match Statistics</h2>
                {homeStats.possession !== null && awayStats.possession !== null && (
                  <div className="mb-5">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-bold" style={{ color: "#00FF87" }}>{homeStats.possession}%</span>
                      <span className="text-zinc-500 uppercase tracking-widest text-[10px]">Possession</span>
                      <span className="font-bold" style={{ color: "#3B82F6" }}>{awayStats.possession}%</span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden">
                      <div style={{ width: `${homeStats.possession}%`, backgroundColor: "#00FF87", opacity: 0.8 }} />
                      <div style={{ flex: 1, backgroundColor: "#3B82F6", opacity: 0.8 }} />
                    </div>
                  </div>
                )}
                <StatBar home={homeStats.shots_on}     away={awayStats.shots_on}     label="Shots on Target" />
                <StatBar home={homeStats.shots_total}  away={awayStats.shots_total}  label="Total Shots" />
                <StatBar home={homeStats.corners}      away={awayStats.corners}      label="Corner Kicks" />
                <StatBar home={homeStats.fouls}        away={awayStats.fouls}        label="Fouls" />
                <StatBar home={homeStats.yellow_cards} away={awayStats.yellow_cards} label="Yellow Cards" />
                <StatBar home={homeStats.red_cards}    away={awayStats.red_cards}    label="Red Cards" />
              </section>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════
            PREVIEW MODE (upcoming) — ALL LEAGUES
            ════════════════════════════════════════════════ */}
        {upcoming && (
          <>
            {/* WC preview text */}
            {isWC && wcMatch!.content.preview && (
              <section className="section-block">
                <h2 className="section-title text-xl mb-4">Match Preview</h2>
                <p className="text-zinc-300 leading-relaxed text-sm">{wcMatch!.content.preview}</p>
              </section>
            )}

            {/* ── Form + Comparison ── */}
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="section-block !mb-0">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">Recent Form</h2>
                <div className="space-y-4">
                  {[
                    { name: homeName, logo: homeLogo, form: homeForm },
                    { name: awayName, logo: awayLogo, form: awayForm },
                  ].map(({ name, logo, form }) => (
                    <div key={name} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Image src={logo} alt={name} width={20} height={20}
                          className="rounded-sm object-cover shrink-0 opacity-90"
                          style={{ width: 20, height: isWC ? 14 : 20 }}
                          unoptimized={!isWC} />
                        <span className="font-bold text-zinc-300 text-[11px] uppercase tracking-wider truncate">{name}</span>
                      </div>
                      <FormPills form={form} max={5} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="section-block !mb-0">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">
                  {isWC ? "Team Comparison" : "Season Stats"}
                </h2>
                <div className="space-y-2">
                  {isWC ? (
                    <>
                      {[
                        { label: "FIFA Rank",   a: `#${wcMatch!.team_a.fifa_rank}`, b: `#${wcMatch!.team_b.fifa_rank}` },
                        { label: "Established", a: wcTeamA?.year_formed || "—",     b: wcTeamB?.year_formed || "—" },
                        { label: "WC Titles",   a: wcTeamA?.wc_titles ?? 0,          b: wcTeamB?.wc_titles ?? 0,
                          ca: (wcTeamA?.wc_titles ?? 0) > 0 ? "#00FF87" : undefined,
                          cb: (wcTeamB?.wc_titles ?? 0) > 0 ? "#00FF87" : undefined },
                      ].map(({ label, a, b, ca, cb }: { label: string; a: string | number; b: string | number; ca?: string; cb?: string }) => (
                        <div key={label} className="flex items-center justify-between text-xs py-1.5 border-b border-white/[0.04] last:border-0">
                          <span className="text-zinc-500">{label}</span>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-white" style={{ color: ca }}>{a}</span>
                            <span className="text-zinc-700">·</span>
                            <span className="font-bold text-white" style={{ color: cb }}>{b}</span>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : homeTeamStats && awayTeamStats ? (
                    <>
                      {[
                        { label: "Goals For",     a: homeTeamStats.goals_for,     b: awayTeamStats.goals_for },
                        { label: "Goals Against", a: homeTeamStats.goals_against, b: awayTeamStats.goals_against },
                        { label: "Clean Sheets",  a: homeTeamStats.clean_sheets,  b: awayTeamStats.clean_sheets },
                        { label: "Played",        a: homeTeamStats.played,        b: awayTeamStats.played },
                      ].map(({ label, a, b }) => (
                        <div key={label} className="flex items-center justify-between text-xs py-1.5 border-b border-white/[0.04] last:border-0">
                          <span className="text-zinc-500">{label}</span>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-white">{a}</span>
                            <span className="text-zinc-700">·</span>
                            <span className="font-bold text-white">{b}</span>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="text-xs text-zinc-600 italic">Stats not yet available.</p>
                  )}
                </div>
              </div>
            </section>

            {/* ── H2H — WC (handcrafted) ── */}
            {isWC && wcH2H && (
              <section className="section-block">
                <h2 className="section-title text-xl mb-1">Head-to-Head</h2>
                <p className="text-xs text-zinc-600 mb-4">{wcH2H.played} historical meetings</p>
                <div className="relative rounded-2xl overflow-hidden mb-3" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="absolute inset-0 pointer-events-none flex">
                    <div className="flex-1" style={{ background: `linear-gradient(to right, ${colorA}22 0%, transparent 75%)` }} />
                    <div className="flex-1" style={{ background: `linear-gradient(to left, ${colorB}22 0%, transparent 75%)` }} />
                  </div>
                  <div className="relative grid grid-cols-3 pt-6 pb-4 px-3">
                    {[
                      { flag: wcMatch!.team_a.flag_url, code: wcMatch!.team_a.code, wins: wcH2H.team_a_wins, color: colorA },
                      null,
                      { flag: wcMatch!.team_b.flag_url, code: wcMatch!.team_b.code, wins: wcH2H.team_b_wins, color: colorB },
                    ].map((item, idx) => item ? (
                      <div key={idx} className="flex flex-col items-center gap-2">
                        <MatchFlagImg src={item.flag} alt={item.code} width={28} />
                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">{item.code.toUpperCase()}</span>
                        <span className="text-6xl font-black tabular-nums leading-none text-white"
                          style={{ letterSpacing: "-0.05em", textShadow: `0 0 32px ${item.color}90` }}>
                          {item.wins}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">wins</span>
                      </div>
                    ) : (
                      <div key={idx} className="flex flex-col items-center gap-2">
                        <span style={{ height: 19 }} />
                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-700">—</span>
                        <span className="text-6xl font-black tabular-nums leading-none" style={{ letterSpacing: "-0.05em", color: "#52525b" }}>
                          {wcH2H.draws}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">draws</span>
                      </div>
                    ))}
                  </div>
                  {wcH2H.played > 0 && (() => {
                    const w1 = Math.round((wcH2H.team_a_wins / wcH2H.played) * 100);
                    const wx = Math.round((wcH2H.draws / wcH2H.played) * 100);
                    const w2 = 100 - w1 - wx;
                    return (
                      <>
                        <div className="flex h-1.5 gap-px">
                          <div style={{ width: `${w1}%`, background: `linear-gradient(to right, ${colorA}, ${colorA}bb)` }} />
                          <div style={{ width: `${wx}%`, backgroundColor: "#3f3f46" }} />
                          <div style={{ width: `${w2}%`, background: `linear-gradient(to left, ${colorB}, ${colorB}bb)` }} />
                        </div>
                        <div className="flex items-center justify-between px-4 py-2 text-[9px] font-bold">
                          <span style={{ color: colorA }}>{w1}%</span>
                          <span className="text-zinc-700">{wcH2H.played} played · {wx}% draws</span>
                          <span style={{ color: colorB }}>{w2}%</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="space-y-2">
                  <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-4"
                    style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <span className="text-xs text-zinc-500 shrink-0">Last meeting</span>
                    <span className="text-sm font-bold text-white text-right">{wcH2H.last_match}</span>
                  </div>
                  {wcH2H.last_wc_meeting && (
                    <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-4"
                      style={{ backgroundColor: "rgba(0,255,135,0.03)", border: "1px solid rgba(0,255,135,0.12)" }}>
                      <span className="text-xs text-zinc-500 shrink-0">Last WC meeting</span>
                      <span className="text-sm font-bold text-right" style={{ color: "#00FF87" }}>{wcH2H.last_wc_meeting}</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ── H2H — Club (API data) ── */}
            {!isWC && clubH2H && clubH2H.played > 0 && (
              <section className="section-block">
                <h2 className="section-title text-xl mb-1">Head-to-Head</h2>
                <p className="text-xs text-zinc-600 mb-4">Last {clubH2H.played} meetings</p>
                <div className="rounded-2xl overflow-hidden mb-4" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="grid grid-cols-3 pt-5 pb-4 px-3">
                    {[
                      { logo: homeLogo, name: homeName, wins: clubH2H.homeWins },
                      null,
                      { logo: awayLogo, name: awayName, wins: clubH2H.awayWins },
                    ].map((item, idx) => item ? (
                      <div key={idx} className="flex flex-col items-center gap-2">
                        <Image src={item.logo} alt={item.name} width={28} height={28} className="object-contain" unoptimized />
                        <span className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-500 text-center truncate max-w-[60px]">
                          {item.name.split(" ")[0]}
                        </span>
                        <span className="text-5xl font-black tabular-nums leading-none text-white" style={{ letterSpacing: "-0.04em" }}>
                          {item.wins}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">wins</span>
                      </div>
                    ) : (
                      <div key={idx} className="flex flex-col items-center gap-2 justify-center">
                        <span className="text-5xl font-black tabular-nums leading-none" style={{ color: "#52525b", letterSpacing: "-0.04em" }}>
                          {clubH2H.draws}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">draws</span>
                      </div>
                    ))}
                  </div>
                  {(() => {
                    const w1 = Math.round((clubH2H.homeWins / clubH2H.played) * 100);
                    const wx = Math.round((clubH2H.draws / clubH2H.played) * 100);
                    const w2 = 100 - w1 - wx;
                    return (
                      <div className="flex items-center justify-between px-4 py-2 text-[9px] font-bold border-t border-white/[0.04]">
                        <span style={{ color: "#00FF87" }}>{w1}%</span>
                        <span className="text-zinc-700">{clubH2H.played} played · {wx}% draws</span>
                        <span style={{ color: "#3B82F6" }}>{w2}%</span>
                      </div>
                    );
                  })()}
                </div>
                {clubH2H.lastMatches.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Recent Meetings</p>
                    {clubH2H.lastMatches.slice(0, 5).map((m) => {
                      const homeWon = (m.home_score ?? 0) > (m.away_score ?? 0);
                      const awayWon = (m.away_score ?? 0) > (m.home_score ?? 0);
                      return (
                        <div key={m.fixture_id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                          style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <span className="text-[10px] text-zinc-600 shrink-0 w-16 tabular-nums">
                            {new Date(m.date).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
                          </span>
                          <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                            <span className={`text-xs font-bold truncate text-right ${homeWon ? "text-white" : "text-zinc-500"}`}>{m.home_name}</span>
                            <Image src={m.home_logo} alt={m.home_name} width={16} height={16} className="object-contain shrink-0" unoptimized />
                          </div>
                          <span className="shrink-0 text-sm font-black tabular-nums text-white px-2" style={{ letterSpacing: "0.05em" }}>
                            {m.home_score ?? "?"} – {m.away_score ?? "?"}
                          </span>
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <Image src={m.away_logo} alt={m.away_name} width={16} height={16} className="object-contain shrink-0" unoptimized />
                            <span className={`text-xs font-bold truncate ${awayWon ? "text-white" : "text-zinc-500"}`}>{m.away_name}</span>
                          </div>
                          <span className="text-[9px] text-zinc-700 shrink-0 hidden sm:block truncate max-w-[80px] text-right">{m.league}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* ── Prediction — WC (handcrafted) ── */}
            {isWC && wcMatch!.content.prediction && (
              <section className="section-block">
                <h2 className="section-title text-xl mb-5">Our Prediction</h2>
                <div className="rounded-xl p-5 mb-4"
                  style={{ background: "linear-gradient(135deg, rgba(0,255,135,0.07) 0%, rgba(0,255,135,0.02) 100%)", border: "1px solid rgba(0,255,135,0.18)" }}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-1.5">Predicted Result</p>
                      <p className="text-3xl font-black" style={{ color: "#00FF87", letterSpacing: "-0.04em" }}>{wcMatch!.content.prediction}</p>
                    </div>
                    {wcMatch!.content.prediction_confidence && (
                      <div className="rounded-lg px-3 py-2 text-center shrink-0"
                        style={{ backgroundColor: "rgba(0,255,135,0.1)", border: "1px solid rgba(0,255,135,0.2)" }}>
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500 mb-0.5">Confidence</p>
                        <p className="text-sm font-black" style={{ color: "#00FF87" }}>{wcMatch!.content.prediction_confidence}</p>
                      </div>
                    )}
                  </div>
                  {wcMatch!.content.key_battle && (
                    <div style={{ borderTop: "1px solid rgba(0,255,135,0.1)", paddingTop: "1rem" }}>
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-600 mb-1.5">Key Battle</p>
                      <p className="text-sm font-semibold text-zinc-200 leading-relaxed">{wcMatch!.content.key_battle}</p>
                    </div>
                  )}
                </div>
                {wcMatch!.content.stats_to_watch?.length > 0 && (
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-600 mb-3">Stats to Watch</p>
                    <ul className="space-y-2">
                      {wcMatch!.content.stats_to_watch.map((stat, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-zinc-300 rounded-lg px-3 py-2.5"
                          style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <span className="shrink-0 text-xs font-black w-5 h-5 rounded flex items-center justify-center mt-0.5"
                            style={{ backgroundColor: "rgba(0,255,135,0.1)", color: "#00FF87", border: "1px solid rgba(0,255,135,0.2)" }}>
                            {i + 1}
                          </span>
                          {stat}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* ── Prediction — Club (API data) ── */}
            {!isWC && prediction && (
              <section className="section-block">
                <h2 className="section-title text-xl mb-5">Our Prediction</h2>
                <div className="rounded-xl p-5 mb-4"
                  style={{ background: "linear-gradient(135deg, rgba(0,255,135,0.07) 0%, rgba(0,255,135,0.02) 100%)", border: "1px solid rgba(0,255,135,0.18)" }}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-1.5">Predicted Winner</p>
                      <p className="text-2xl font-black" style={{ color: "#00FF87", letterSpacing: "-0.03em" }}>
                        {prediction.winner_name ?? "Draw"}
                      </p>
                      {prediction.winner_comment && (
                        <p className="text-xs text-zinc-500 mt-1">{prediction.winner_comment}</p>
                      )}
                    </div>
                    {(prediction.goals_home || prediction.goals_away) && (
                      <div className="rounded-lg px-3 py-2 text-center shrink-0"
                        style={{ backgroundColor: "rgba(0,255,135,0.1)", border: "1px solid rgba(0,255,135,0.2)" }}>
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500 mb-0.5">Goals</p>
                        <p className="text-sm font-black tabular-nums" style={{ color: "#00FF87" }}>
                          {prediction.goals_home ?? "?"} – {prediction.goals_away ?? "?"}
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Win probabilities bar */}
                  <div style={{ borderTop: "1px solid rgba(0,255,135,0.1)", paddingTop: "1rem" }}>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="font-bold text-white">{prediction.percent.home}</span>
                      <span className="text-zinc-600 text-[10px] uppercase tracking-widest">Win probability</span>
                      <span className="font-bold text-white">{prediction.percent.away}</span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden">
                      {(() => {
                        const h = parseInt(prediction.percent.home) || 33;
                        const d = parseInt(prediction.percent.draw) || 34;
                        return (
                          <>
                            <div style={{ width: `${h}%`, backgroundColor: "#00FF87", opacity: 0.7 }} />
                            <div style={{ width: `${d}%`, backgroundColor: "#52525b" }} />
                            <div style={{ flex: 1, backgroundColor: "#3B82F6", opacity: 0.7 }} />
                          </>
                        );
                      })()}
                    </div>
                    <div className="flex justify-between mt-1.5 text-[9px] tabular-nums text-zinc-600">
                      <span>{homeName.split(" ")[0]}</span>
                      <span>Draw {prediction.percent.draw}</span>
                      <span>{awayName.split(" ")[0]}</span>
                    </div>
                  </div>
                  {prediction.under_over && (
                    <div className="mt-3 flex items-center gap-2 text-xs"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.75rem" }}>
                      <span className="text-zinc-600">Over/Under</span>
                      <span className="font-bold text-white">{prediction.under_over}</span>
                    </div>
                  )}
                </div>
                <div className="rounded-lg px-4 py-3"
                  style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-600 mb-1">Advice</p>
                  <p className="text-sm text-zinc-300">{prediction.advice}</p>
                </div>
              </section>
            )}

            {/* ── Betting Odds — WC (handcrafted) ── */}
            {isWC && (wcMatch!.odds?.length ?? 0) > 0 && (() => {
              const BRAND: Record<string, { color: string; label: string; affiliateUrl?: string }> = {
                "William Hill": { color: "#1452c8", label: "1xBet", affiliateUrl: "https://reffpa.com/L?tag=d_5477761m_1599c_&site=5477761&ad=1599" },
              };
              const displayOdds = (wcMatch!.odds ?? []).filter((o) => Object.keys(BRAND).includes(o.bookmaker)).slice(0, 2);
              if (!displayOdds.length) return null;
              const GOLD = "#e8c45a";
              return (
                <section className="section-block">
                  <h2 className="section-title text-xl mb-4">Betting Odds</h2>
                  <div className="space-y-3">
                    {displayOdds.map((odd) => {
                      const brand = BRAND[odd.bookmaker];
                      const r1 = 1/odd.team_a_win, rX = 1/odd.draw, r2 = 1/odd.team_b_win;
                      const total = r1+rX+r2;
                      const p1 = Math.round((r1/total)*100), pX = Math.round((rX/total)*100), p2 = 100-p1-pX;
                      return (
                        <div key={odd.bookmaker} className="rounded-xl p-3"
                          style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <div className="flex justify-end mb-3">
                            <span className="text-xs font-black" style={{ color: brand.color }}>{brand.label}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {([{ k:"1", v:odd.team_a_win },{ k:"X", v:odd.draw },{ k:"2", v:odd.team_b_win }] as {k:string;v:number}[]).map(({k,v}) => (
                              <a key={k} href={brand.affiliateUrl ?? odd.affiliate_url} target="_blank" rel="noopener noreferrer nofollow"
                                className="flex flex-col items-center rounded-lg px-2 py-2.5 gap-1.5"
                                style={{ backgroundColor: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)" }}>
                                <span className="text-[10px] font-bold text-zinc-500">{k}</span>
                                <span className="text-base font-black tabular-nums leading-none" style={{ color: GOLD }}>{v.toFixed(2)}</span>
                              </a>
                            ))}
                          </div>
                          <div className="mt-3">
                            <div className="flex overflow-hidden h-px rounded-full mb-1.5" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                              <div style={{ width:`${p1}%`, backgroundColor: GOLD, opacity: 0.8 }} />
                              <div style={{ width:`${pX}%`, backgroundColor: "rgba(255,255,255,0.15)" }} />
                              <div style={{ width:`${p2}%`, backgroundColor: GOLD, opacity: 0.5 }} />
                            </div>
                            <div className="grid grid-cols-3 text-[9px] tabular-nums text-zinc-700">
                              <span className="text-center">{p1}%</span>
                              <span className="text-center">{pX}%</span>
                              <span className="text-center">{p2}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-zinc-700 pt-2">18+ · Gamble responsibly · Odds subject to change</p>
                </section>
              );
            })()}

            {/* ── Betting Odds — Club (API data) ── */}
            {!isWC && oddsData && (
              <section className="section-block">
                <h2 className="section-title text-xl mb-4">Betting Odds</h2>
                {(() => {
                  const GOLD = "#e8c45a";
                  const r1 = 1/oddsData.home_win, rX = 1/oddsData.draw, r2 = 1/oddsData.away_win;
                  const total = r1 + rX + r2;
                  const p1 = Math.round((r1/total)*100), pX = Math.round((rX/total)*100), p2 = 100-p1-pX;
                  const AFFILIATE_URL = "https://reffpa.com/L?tag=d_5477761m_1599c_&site=5477761&ad=1599";
                  return (
                    <div className="rounded-xl p-3"
                      style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="flex justify-end mb-3">
                        <span className="text-xs font-black" style={{ color: "#e8c45a" }}>{oddsData.bookmaker_name}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { k: "1", label: homeName.split(" ")[0], v: oddsData.home_win },
                          { k: "X", label: "Draw",                 v: oddsData.draw },
                          { k: "2", label: awayName.split(" ")[0], v: oddsData.away_win },
                        ]).map(({ k, label, v }) => (
                          <a key={k} href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer nofollow"
                            className="flex flex-col items-center rounded-lg px-2 py-2.5 gap-1"
                            style={{ backgroundColor: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <span className="text-[9px] font-bold text-zinc-600">{label}</span>
                            <span className="text-[10px] font-bold text-zinc-500">{k}</span>
                            <span className="text-base font-black tabular-nums leading-none" style={{ color: GOLD }}>{v.toFixed(2)}</span>
                          </a>
                        ))}
                      </div>
                      <div className="mt-3">
                        <div className="flex overflow-hidden h-px rounded-full mb-1.5" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                          <div style={{ width:`${p1}%`, backgroundColor: GOLD, opacity: 0.8 }} />
                          <div style={{ width:`${pX}%`, backgroundColor: "rgba(255,255,255,0.15)" }} />
                          <div style={{ width:`${p2}%`, backgroundColor: GOLD, opacity: 0.5 }} />
                        </div>
                        <div className="grid grid-cols-3 text-[9px] tabular-nums text-zinc-700">
                          <span className="text-center">{p1}%</span>
                          <span className="text-center">{pX}%</span>
                          <span className="text-center">{p2}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                <p className="text-[10px] text-zinc-700 pt-2">18+ · Gamble responsibly · Odds subject to change</p>
              </section>
            )}

            {/* ── Where to Watch — ALL leagues ── */}
            {(() => {
              const channels = isWC
                ? (wcMatch!.tv_channels ?? [])
                : (LEAGUE_BROADCASTS[params.slug] ?? []);
              if (!channels.length) return null;
              return (
                <section className="section-block">
                  <h2 className="section-title text-xl mb-4">Where to Watch</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {channels.map((entry) => (
                      <div key={entry.country} className="rounded-xl p-4"
                        style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#3b82f6" }} />
                          <span className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: "#3b82f6" }}>{entry.country}</span>
                        </div>
                        <ul className="space-y-1.5">
                          {entry.channels.map((ch) => (
                            <li key={ch} className="flex items-center gap-2 text-sm font-semibold text-white">
                              <span className="w-px h-3 bg-zinc-700 shrink-0" />{ch}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* ── Availability (injuries) — all leagues ── */}
            {(homeInjuries.length > 0 || awayInjuries.length > 0) && (
              <section className="section-block">
                <h2 className="section-title text-xl mb-5">Availability</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Image src={homeLogo} alt={homeName} width={16} height={16} className="object-contain" unoptimized={!isWC} />
                      <span className="text-xs font-bold text-zinc-400 truncate">{homeName}</span>
                    </div>
                    <InjuryList injuries={homeInjuries} compact />
                    {homeInjuries.length === 0 && <p className="text-xs text-zinc-600 italic">No reports</p>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Image src={awayLogo} alt={awayName} width={16} height={16} className="object-contain" unoptimized={!isWC} />
                      <span className="text-xs font-bold text-zinc-400 truncate">{awayName}</span>
                    </div>
                    <InjuryList injuries={awayInjuries} compact />
                    {awayInjuries.length === 0 && <p className="text-xs text-zinc-600 italic">No reports</p>}
                  </div>
                </div>
              </section>
            )}

            {/* ── Squad Preview — ALL leagues (same MatchSquads component) ── */}
            {(() => {
              const squadAPlayers = isWC ? wcSquadA : adaptClubSquad(clubSquadHome);
              const squadBPlayers = isWC ? wcSquadB : adaptClubSquad(clubSquadAway);
              if (squadAPlayers.length === 0 && squadBPlayers.length === 0) return null;
              const teamAInfo = isWC
                ? wcMatch!.team_a
                : { name: homeName, slug: homeSlug, code: "", logo: homeLogo, teamHrefPrefix: `/leagues/${league.slug}/teams/` };
              const teamBInfo = isWC
                ? wcMatch!.team_b
                : { name: awayName, slug: awaySlug, code: "", logo: awayLogo, teamHrefPrefix: `/leagues/${league.slug}/teams/` };
              return (
                <MatchSquads
                  teamA={teamAInfo}
                  teamB={teamBInfo}
                  squadA={squadAPlayers}
                  squadB={squadBPlayers}
                />
              );
            })()}

            {/* ── Venue — WC ── */}
            {isWC && stadium && (
              <section className="section-block !p-0 overflow-hidden">
                {stadium.photo_url && (
                  <div className="w-full h-40 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={stadium.photo_url} alt={stadium.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,10,0.85) 0%, transparent 60%)" }} />
                    {stadium.is_final_venue && <span className="badge-green absolute top-3 left-4">Final Venue</span>}
                    <h2 className="section-title text-xl absolute bottom-3 left-4">Venue</h2>
                  </div>
                )}
                <div className="p-4">
                  <Link href={`/stadiums/${stadium.slug}`} className="group flex items-start justify-between">
                    <div>
                      <p className="font-black text-white group-hover:opacity-70" style={{ letterSpacing: "-0.02em" }}>{stadium.name}</p>
                      <p className="text-sm text-zinc-400 mt-1">{stadium.city}, {stadium.state}</p>
                      <p className="text-sm text-zinc-500 mt-0.5">Cap. {stadium.capacity.toLocaleString()} · {stadium.surface} · {stadium.roof} roof</p>
                    </div>
                    <span className="arrow-link shrink-0 ml-4">Stadium guide →</span>
                  </Link>
                </div>
              </section>
            )}

            {/* ── Venue — Club ── */}
            {!isWC && homeClubTeam?.venue?.name && (
              <section className="section-block">
                <h2 className="section-title text-xl mb-4">Venue</h2>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
                    🏟️
                  </div>
                  <div>
                    <p className="font-black text-white" style={{ letterSpacing: "-0.02em" }}>{homeClubTeam.venue.name}</p>
                    {homeClubTeam.venue.city && (
                      <p className="text-sm text-zinc-400 mt-0.5">{homeClubTeam.venue.city}</p>
                    )}
                    {homeClubTeam.venue.capacity && (
                      <p className="text-sm text-zinc-500 mt-0.5">Capacity: {homeClubTeam.venue.capacity.toLocaleString()}</p>
                    )}
                    {homeClubTeam.founded && (
                      <p className="text-xs text-zinc-600 mt-2">
                        {homeName} — Est. {homeClubTeam.founded}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* ── Travel & Tickets — ALL leagues ── */}
            {(() => {
              const hasWcTravel = isWC && wcMatch!.travel;
              const venueCity = isWC ? wcMatch!.city : (homeClubTeam?.venue?.city ?? null);
              if (!hasWcTravel && !venueCity) return null;

              const hotelUrl = hasWcTravel
                ? wcMatch!.travel!.hotel_affiliate_url
                : `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(venueCity!)}`;
              const flightUrl = hasWcTravel
                ? wcMatch!.travel!.flight_affiliate_url
                : `https://www.skyscanner.com/flights-to/${encodeURIComponent(venueCity!.toLowerCase().replace(/\s/g, "-"))}`;
              const ticketUrl = "https://reffpa.com/L?tag=d_5477761m_1599c_&site=5477761&ad=1599";

              return (
                <>
                  <AdSlot slot="1234567890" format="auto" />
                  <section className="section-block">
                    <h2 className="section-title text-xl mb-4">Travel & Tickets</h2>
                    {hasWcTravel && wcMatch!.travel!.nearest_airport && (
                      <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3"
                        style={{ backgroundColor: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)" }}>
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                          style={{ backgroundColor: "rgba(59,130,246,0.12)" }}>✈️</span>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-0.5">Nearest airport</p>
                          <p className="text-sm font-bold text-white">{wcMatch!.travel!.nearest_airport}</p>
                        </div>
                      </div>
                    )}
                    {!hasWcTravel && venueCity && (
                      <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3"
                        style={{ backgroundColor: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)" }}>
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                          style={{ backgroundColor: "rgba(59,130,246,0.12)" }}>📍</span>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-0.5">Match City</p>
                          <p className="text-sm font-bold text-white">{venueCity}</p>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      <a href={hotelUrl} target="_blank" rel="noopener noreferrer nofollow"
                        className="flex flex-col items-center justify-center gap-1.5 rounded-xl px-3 py-4 text-sm font-bold hover:opacity-85"
                        style={{ backgroundColor: "#00FF87", color: "#0a0a0a" }}>
                        <span className="text-xl">🏨</span>
                        <span>Book Hotel</span>
                      </a>
                      <a href={flightUrl} target="_blank" rel="noopener noreferrer nofollow"
                        className="flex flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-4 text-sm font-bold text-zinc-300 hover:text-white transition-colors"
                        style={{ borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.03)" }}>
                        <span className="text-xl">✈️</span>
                        <span>Find Flights</span>
                      </a>
                      <a href={ticketUrl} target="_blank" rel="noopener noreferrer nofollow"
                        className="flex flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-4 text-sm font-bold text-zinc-300 hover:text-white transition-colors"
                        style={{ borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.03)" }}>
                        <span className="text-xl">🎟️</span>
                        <span>Get Tickets</span>
                      </a>
                    </div>
                  </section>
                </>
              );
            })()}

            {/* ── FAQ — ALL leagues ── */}
            {faqItems.length > 0 && (
              <section className="section-block">
                <h2 className="section-title text-xl mb-5">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {faqItems.map((item, i) => (
                    <div key={i} className="rounded-xl p-4"
                      style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <p className="font-bold text-white text-sm mb-2">{item.q}</p>
                      <p className="text-sm text-zinc-400 leading-relaxed">{item.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Related Matches — ALL leagues ── */}
            {relatedMatches.length > 0 && (
              <section>
                <h2 className="section-title text-xl mb-4">
                  {isWC ? "More World Cup Matches" : `More ${league.name} Fixtures`}
                </h2>
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                  {relatedMatches.map((m, i) => (
                    <Link key={i} href={m.href}
                      className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03] group"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span className="text-sm font-semibold text-zinc-300 group-hover:text-white truncate">{m.label}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] text-zinc-600">{m.meta}</span>
                        <span className="text-[10px] font-bold opacity-30 group-hover:opacity-100" style={{ color: "#00FF87" }}>→</span>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Link href={`/leagues/${league.slug}/matches`}
                    className="inline-block rounded-lg px-6 py-3 text-sm font-bold text-white hover:opacity-80"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    All {league.name} fixtures →
                  </Link>
                </div>
              </section>
            )}
          </>
        )}

        <AdSlot slot="1234567890" format="auto" />
      </article>
    </>
  );
}
