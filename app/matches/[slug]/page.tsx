import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { matches, getMatch, getTeam, getStadium, getPlayer } from "@/lib/data";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return matches.map((m) => ({ slug: m.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const match = getMatch(params.slug);
  if (!match) return {};
  return {
    title: `${match.homeTeamName} vs ${match.awayTeamName} — World Cup 2026`,
    description: `${match.homeTeamName} vs ${match.awayTeamName} at ${match.stadiumName} on ${new Date(match.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. ${match.description.slice(0, 120)}…`,
  };
}

const FLAGS: Record<string, string> = {
  france: "🇫🇷",
  brazil: "🇧🇷",
  morocco: "🇲🇦",
  argentina: "🇦🇷",
  usa: "🇺🇸",
  spain: "🇪🇸",
};

export default function MatchPage({ params }: Props) {
  const match = getMatch(params.slug);
  if (!match) notFound();

  const homeTeam = getTeam(match.homeTeamSlug);
  const awayTeam = getTeam(match.awayTeamSlug);
  const stadium = getStadium(match.stadiumSlug);
  const featuredPlayers = match.featuredPlayers
    .map(getPlayer)
    .filter(Boolean);

  const h2h = match.headToHead;

  return (
    <article className="space-y-8">

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <Link href="/matches">Matches</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">
          {match.homeTeamShort} vs {match.awayTeamShort}
        </span>
      </nav>

      {/* Header */}
      <header className="page-header">
        <div className="flex items-center gap-2 mb-3">
          <span className="badge-blue">{match.stage}</span>
          <span className="badge-green">Group {match.group}</span>
          <span className="tag">Matchday {match.matchday}</span>
        </div>
        <h1
          className="text-3xl sm:text-4xl font-black"
          style={{ letterSpacing: "-0.04em" }}
        >
          {FLAGS[match.homeTeamSlug]} {match.homeTeamName}{" "}
          <span className="text-zinc-600">vs</span>{" "}
          {FLAGS[match.awayTeamSlug]} {match.awayTeamName}
        </h1>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-400">
          <span>
            📅{" "}
            {new Date(match.date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span>🕐 {match.kickoffTime} {match.timezone}</span>
          <span>📍 {match.city}</span>
        </div>
      </header>

      {/* AD SLOT */}
      {/* <!-- AD SLOT: match-page-top --> */}
      <div className="ad-slot">
        <span className="ad-slot-label">Advertisement</span>
        <span className="ad-slot-dims">728×90 — Leaderboard</span>
      </div>

      {/* Match Overview */}
      <section className="section-block">
        <h2 className="section-title text-xl mb-4">Match Overview</h2>
        <p className="text-zinc-300 leading-relaxed text-sm">{match.description}</p>
      </section>

      {/* Fixture / Scoreline */}
      <section className="section-block">
        <h2 className="section-title text-xl mb-6">Fixture Details</h2>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center">
            <Link
              href={`/teams/${match.homeTeamSlug}`}
              className="text-2xl font-black text-white hover:opacity-70 transition-opacity"
              style={{ letterSpacing: "-0.03em" }}
            >
              {FLAGS[match.homeTeamSlug]} {match.homeTeamName}
            </Link>
            <p className="text-xs text-zinc-600 mt-1 uppercase tracking-widest font-semibold">
              Home
            </p>
          </div>
          <div className="text-center">
            {match.status === "upcoming" ? (
              <div>
                <span className="text-4xl font-black text-zinc-700" style={{ letterSpacing: "-0.04em" }}>
                  — : —
                </span>
                <div className="mt-2">
                  <span className="status-pill">Upcoming</span>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-4xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>
                  {match.homeScore} – {match.awayScore}
                </span>
                <div className="mt-2">
                  <span className="badge-green">{match.status}</span>
                </div>
              </div>
            )}
          </div>
          <div className="text-center">
            <Link
              href={`/teams/${match.awayTeamSlug}`}
              className="text-2xl font-black text-white hover:opacity-70 transition-opacity"
              style={{ letterSpacing: "-0.03em" }}
            >
              {FLAGS[match.awayTeamSlug]} {match.awayTeamName}
            </Link>
            <p className="text-xs text-zinc-600 mt-1 uppercase tracking-widest font-semibold">
              Away
            </p>
          </div>
        </div>
      </section>

      {/* Head-to-Head */}
      <section className="section-block">
        <h2 className="section-title text-xl mb-4">Head-to-Head Record</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="stat-card text-center">
            <p className="stat-label">Played</p>
            <p className="stat-value">{h2h.played}</p>
          </div>
          <div className="stat-card text-center">
            <p className="stat-label">{match.homeTeamName} Wins</p>
            <p className="stat-value" style={{ color: "#00FF87" }}>
              {((h2h as unknown) as Record<string, unknown>)[
                `${match.homeTeamSlug.replace(/-/g, "")}Wins`
              ] as number ?? "—"}
            </p>
          </div>
          <div className="stat-card text-center">
            <p className="stat-label">Draws</p>
            <p className="stat-value text-zinc-400">{h2h.draws}</p>
          </div>
          <div className="stat-card text-center">
            <p className="stat-label">{match.awayTeamName} Wins</p>
            <p className="stat-value text-blue-400">
              {((h2h as unknown) as Record<string, unknown>)[
                `${match.awayTeamSlug.replace(/-/g, "")}Wins`
              ] as number ?? "—"}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-zinc-500">
          Last meeting:{" "}
          {new Date(h2h.lastMeeting).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}{" "}
          —{" "}
          <span className="text-zinc-200 font-bold">{h2h.lastResult}</span>
        </p>
      </section>

      {/* Key Matchups */}
      <section className="section-block">
        <h2 className="section-title text-xl mb-4">Key Matchups to Watch</h2>
        <ul className="space-y-3">
          {match.keyMatchups.map((matchup, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
              <span
                className="mt-0.5 text-xs font-black w-5 h-5 rounded flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "rgba(0,255,135,0.1)",
                  color: "#00FF87",
                  border: "1px solid rgba(0,255,135,0.2)",
                }}
              >
                {i + 1}
              </span>
              {matchup}
            </li>
          ))}
        </ul>
      </section>

      {/* AD SLOT */}
      {/* <!-- AD SLOT: match-page-mid --> */}
      <div className="ad-slot">
        <span className="ad-slot-label">Advertisement</span>
        <span className="ad-slot-dims">300×250 — Medium Rectangle</span>
      </div>

      {/* Featured Players */}
      {featuredPlayers.length > 0 && (
        <section>
          <h2 className="section-title text-xl mb-4">Featured Players</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {featuredPlayers.map((player) => {
              if (!player) return null;
              return (
                <Link
                  key={player.slug}
                  href={`/players/${player.slug}`}
                  className="entity-card block"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-white" style={{ letterSpacing: "-0.02em" }}>
                      {player.name}
                    </span>
                    <span className="text-lg font-black tabular-nums" style={{ color: "#00FF87" }}>
                      #{player.kitNumber}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">
                    {FLAGS[player.teamSlug]} {player.teamName} · {player.position}
                  </p>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {player.caps} caps · {player.internationalGoals} int&apos;l goals
                  </p>
                  <p className="mt-3 text-xs font-bold" style={{ color: "#00FF87" }}>
                    View full profile →
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Venue */}
      {stadium && (
        <section className="section-block">
          <h2 className="section-title text-xl mb-4">Venue</h2>
          <Link href={`/stadiums/${stadium.slug}`} className="group flex items-start justify-between">
            <div>
              <p className="font-black text-white group-hover:opacity-70 transition-opacity" style={{ letterSpacing: "-0.02em" }}>
                {stadium.name}
                {stadium.hostingFinal && (
                  <span className="badge-green ml-2 align-middle">Final</span>
                )}
              </p>
              <p className="text-sm text-zinc-400 mt-1">{stadium.city}, {stadium.state}</p>
              <p className="text-sm text-zinc-500 mt-0.5">
                Cap. {stadium.capacity.toLocaleString()} · {stadium.surface} · Opened {stadium.opened}
              </p>
            </div>
            <span className="arrow-link shrink-0 ml-4">Stadium guide →</span>
          </Link>
        </section>
      )}

      {/* Team Profiles */}
      <section>
        <h2 className="section-title text-xl mb-4">Team Profiles</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[homeTeam, awayTeam].map(
            (team) =>
              team && (
                <Link key={team.slug} href={`/teams/${team.slug}`} className="link-card">
                  {FLAGS[team.slug]} {team.name} — FIFA #{team.fifaRanking} ·{" "}
                  {team.worldCupTitles} title{team.worldCupTitles !== 1 ? "s" : ""}
                </Link>
              )
          )}
        </div>
      </section>

      {/* AD SLOT */}
      {/* <!-- AD SLOT: match-page-bottom --> */}
      <div className="ad-slot">
        <span className="ad-slot-label">Advertisement</span>
        <span className="ad-slot-dims">728×90 — Leaderboard</span>
      </div>
    </article>
  );
}
