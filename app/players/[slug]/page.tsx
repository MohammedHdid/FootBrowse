import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { players, getPlayer, getTeam, getStadium, getTeamMatches } from "@/lib/data";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return players.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const player = getPlayer(params.slug);
  if (!player) return {};
  return {
    title: `${player.name} — World Cup 2026 Player Profile`,
    description: `${player.name} stats: ${player.caps} caps, ${player.internationalGoals} international goals, ${player.worldCupGoals} World Cup goals. ${player.position} for ${player.teamName} at World Cup 2026.`,
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

export default function PlayerPage({ params }: Props) {
  const player = getPlayer(params.slug);
  if (!player) notFound();

  const team = getTeam(player.teamSlug);
  const stadium = getStadium(player.stadiumSlug);
  const teamMatches = getTeamMatches(player.teamSlug);

  return (
    <article className="space-y-8">

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <Link href="/players">Players</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{player.name}</span>
      </nav>

      {/* Header */}
      <header className="page-header">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="badge-blue">{player.position}</span>
              <span className="badge-green">{player.nationality}</span>
            </div>
            <h1
              className="text-3xl sm:text-4xl font-black"
              style={{ letterSpacing: "-0.04em" }}
            >
              {player.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
              <Link
                href={`/teams/${player.teamSlug}`}
                className="font-semibold text-zinc-200 hover:opacity-70 transition-opacity"
              >
                {FLAGS[player.teamSlug]} {player.teamName}
              </Link>
              <span className="text-zinc-700">·</span>
              <span>{player.club}</span>
              <span className="text-zinc-700">·</span>
              <span>{player.clubLeague}</span>
            </div>
          </div>
          <span
            className="rounded-lg px-4 py-2 text-3xl font-black tabular-nums"
            style={{
              backgroundColor: "rgba(0,255,135,0.08)",
              border: "1px solid rgba(0,255,135,0.2)",
              color: "#00FF87",
              letterSpacing: "-0.02em",
            }}
          >
            #{player.kitNumber}
          </span>
        </div>
      </header>

      {/* AD SLOT */}
      {/* <!-- AD SLOT: player-page-top --> */}
      <div className="ad-slot">
        <span className="ad-slot-label">Advertisement</span>
        <span className="ad-slot-dims">728×90 — Leaderboard</span>
      </div>

      {/* International Stats */}
      <section>
        <h2 className="section-title text-xl mb-4">International Statistics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="stat-label">Caps</p>
            <p className="stat-value">{player.caps}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Int&apos;l Goals</p>
            <p className="stat-value">{player.internationalGoals}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">WC Goals</p>
            <p className="stat-value" style={{ color: "#00FF87" }}>
              {player.worldCupGoals}
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Market Value</p>
            <p className="stat-value text-base text-blue-400">{player.marketValue}</p>
          </div>
        </div>
      </section>

      {/* Player Details */}
      <section className="section-block">
        <h2 className="section-title text-xl mb-4">Player Details</h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5">
          <div>
            <dt className="stat-label">Date of Birth</dt>
            <dd className="text-sm font-semibold text-white mt-1">
              {new Date(player.dateOfBirth).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </dd>
          </div>
          <div>
            <dt className="stat-label">Age</dt>
            <dd className="text-sm font-semibold text-white mt-1">{player.age}</dd>
          </div>
          <div>
            <dt className="stat-label">Height</dt>
            <dd className="text-sm font-semibold text-white mt-1">{player.height}</dd>
          </div>
          <div>
            <dt className="stat-label">Preferred Foot</dt>
            <dd className="text-sm font-semibold text-white mt-1">{player.preferredFoot}</dd>
          </div>
          <div>
            <dt className="stat-label">Club</dt>
            <dd className="text-sm font-semibold text-white mt-1">{player.club}</dd>
          </div>
          <div>
            <dt className="stat-label">League</dt>
            <dd className="text-sm font-semibold text-white mt-1">{player.clubLeague}</dd>
          </div>
        </dl>
      </section>

      {/* Player Bio */}
      <section className="section-block">
        <h2 className="section-title text-xl mb-4">Player Profile</h2>
        <p className="text-zinc-300 leading-relaxed text-sm">{player.description}</p>
      </section>

      {/* Strengths */}
      <section className="section-block">
        <h2 className="section-title text-xl mb-4">Key Strengths</h2>
        <div className="flex flex-wrap gap-2">
          {player.strengths.map((strength) => (
            <span
              key={strength}
              className="rounded-full px-3 py-1 text-sm font-bold"
              style={{
                backgroundColor: "rgba(0,255,135,0.07)",
                border: "1px solid rgba(0,255,135,0.2)",
                color: "#00FF87",
              }}
            >
              {strength}
            </span>
          ))}
        </div>
      </section>

      {/* AD SLOT */}
      {/* <!-- AD SLOT: player-page-mid --> */}
      <div className="ad-slot">
        <span className="ad-slot-label">Advertisement</span>
        <span className="ad-slot-dims">300×250 — Medium Rectangle</span>
      </div>

      {/* Team Fixtures */}
      {teamMatches.length > 0 && (
        <section>
          <h2 className="section-title text-xl mb-4">
            {FLAGS[player.teamSlug]} {player.teamName} Fixtures at World Cup 2026
          </h2>
          <div className="space-y-3">
            {teamMatches.map((match) => (
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

      {/* Team & Venue */}
      <div className="grid gap-4 sm:grid-cols-2">
        {team && (
          <section className="section-block">
            <h2 className="section-title text-xl mb-4">National Team</h2>
            <Link href={`/teams/${team.slug}`} className="group flex items-start justify-between">
              <div>
                <p className="font-black text-white group-hover:opacity-70 transition-opacity" style={{ letterSpacing: "-0.02em" }}>
                  {FLAGS[team.slug]} {team.name}
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  FIFA #{team.fifaRanking} · Group {team.group}
                </p>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {team.worldCupTitles} World Cup title{team.worldCupTitles !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="arrow-link shrink-0 ml-4">Team profile →</span>
            </Link>
          </section>
        )}

        {stadium && (
          <section className="section-block">
            <h2 className="section-title text-xl mb-4">Associated Venue</h2>
            <Link href={`/stadiums/${stadium.slug}`} className="group flex items-start justify-between">
              <div>
                <p className="font-black text-white group-hover:opacity-70 transition-opacity" style={{ letterSpacing: "-0.02em" }}>
                  {stadium.name}
                </p>
                <p className="text-sm text-zinc-400 mt-1">{stadium.city}, {stadium.state}</p>
                <p className="text-sm text-zinc-500 mt-0.5">
                  Cap. {stadium.capacity.toLocaleString()}
                </p>
              </div>
              <span className="arrow-link shrink-0 ml-4">Venue guide →</span>
            </Link>
          </section>
        )}
      </div>

      {/* AD SLOT */}
      {/* <!-- AD SLOT: player-page-bottom --> */}
      <div className="ad-slot">
        <span className="ad-slot-label">Advertisement</span>
        <span className="ad-slot-dims">728×90 — Leaderboard</span>
      </div>
    </article>
  );
}
