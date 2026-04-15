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
import InjuryList from "@/components/InjuryList";
import AdSlot from "@/components/AdSlot";

interface Props {
  params: { slug: string; teamSlug: string };
}

const LEAGUE_TABS = [
  { label: "Overview",  href: (s: string) => `/leagues/${s}` },
  { label: "Fixtures",  href: (s: string) => `/leagues/${s}/matches` },
  { label: "Standings", href: (s: string) => `/leagues/${s}/standings` },
  { label: "Teams",     href: (s: string) => `/leagues/${s}/teams` },
  { label: "Players",   href: (s: string) => `/leagues/${s}/players` },
];

const FORM_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  W: { bg: "rgba(0,255,135,0.12)",  color: "#00FF87", border: "rgba(0,255,135,0.3)" },
  D: { bg: "rgba(234,179,8,0.12)",  color: "#EAB308", border: "rgba(234,179,8,0.3)" },
  L: { bg: "rgba(239,68,68,0.12)",  color: "#EF4444", border: "rgba(239,68,68,0.3)" },
};

const POS_COLORS: Record<string, { color: string; bg: string; border: string; label: string }> = {
  Goalkeeper: { color: "#EAB308", bg: "rgba(234,179,8,0.12)",  border: "rgba(234,179,8,0.3)",  label: "GK"  },
  Defender:   { color: "#3B82F6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", label: "DEF" },
  Midfielder: { color: "#22C55E", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.3)",  label: "MID" },
  Forward:    { color: "#EF4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)",  label: "FWD" },
};

