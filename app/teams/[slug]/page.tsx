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

export default function TeamPage({ params }: Props) {
  const team = getTeam(params.slug);
  if (!team) notFound();

  const players = getTeamPlayers(team.slug);
  const matches = getTeamMatches(team.slug);
  const homeStadium = getStadium(team.homeStadiumSlug);

  return (
    <article className="space-y-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-zinc-500 flex gap-1 items-center">
        <Link href="/" className="hover:text-zinc-300">
          Home
        </Link>
        <span>/</span>
        <Link href="/teams" className="hover:text-zinc-300">
          Teams
        </Link>
        <span>/</span>
        <span className="text-zinc-300">{team.name}</span>
      </nav>

      {/* Header */}
      <header className="border-b border-zinc-800 pb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">
              {team.confederation} · Group {team.group}
            </p>
            <h1>{team.name}</h1>
            <p className="mt-1 text-sm text-zinc-400">Coach: {team.coach}</p>
          </div>
          <span className="rounded bg-zinc-800 px-3 py-1.5 text-sm font-bold text-zinc-200">
            {team.shortName}
          </span>
        </div>
      </header>

      {/* AD SLOT */}
      {/* <!-- AD SLOT: team-page-top --> */}
      <div className="ad-slot">Advertisement</div>

      {/* Key Stats */}
      <section>
        <h2 className="mb-4">Team Statistics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="stat-label">FIFA Ranking</p>
            <p className="stat-value">#{team.fifaRanking}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">World Cup Titles</p>
            <p className="stat-value">{team.worldCupTitles}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Founded</p>
            <p className="stat-value">{team.founded}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Group</p>
            <p className="stat-value">Group {team.group}</p>
          </div>
        </div>
      </section>

      {/* Team Overview */}
      <section className="section-block">
        <h2 className="mb-3">Team Overview</h2>
        <p className="text-zinc-300 leading-relaxed">{team.description}</p>
      </section>

      {/* Players */}
      {players.length > 0 && (
        <section>
          <h2 className="mb-4">Key Players</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => (
              <Link
                key={player.slug}
                href={`/players/${player.slug}`}
                className="section-block hover:border-emerald-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{player.name}</span>
                  <span className="tag">#{player.kitNumber}</span>
                </div>
                <p className="text-sm text-zinc-400 mt-1">{player.position}</p>
                <p className="text-sm text-zinc-400 mt-0.5">
                  {player.club} · {player.clubLeague}
                </p>
                <div className="mt-3 flex gap-4 text-xs text-zinc-500">
                  <span>{player.caps} caps</span>
                  <span>{player.internationalGoals} goals</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* AD SLOT */}
      {/* <!-- AD SLOT: team-page-mid --> */}
      <div className="ad-slot">Advertisement</div>

      {/* Matches */}
      {matches.length > 0 && (
        <section>
          <h2 className="mb-4">Group Stage Fixtures</h2>
          <div className="space-y-3">
            {matches.map((match) => (
              <Link
                key={match.slug}
                href={`/matches/${match.slug}`}
                className="flex items-center justify-between section-block hover:border-emerald-600 transition-colors"
              >
                <div>
                  <p className="font-medium text-white">
                    {match.homeTeamName} vs {match.awayTeamName}
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
                <span className="text-emerald-400 text-sm font-medium shrink-0 ml-4">
                  Preview →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Home Stadium */}
      {homeStadium && (
        <section className="section-block">
          <h2 className="mb-3">Home Stadium</h2>
          <Link
            href={`/stadiums/${homeStadium.slug}`}
            className="group flex items-start justify-between"
          >
            <div>
              <p className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                {homeStadium.name}
              </p>
              <p className="text-sm text-zinc-400 mt-1">
                {homeStadium.city}, {homeStadium.state}
              </p>
              <p className="text-sm text-zinc-500 mt-0.5">
                Capacity: {homeStadium.capacity.toLocaleString()}
              </p>
            </div>
            <span className="text-emerald-400 text-sm font-medium shrink-0 ml-4">
              Stadium guide →
            </span>
          </Link>
        </section>
      )}

      {/* AD SLOT */}
      {/* <!-- AD SLOT: team-page-bottom --> */}
      <div className="ad-slot">Advertisement</div>
    </article>
  );
}
