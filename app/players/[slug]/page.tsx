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

export default function PlayerPage({ params }: Props) {
  const player = getPlayer(params.slug);
  if (!player) notFound();

  const team = getTeam(player.teamSlug);
  const stadium = getStadium(player.stadiumSlug);
  const teamMatches = getTeamMatches(player.teamSlug);

  return (
    <article className="space-y-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-zinc-500 flex gap-1 items-center">
        <Link href="/" className="hover:text-zinc-300">
          Home
        </Link>
        <span>/</span>
        <Link href="/players" className="hover:text-zinc-300">
          Players
        </Link>
        <span>/</span>
        <span className="text-zinc-300">{player.name}</span>
      </nav>

      {/* Header */}
      <header className="border-b border-zinc-800 pb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">
              {player.nationality} · {player.position}
            </p>
            <h1>{player.name}</h1>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-400">
              <Link
                href={`/teams/${player.teamSlug}`}
                className="hover:text-emerald-400 transition-colors"
              >
                {player.teamName}
              </Link>
              <span>·</span>
              <span>{player.club}</span>
              <span>·</span>
              <span>{player.clubLeague}</span>
            </div>
          </div>
          <span className="rounded bg-zinc-800 px-3 py-1.5 text-xl font-bold text-white">
            #{player.kitNumber}
          </span>
        </div>
      </header>

      {/* AD SLOT */}
      {/* <!-- AD SLOT: player-page-top --> */}
      <div className="ad-slot">Advertisement</div>

      {/* Career Stats */}
      <section>
        <h2 className="mb-4">International Statistics</h2>
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
            <p className="stat-value">{player.worldCupGoals}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Market Value</p>
            <p className="stat-value text-base">{player.marketValue}</p>
          </div>
        </div>
      </section>

      {/* Personal Details */}
      <section className="section-block">
        <h2 className="mb-4">Player Details</h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <dt className="stat-label">Date of Birth</dt>
            <dd className="text-sm font-medium text-white mt-1">
              {new Date(player.dateOfBirth).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </dd>
          </div>
          <div>
            <dt className="stat-label">Age</dt>
            <dd className="text-sm font-medium text-white mt-1">
              {player.age}
            </dd>
          </div>
          <div>
            <dt className="stat-label">Height</dt>
            <dd className="text-sm font-medium text-white mt-1">
              {player.height}
            </dd>
          </div>
          <div>
            <dt className="stat-label">Preferred Foot</dt>
            <dd className="text-sm font-medium text-white mt-1">
              {player.preferredFoot}
            </dd>
          </div>
          <div>
            <dt className="stat-label">Club</dt>
            <dd className="text-sm font-medium text-white mt-1">
              {player.club}
            </dd>
          </div>
          <div>
            <dt className="stat-label">League</dt>
            <dd className="text-sm font-medium text-white mt-1">
              {player.clubLeague}
            </dd>
          </div>
        </dl>
      </section>

      {/* Player Bio */}
      <section className="section-block">
        <h2 className="mb-3">Player Profile</h2>
        <p className="text-zinc-300 leading-relaxed">{player.description}</p>
      </section>

      {/* Strengths */}
      <section className="section-block">
        <h2 className="mb-3">Key Strengths</h2>
        <div className="flex flex-wrap gap-2">
          {player.strengths.map((strength) => (
            <span
              key={strength}
              className="rounded-full bg-emerald-900/40 border border-emerald-800 px-3 py-1 text-sm text-emerald-300 font-medium"
            >
              {strength}
            </span>
          ))}
        </div>
      </section>

      {/* AD SLOT */}
      {/* <!-- AD SLOT: player-page-mid --> */}
      <div className="ad-slot">Advertisement</div>

      {/* Team Matches */}
      {teamMatches.length > 0 && (
        <section>
          <h2 className="mb-4">{player.teamName} Fixtures at World Cup 2026</h2>
          <div className="space-y-3">
            {teamMatches.map((match) => (
              <Link
                key={match.slug}
                href={`/matches/${match.slug}`}
                className="flex items-center justify-between section-block hover:border-emerald-600 transition-colors"
              >
                <div>
                  <p className="text-xs text-zinc-500 mb-1">
                    {match.stage} · Group {match.group}
                  </p>
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

      {/* Team & Stadium Links */}
      <div className="grid gap-4 sm:grid-cols-2">
        {team && (
          <section className="section-block">
            <h2 className="mb-3">National Team</h2>
            <Link
              href={`/teams/${team.slug}`}
              className="group flex items-start justify-between"
            >
              <div>
                <p className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {team.name}
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  FIFA #{team.fifaRanking} · Group {team.group}
                </p>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {team.worldCupTitles} World Cup title
                  {team.worldCupTitles !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="text-emerald-400 text-sm font-medium shrink-0 ml-4">
                Team profile →
              </span>
            </Link>
          </section>
        )}

        {stadium && (
          <section className="section-block">
            <h2 className="mb-3">Associated Venue</h2>
            <Link
              href={`/stadiums/${stadium.slug}`}
              className="group flex items-start justify-between"
            >
              <div>
                <p className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {stadium.name}
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  {stadium.city}, {stadium.state}
                </p>
                <p className="text-sm text-zinc-500 mt-0.5">
                  Cap. {stadium.capacity.toLocaleString()}
                </p>
              </div>
              <span className="text-emerald-400 text-sm font-medium shrink-0 ml-4">
                Venue guide →
              </span>
            </Link>
          </section>
        )}
      </div>

      {/* AD SLOT */}
      {/* <!-- AD SLOT: player-page-bottom --> */}
      <div className="ad-slot">Advertisement</div>
    </article>
  );
}
