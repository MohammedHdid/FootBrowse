import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  teams,
  getTeam,
  getTeamPlayers,
  getTeamMatches,
  getStadium,
} from "@/lib/data";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return teams.map((t) => ({ slug: t.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const team = getTeam(params.slug);
  if (!team) return {};
  return {
    title: `${team.name} — World Cup 2026 Team Profile`,
    description: `${team.name} (${team.shortName}) — FIFA ranking #${team.fifaRanking}, ${team.worldCupTitles} World Cup title${team.worldCupTitles !== 1 ? "s" : ""}. Coach: ${team.coach}. Group ${team.group} at World Cup 2026.`,
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

export default function TeamPage({ params }: Props) {
  const team = getTeam(params.slug);
  if (!team) notFound();

  const players = getTeamPlayers(team.slug);
  const matches = getTeamMatches(team.slug);
  const homeStadium = getStadium(team.homeStadiumSlug);

  return (
    <article className="space-y-8">

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <Link href="/teams">Teams</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{team.name}</span>
      </nav>

      {/* Header */}
      <header className="page-header">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="badge-blue">{team.confederation}</span>
              <span className="badge-green">Group {team.group}</span>
            </div>
            <h1
              className="text-3xl sm:text-4xl font-black"
              style={{ letterSpacing: "-0.04em" }}
            >
              {FLAGS[team.slug]} {team.name}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">Coach: <span className="text-zinc-200 font-semibold">{team.coach}</span></p>
          </div>
          <span
            className="rounded-lg px-4 py-2 text-2xl font-black text-white"
            style={{ backgroundColor: "rgba(39,39,42,0.8)", letterSpacing: "-0.02em" }}
          >
            {team.shortName}
          </span>
        </div>
      </header>

      {/* AD SLOT */}
      {/* <!-- AD SLOT: team-page-top --> */}
      <div className="ad-slot">
        <span className="ad-slot-label">Advertisement</span>
        <span className="ad-slot-dims">728×90 — Leaderboard</span>
      </div>

      {/* Stats */}
      <section>
        <h2 className="section-title text-xl mb-4">Team Statistics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="stat-label">FIFA Ranking</p>
            <p className="stat-value">#{team.fifaRanking}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">World Cup Titles</p>
            <p className="stat-value" style={{ color: team.worldCupTitles > 0 ? "#00FF87" : "white" }}>
              {team.worldCupTitles}
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Founded</p>
            <p className="stat-value">{team.founded}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Group</p>
            <p className="stat-value" style={{ color: "#00FF87" }}>
              {team.group}
            </p>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="section-block">
        <h2 className="section-title text-xl mb-4">Team Overview</h2>
        <p className="text-zinc-300 leading-relaxed text-sm">{team.description}</p>
      </section>

      {/* Players */}
      {players.length > 0 && (
        <section>
          <h2 className="section-title text-xl mb-4">Key Players</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => (
              <Link key={player.slug} href={`/players/${player.slug}`} className="entity-card block">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-white" style={{ letterSpacing: "-0.02em" }}>
                    {player.name}
                  </span>
                  <span className="text-base font-black tabular-nums" style={{ color: "#00FF87" }}>
                    #{player.kitNumber}
                  </span>
                </div>
                <p className="text-sm text-zinc-400">{player.position}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{player.club} · {player.clubLeague}</p>
                <div className="mt-3 flex gap-4 text-xs text-zinc-600">
                  <span><span className="text-zinc-300 font-bold">{player.caps}</span> caps</span>
                  <span><span className="text-zinc-300 font-bold">{player.internationalGoals}</span> goals</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* AD SLOT */}
      {/* <!-- AD SLOT: team-page-mid --> */}
      <div className="ad-slot">
        <span className="ad-slot-label">Advertisement</span>
        <span className="ad-slot-dims">300×250 — Medium Rectangle</span>
      </div>

      {/* Fixtures */}
      {matches.length > 0 && (
        <section>
          <h2 className="section-title text-xl mb-4">Group Stage Fixtures</h2>
          <div className="space-y-3">
            {matches.map((match) => (
              <Link
                key={match.slug}
                href={`/matches/${match.slug}`}
                className="match-card flex items-center justify-between"
              >
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold mb-1">
                    {match.stage} · Group {match.group}
                  </p>
                  <p className="font-black text-white" style={{ letterSpacing: "-0.02em" }}>
                    {FLAGS[match.homeTeamSlug]} {match.homeTeamName} vs {FLAGS[match.awayTeamSlug]} {match.awayTeamName}
                  </p>
                  <p className="text-sm text-zinc-400 mt-0.5">
                    {new Date(match.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    · {match.stadiumName}
                  </p>
                </div>
                <span className="arrow-link shrink-0 ml-4">Preview →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Home Stadium */}
      {homeStadium && (
        <section className="section-block">
          <h2 className="section-title text-xl mb-4">Associated Venue</h2>
          <Link href={`/stadiums/${homeStadium.slug}`} className="group flex items-start justify-between">
            <div>
              <p className="font-black text-white group-hover:opacity-70 transition-opacity" style={{ letterSpacing: "-0.02em" }}>
                {homeStadium.name}
                {homeStadium.hostingFinal && (
                  <span className="badge-green ml-2 align-middle">Final Venue</span>
                )}
              </p>
              <p className="text-sm text-zinc-400 mt-1">{homeStadium.city}, {homeStadium.state}</p>
              <p className="text-sm text-zinc-500 mt-0.5">
                Cap. {homeStadium.capacity.toLocaleString()}
              </p>
            </div>
            <span className="arrow-link shrink-0 ml-4">Venue guide →</span>
          </Link>
        </section>
      )}

      {/* AD SLOT */}
      {/* <!-- AD SLOT: team-page-bottom --> */}
      <div className="ad-slot">
        <span className="ad-slot-label">Advertisement</span>
        <span className="ad-slot-dims">728×90 — Leaderboard</span>
      </div>
    </article>
  );
}
