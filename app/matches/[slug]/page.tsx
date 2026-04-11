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
      <nav className="text-xs text-zinc-500 flex gap-1 items-center">
        <Link href="/" className="hover:text-zinc-300">
          Home
        </Link>
        <span>/</span>
        <Link href="/matches" className="hover:text-zinc-300">
          Matches
        </Link>
        <span>/</span>
        <span className="text-zinc-300">
          {match.homeTeamShort} vs {match.awayTeamShort}
        </span>
      </nav>

      {/* Header */}
      <header className="border-b border-zinc-800 pb-6">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">
          {match.stage} · Group {match.group} · Matchday {match.matchday}
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold">
          {match.homeTeamName}{" "}
          <span className="text-zinc-500">vs</span> {match.awayTeamName}
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
          <span>
            🕐 {match.kickoffTime} {match.timezone}
          </span>
          <span>📍 {match.city}</span>
        </div>
      </header>

      {/* AD SLOT */}
      {/* <!-- AD SLOT: match-page-top --> */}
      <div className="ad-slot">Advertisement</div>

      {/* Match Overview */}
      <section className="section-block">
        <h2 className="mb-3">Match Overview</h2>
        <p className="text-zinc-300 leading-relaxed">{match.description}</p>
      </section>

      {/* Scoreline / Status */}
      <section className="section-block">
        <h2 className="mb-4">Fixture Details</h2>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center">
            <Link
              href={`/teams/${match.homeTeamSlug}`}
              className="text-2xl font-extrabold text-white hover:text-emerald-400 transition-colors"
            >
              {match.homeTeamName}
            </Link>
            <p className="text-xs text-zinc-500 mt-1">Home</p>
          </div>
          <div className="text-center">
            {match.status === "upcoming" ? (
              <span className="text-3xl font-bold text-zinc-600">— vs —</span>
            ) : (
              <span className="text-3xl font-bold text-white">
                {match.homeScore} – {match.awayScore}
              </span>
            )}
            <p className="text-xs uppercase tracking-widest text-emerald-400 mt-1">
              {match.status}
            </p>
          </div>
          <div className="text-center">
            <Link
              href={`/teams/${match.awayTeamSlug}`}
              className="text-2xl font-extrabold text-white hover:text-emerald-400 transition-colors"
            >
              {match.awayTeamName}
            </Link>
            <p className="text-xs text-zinc-500 mt-1">Away</p>
          </div>
        </div>
      </section>

      {/* Head-to-Head */}
      <section className="section-block">
        <h2 className="mb-4">Head-to-Head Record</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="stat-card text-center">
            <p className="stat-label">Played</p>
            <p className="stat-value">{h2h.played}</p>
          </div>
          <div className="stat-card text-center">
            <p className="stat-label">{match.homeTeamName} Wins</p>
            <p className="stat-value text-emerald-400">
              {((h2h as unknown) as Record<string, unknown>)[
                `${match.homeTeamSlug.replace(/-/g, "")}Wins`
              ] as number ?? "—"}
            </p>
          </div>
          <div className="stat-card text-center">
            <p className="stat-label">Draws</p>
            <p className="stat-value">{h2h.draws}</p>
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
        <p className="mt-4 text-sm text-zinc-400">
          Last meeting:{" "}
          {new Date(h2h.lastMeeting).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}{" "}
          —{" "}
          <span className="text-zinc-200 font-medium">{h2h.lastResult}</span>
        </p>
      </section>

      {/* Key Matchups */}
      <section className="section-block">
        <h2 className="mb-4">Key Matchups to Watch</h2>
        <ul className="space-y-2">
          {match.keyMatchups.map((matchup, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm text-zinc-300"
            >
              <span className="mt-0.5 text-emerald-400 font-bold shrink-0">
                {i + 1}.
              </span>
              {matchup}
            </li>
          ))}
        </ul>
      </section>

      {/* AD SLOT */}
      {/* <!-- AD SLOT: match-page-mid --> */}
      <div className="ad-slot">Advertisement</div>

      {/* Featured Players */}
      {featuredPlayers.length > 0 && (
        <section>
          <h2 className="mb-4">Featured Players</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {featuredPlayers.map((player) => {
              if (!player) return null;
              return (
                <Link
                  key={player.slug}
                  href={`/players/${player.slug}`}
                  className="section-block hover:border-emerald-600 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white">{player.name}</span>
                    <span className="tag">#{player.kitNumber}</span>
                  </div>
                  <p className="text-sm text-zinc-400">
                    {player.position} · {player.teamName}
                  </p>
                  <p className="text-sm text-zinc-400 mt-0.5">
                    {player.caps} caps · {player.internationalGoals} int&apos;l goals
                  </p>
                  <p className="mt-2 text-xs text-emerald-400 font-medium">
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
          <h2 className="mb-3">Venue</h2>
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
                Capacity: {stadium.capacity.toLocaleString()} ·{" "}
                {stadium.surface} · Opened {stadium.opened}
              </p>
            </div>
            <span className="text-emerald-400 text-sm font-medium shrink-0 ml-4">
              Stadium guide →
            </span>
          </Link>
        </section>
      )}

      {/* Related Teams */}
      <section>
        <h2 className="mb-4">Team Profiles</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[homeTeam, awayTeam].map(
            (team) =>
              team && (
                <Link
                  key={team.slug}
                  href={`/teams/${team.slug}`}
                  className="link-card"
                >
                  {team.name} — FIFA #{team.fifaRanking} ·{" "}
                  {team.worldCupTitles} title
                  {team.worldCupTitles !== 1 ? "s" : ""}
                </Link>
              )
          )}
        </div>
      </section>

      {/* AD SLOT */}
      {/* <!-- AD SLOT: match-page-bottom --> */}
      <div className="ad-slot">Advertisement</div>
    </article>
  );
}