function posStyle(pos: string) {
  return POS_COLORS[pos] ?? {
    color: "#6B7280", bg: "rgba(107,114,128,0.12)",
    border: "rgba(107,114,128,0.3)", label: pos.slice(0, 3).toUpperCase(),
  };
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
          <Link href="/leagues">Leagues</Link>
          <span className="breadcrumb-sep">›</span>
          <Link href={`/leagues/${league.slug}`}>{league.name}</Link>
          <span className="breadcrumb-sep">›</span>
          <Link href={`/leagues/${league.slug}/teams`}>Teams</Link>
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
                  className="rounded-2xl overflow-hidden flex items-center justify-center p-3 shrink-0"
                  style={{
                    width: 110, height: 110,
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Image
                    src={teamLogo}
                    alt={`${teamName} crest`}
                    width={88}
                    height={88}
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

        {/* League tab nav */}
        <div
          className="flex gap-1 overflow-x-auto pb-1 -mb-2"
          style={{ borderBottom: "1px solid rgba(39,39,42,0.7)" }}
        >
          {LEAGUE_TABS.map((tab) => (
            <Link
              key={tab.label}
              href={tab.href(league.slug)}
              className="shrink-0 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors rounded-t text-zinc-500 hover:text-zinc-300"
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <AdSlot slot="1234567890" format="auto" />

        {/* ── WC Tournament Stats ── */}
        {wcTeam && (
          <section>
            <h2 className="section-title text-xl mb-4">Tournament Profile</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="stat-card">
                <p className="stat-label">FIFA Ranking</p>
                <p className="stat-value">#{wcTeam.fifa_rank}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">World Cup Titles</p>
                <p className="stat-value" style={{ color: wcTeam.wc_titles > 0 ? "#00FF87" : "white" }}>
                  {wcTeam.wc_titles}
                </p>
              </div>
              <div className="stat-card">
                <p className="stat-label">WC Appearances</p>
                <p className="stat-value">{wcTeam.wc_appearances}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Group</p>
                <p className="stat-value" style={{ color: "#00FF87" }}>{wcTeam.group}</p>
              </div>
            </div>
            {wcTeam.best_result && (
              <div
                className="rounded-xl px-4 py-3 flex items-center gap-3"
                style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <span className="text-lg">🏆</span>
                <div>
                  <p className="text-xs text-zinc-600 uppercase tracking-widest font-semibold">Best World Cup Result</p>
                  <p className="text-sm font-bold text-white mt-0.5">{wcTeam.best_result}</p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── League Performance ── */}
        {stats && (
          <section>
            <h2 className="section-title text-xl mb-4">
              League Performance
              <span className="badge-blue ml-2 align-middle" style={{ fontSize: 11 }}>{stats.league_name}</span>
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
              {[
                { label: "Played", value: stats.played },
                { label: "Won",    value: stats.wins,   color: "#00FF87" },
                { label: "Drawn",  value: stats.draws,  color: "#EAB308" },
                { label: "Lost",   value: stats.losses, color: "#EF4444" },
                { label: "GF",     value: stats.goals_for },
                { label: "GA",     value: stats.goals_against },
              ].map(({ label, value, color }) => (
                <div key={label} className="stat-card text-center">
                  <p className="stat-label">{label}</p>
                  <p className="text-2xl font-black tabular-nums" style={{ color: color ?? "#fff" }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Clean sheets / failed to score */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ backgroundColor: "rgba(0,255,135,0.04)", border: "1px solid rgba(0,255,135,0.12)" }}
              >
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Clean Sheets</span>
                <span className="text-xl font-black" style={{ color: "#00FF87" }}>{stats.clean_sheets}</span>
              </div>
              <div
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Failed to Score</span>
                <span className="text-xl font-black text-white">{stats.failed_to_score}</span>
              </div>
            </div>

            {/* Form */}
            {formChars.length > 0 && (
              <div className="section-block">
                <p className="stat-label mb-2">Form (last {formChars.length})</p>
                <div className="flex gap-1.5 flex-wrap">
                  {formChars.map((r, i) => {
                    const s = FORM_STYLE[r] ?? FORM_STYLE["D"];
                    return (
                      <span
                        key={i}
                        className="w-7 h-7 flex items-center justify-center rounded text-xs font-black"
                        style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}
                      >
                        {r}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Form from WC team data when no stats object */}
        {!stats && isWC && wcTeam && wcTeam.form.length > 0 && (
          <section className="section-block">
            <p className="stat-label mb-2">Recent Form</p>
            <div className="flex gap-1.5 flex-wrap">
              {wcTeam.form.map((r, i) => {
                const s = FORM_STYLE[r] ?? FORM_STYLE["D"];
                return (
                  <span
                    key={i}
                    className="w-7 h-7 flex items-center justify-center rounded text-xs font-black"
                    style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}
                  >
                    {r}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Manager ── */}
        {coachName && coachName !== "Unknown" && (
          <section className="section-block">
            <h2 className="section-title text-xl mb-4">Manager</h2>
            <div className="flex items-start gap-4">
              {coachPhoto && (
                <div
                  className="shrink-0 rounded-xl overflow-hidden"
                  style={{ width: 72, height: 72, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <Image
                    src={coachPhoto}
                    alt={coachName}
                    width={72}
                    height={72}
                    className="w-full h-full object-cover object-top"
                    unoptimized
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-black text-white" style={{ letterSpacing: "-0.02em" }}>{coachName}</p>
                {coachNat && <p className="text-sm text-zinc-400 mt-0.5">{coachNat}</p>}
                {coachAge && <p className="text-xs text-zinc-600 mt-0.5">Age {coachAge}</p>}

                {/* Career history */}
                {coachCareer.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-2">Previous Clubs</p>
                    <div className="flex flex-wrap gap-2">
                      {coachCareer.slice(0, 6).map((c, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 text-xs text-zinc-400 px-2 py-1 rounded-lg"
                          style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                        >
                          {c.team_logo && (
                            <Image src={c.team_logo} alt={c.team_name} width={14} height={14} className="object-contain" unoptimized />
                          )}
                          <span>{c.team_name}</span>
                          {c.start && (
                            <span className="text-zinc-600">
                              {new Date(c.start).getFullYear()}
                              {c.end ? `–${new Date(c.end).getFullYear()}` : "–"}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Injury Report ── */}
        {injuries.length > 0 && (
          <section className="section-block">
            <h2 className="section-title text-xl mb-4">
              Injury Report
              <span
                className="ml-2 align-middle text-[10px] font-black px-1.5 py-0.5 rounded"
                style={{ color: "#EF4444", backgroundColor: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                {injuries.length}
              </span>
            </h2>
            <InjuryList injuries={injuries} />
          </section>
        )}

        {/* ── Venue ── */}
        {venue?.name && (
          <section className="section-block">
            <h2 className="section-title text-xl mb-4">Stadium</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              {venue.image && (
                <div className="shrink-0 rounded-xl overflow-hidden" style={{ width: "100%", maxWidth: 280 }}>
                  <Image
                    src={venue.image}
                    alt={venue.name}
                    width={280}
                    height={160}
                    className="w-full object-cover"
                    style={{ aspectRatio: "16/9" }}
                    unoptimized
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-black text-white" style={{ letterSpacing: "-0.02em" }}>{venue.name}</p>
                {venue.city && <p className="text-sm text-zinc-400 mt-1">{venue.city}</p>}
                {venue.capacity && (
                  <p className="text-xs text-zinc-500 mt-1">
                    Capacity: <span className="font-bold text-zinc-300">{venue.capacity.toLocaleString()}</span>
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Next Fixtures ── */}
        {upcoming.length > 0 && (
          <section>
            <h2 className="section-title text-xl mb-4">Next Fixtures</h2>
            <div className="space-y-2">
              {upcoming.map((f) => {
                const isHome = f.home_team.slug === params.teamSlug;
                const opp    = isHome ? f.away_team : f.home_team;
                return (
                  <Link
                    key={f.fixture_id}
                    href={`/leagues/${params.slug}/matches/${f.slug}`}
                    className="entity-card flex items-center gap-3 group"
                  >
                    <span className="text-xs text-zinc-500 w-16 shrink-0">{fmtDate(f.date)}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 shrink-0">
                      {isHome ? "H" : "A"}
                    </span>
                    <Image src={opp.logo} alt={opp.name} width={20} height={20} className="object-contain shrink-0" unoptimized />
                    <span className="font-semibold text-sm text-zinc-200 truncate">{opp.name}</span>
                    <span className="ml-auto text-xs text-zinc-600 shrink-0 group-hover:text-zinc-400 transition-colors">
                      {f.stage} →
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Recent Results ── */}
        {results.length > 0 && (
          <section>
            <h2 className="section-title text-xl mb-4">Recent Results</h2>
            <div className="space-y-2">
              {results.map((f) => {
                const isHome  = f.home_team.slug === params.teamSlug;
                const opp     = isHome ? f.away_team : f.home_team;
                const myG     = isHome ? f.score.home : f.score.away;
                const oppG    = isHome ? f.score.away : f.score.home;
                const outcome =
                  myG === null || oppG === null ? "—" :
                  myG > oppG ? "W" : myG < oppG ? "L" : "D";
                const outcomeColor =
                  outcome === "W" ? "#00FF87" :
                  outcome === "L" ? "#EF4444" : "#EAB308";
                return (
                  <Link
                    key={f.fixture_id}
                    href={`/leagues/${params.slug}/matches/${f.slug}`}
                    className="entity-card flex items-center gap-3 group"
                  >
                    <span className="text-xs text-zinc-500 w-16 shrink-0">{fmtDate(f.date)}</span>
                    <span
                      className="text-[10px] font-black px-1.5 py-0.5 rounded shrink-0"
                      style={{ color: outcomeColor, backgroundColor: `${outcomeColor}15`, border: `1px solid ${outcomeColor}30` }}
                    >
                      {outcome}
                    </span>
                    <Image src={opp.logo} alt={opp.name} width={20} height={20} className="object-contain shrink-0" unoptimized />
                    <span className="font-semibold text-sm text-zinc-200 truncate">{opp.name}</span>
                    <span className="ml-auto text-xs font-bold tabular-nums text-white shrink-0">
                      {isHome
                        ? `${myG ?? "—"} – ${oppG ?? "—"}`
                        : `${oppG ?? "—"} – ${myG ?? "—"}`}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <AdSlot slot="1234567890" format="auto" />

        {/* ── Squad ── */}
        {positionGroups.length > 0 && (
          <section>
            <h2 className="section-title text-xl mb-4">
              Squad{totalPlayers > 0 && ` — ${totalPlayers} Players`}
            </h2>
            <div className="space-y-6">
              {positionGroups.map(({ position, players }) => {
                const ps = posStyle(position);
                return (
                  <div key={position}>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="text-xs font-black px-2 py-0.5 rounded"
                        style={{ backgroundColor: ps.bg, color: ps.color, border: `1px solid ${ps.border}` }}
                      >
                        {ps.label}
                      </span>
                      <span className="text-xs text-zinc-600 font-bold uppercase tracking-widest">{position}s</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {(players as (ClubPlayer & { slug?: string })[]).map((p) => {
                        const playerHref = p.slug ? `/players/${p.slug}` : null;
                        const card = (
                          <div className="entity-card flex items-center gap-3 h-full">
                            {/* Photo / number fallback */}
                            <div
                              className="shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
                              style={{ width: 40, height: 48, backgroundColor: ps.bg, border: `1px solid ${ps.border}` }}
                            >
                              {p.photo ? (
                                <Image
                                  src={p.photo}
                                  alt={p.name}
                                  width={40}
                                  height={48}
                                  className="w-full h-full object-cover object-top"
                                  unoptimized
                                />
                              ) : (
                                <span className="text-sm font-black tabular-nums" style={{ color: ps.color }}>
                                  {p.number ?? "?"}
                                </span>
                              )}
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-xs font-bold text-white truncate"
                                style={{ letterSpacing: "-0.01em" }}
                              >
                                {p.name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {p.number && (
                                  <span className="text-[10px] text-zinc-600 tabular-nums">#{p.number}</span>
                                )}
                                {p.age > 0 && (
                                  <span className="text-[10px] text-zinc-600">{p.age}y</span>
                                )}
                              </div>
                            </div>
                            {playerHref && (
                              <span className="text-[10px] font-bold shrink-0 opacity-30 group-hover:opacity-100 transition-opacity" style={{ color: "#00FF87" }}>→</span>
                            )}
                          </div>
                        );
                        return playerHref ? (
                          <Link key={p.id} href={playerHref} className="group">
                            {card}
                          </Link>
                        ) : (
                          <div key={p.id}>{card}</div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {positionGroups.length === 0 && (
          <div className="section-block text-center py-8">
            <p className="text-zinc-500 text-sm">Squad data not available yet.</p>
          </div>
        )}

        {/* Back to league */}
        <div className="section-block">
          <Link href={`/leagues/${league.slug}/teams`} className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">
            ← All {league.name} Teams
          </Link>
        </div>

        <AdSlot slot="1234567890" format="auto" />
      </div>
    </>
  );
}
