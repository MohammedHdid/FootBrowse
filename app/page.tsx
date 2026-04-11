import Link from "next/link";
import { matches, teams, stadiums, players } from "@/lib/data";

const FLAGS: Record<string, string> = {
  france: "🇫🇷",
  brazil: "🇧🇷",
  morocco: "🇲🇦",
  argentina: "🇦🇷",
  usa: "🇺🇸",
  spain: "🇪🇸",
};

export default function HomePage() {
  return (
    <div className="space-y-14">

      {/* ── Hero ── */}
      <section className="page-header pt-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="badge-green">World Cup 2026</span>
          <span className="badge-blue">Live Coverage</span>
        </div>
        <h1
          className="text-4xl sm:text-5xl font-black text-white leading-none"
          style={{ letterSpacing: "-0.04em" }}
        >
          World Cup 2026
          <br />
          <span style={{ color: "#00FF87" }}>Match Previews,</span> Stats &amp; Data
        </h1>
        <p className="mt-4 text-zinc-400 max-w-xl leading-relaxed">
          The data-driven guide to FIFA World Cup 2026 — every fixture,
          squad, stadium, and star player. No noise. Just football.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/matches"
            className="rounded-lg px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: "#00FF87", color: "#0a0a0a" }}
          >
            Browse Matches
          </Link>
          <Link
            href="/teams"
            className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-bold text-zinc-300 hover:border-zinc-500 hover:text-white transition-all duration-200"
          >
            View Teams
          </Link>
        </div>
      </section>

      {/* ── Upcoming Matches ── */}
      <section>
        <div className="section-row">
          <h2 className="section-title text-xl">Upcoming Matches</h2>
          <Link href="/matches" className="arrow-link">All matches →</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <Link key={match.slug} href={`/matches/${match.slug}`} className="match-card block">
              <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold mb-2">
                {match.stage} · Group {match.group}
              </p>
              <p className="font-black text-white text-base" style={{ letterSpacing: "-0.02em" }}>
                {FLAGS[match.homeTeamSlug]} {match.homeTeamName}{" "}
                <span className="text-zinc-600 font-normal">vs</span>{" "}
                {FLAGS[match.awayTeamSlug]} {match.awayTeamName}
              </p>
              <p className="text-sm text-zinc-400 mt-2">
                {new Date(match.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                · {match.stadiumName}
              </p>
              <p className="mt-3 text-xs font-semibold" style={{ color: "#00FF87" }}>
                Match preview →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Teams ── */}
      <section>
        <div className="section-row">
          <h2 className="section-title text-xl">Teams</h2>
          <Link href="/teams" className="arrow-link">All teams →</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link key={team.slug} href={`/teams/${team.slug}`} className="entity-card block">
              <div className="flex items-center justify-between mb-3">
                <p className="font-black text-white text-base" style={{ letterSpacing: "-0.02em" }}>
                  {FLAGS[team.slug]} {team.name}
                </p>
                <span className="tag">{team.shortName}</span>
              </div>
              <div className="flex gap-4 text-sm">
                <div>
                  <p className="stat-label">FIFA Rank</p>
                  <p className="text-sm font-bold text-white mt-0.5">#{team.fifaRanking}</p>
                </div>
                <div>
                  <p className="stat-label">WC Titles</p>
                  <p className="text-sm font-bold text-white mt-0.5">{team.worldCupTitles}</p>
                </div>
                <div>
                  <p className="stat-label">Group</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: "#00FF87" }}>
                    {team.group}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Stadiums ── */}
      <section>
        <div className="section-row">
          <h2 className="section-title text-xl">Stadiums</h2>
          <Link href="/stadiums" className="arrow-link">All stadiums →</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {stadiums.map((stadium) => (
            <Link key={stadium.slug} href={`/stadiums/${stadium.slug}`} className="entity-card block">
              <div className="flex items-start justify-between mb-2">
                <p className="font-black text-white leading-tight" style={{ letterSpacing: "-0.02em" }}>
                  {stadium.name}
                </p>
                {stadium.hostingFinal && (
                  <span className="badge-green ml-2 shrink-0">Final</span>
                )}
              </div>
              <p className="text-sm text-zinc-400">{stadium.city}, {stadium.state}</p>
              <p className="text-xs text-zinc-600 mt-2">
                Cap. {stadium.capacity.toLocaleString()} · {stadium.worldCup2026Matches} WC matches
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Players ── */}
      <section>
        <div className="section-row">
          <h2 className="section-title text-xl">Featured Players</h2>
          <Link href="/players" className="arrow-link">All players →</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => (
            <Link key={player.slug} href={`/players/${player.slug}`} className="entity-card block">
              <div className="flex items-center justify-between mb-2">
                <p className="font-black text-white" style={{ letterSpacing: "-0.02em" }}>
                  {player.name}
                </p>
                <span
                  className="text-lg font-black tabular-nums"
                  style={{ color: "#00FF87" }}
                >
                  #{player.kitNumber}
                </span>
              </div>
              <p className="text-sm text-zinc-400">
                {FLAGS[player.teamSlug]} {player.teamName} · {player.position}
              </p>
              <div className="mt-3 flex gap-4 text-xs">
                <span className="text-zinc-500">
                  <span className="font-bold text-zinc-300">{player.caps}</span> caps
                </span>
                <span className="text-zinc-500">
                  <span className="font-bold text-zinc-300">{player.internationalGoals}</span> goals
                </span>
                <span className="text-zinc-500">
                  <span className="font-bold text-zinc-300">{player.worldCupGoals}</span> WC goals
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
