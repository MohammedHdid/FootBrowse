import Link from "next/link";
import { matches, teams, stadiums, players } from "@/lib/data";

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="py-8 border-b border-zinc-800">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          World Cup 2026 — Match Previews, Stats &amp; Data
        </h1>
        <p className="mt-3 text-zinc-400 max-w-2xl">
          FootBrowse is your data-driven guide to the FIFA World Cup 2026.
          Explore match previews, team profiles, stadium guides, and detailed
          player statistics.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/matches"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
          >
            Browse Matches
          </Link>
          <Link
            href="/teams"
            className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
          >
            View Teams
          </Link>
        </div>
      </section>

      {/* Upcoming Matches */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2>Upcoming Matches</h2>
          <Link
            href="/matches"
            className="text-sm text-emerald-400 hover:underline"
          >
            All matches →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <Link
              key={match.slug}
              href={`/matches/${match.slug}`}
              className="block section-block hover:border-emerald-600 transition-colors"
            >
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">
                {match.stage} · Group {match.group}
              </p>
              <p className="font-bold text-white text-base">
                {match.homeTeamName}{" "}
                <span className="text-zinc-500">vs</span> {match.awayTeamName}
              </p>
              <p className="text-sm text-zinc-400 mt-1">
                {new Date(match.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                · {match.stadiumName}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Teams */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2>Teams</h2>
          <Link
            href="/teams"
            className="text-sm text-emerald-400 hover:underline"
          >
            All teams →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link
              key={team.slug}
              href={`/teams/${team.slug}`}
              className="block section-block hover:border-emerald-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-white">{team.name}</p>
                <span className="tag">{team.shortName}</span>
              </div>
              <p className="text-sm text-zinc-400 mt-1">
                {team.confederation} · FIFA #{team.fifaRanking}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {team.worldCupTitles} World Cup title
                {team.worldCupTitles !== 1 ? "s" : ""}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Stadiums */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2>Stadiums</h2>
          <Link
            href="/stadiums"
            className="text-sm text-emerald-400 hover:underline"
          >
            All stadiums →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {stadiums.map((stadium) => (
            <Link
              key={stadium.slug}
              href={`/stadiums/${stadium.slug}`}
              className="block section-block hover:border-emerald-600 transition-colors"
            >
              <p className="font-bold text-white">{stadium.name}</p>
              <p className="text-sm text-zinc-400 mt-1">
                {stadium.city}, {stadium.state}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Cap. {stadium.capacity.toLocaleString()}
                {stadium.hostingFinal && (
                  <span className="ml-2 text-emerald-400 font-semibold">
                    · Final Venue
                  </span>
                )}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Players */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2>Featured Players</h2>
          <Link
            href="/players"
            className="text-sm text-emerald-400 hover:underline"
          >
            All players →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => (
            <Link
              key={player.slug}
              href={`/players/${player.slug}`}
              className="block section-block hover:border-emerald-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-white">{player.name}</p>
                <span className="tag">#{player.kitNumber}</span>
              </div>
              <p className="text-sm text-zinc-400 mt-1">
                {player.position} · {player.teamName}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {player.caps} caps · {player.internationalGoals} goals
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
