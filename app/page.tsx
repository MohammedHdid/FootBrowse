import type { Metadata } from "next";
import Link from "next/link";
import { matches, teams, stadiums, playersByTeam } from "@/lib/data";
import FlagImg from "@/components/FlagImg";

export const metadata: Metadata = {
  title: "FootBrowse — World Cup 2026 Stats, Matches & Teams",
  description:
    "FootBrowse is your data-driven guide to FIFA World Cup 2026. Browse match previews, team profiles, stadium guides, and player stats for all 48 teams and 104 matches.",
  alternates: { canonical: "https://footbrowse.com" },
};

// Position priority: attackers first, then midfielders, then defenders, then GK
const POS_PRIORITY: Record<string, number> = {
  "Centre-Forward": 1, "Right Winger": 1, "Left Winger": 1,
  "Attacking Midfield": 2, "Second Striker": 2, "Offence": 2,
  "Central Midfield": 3, "Defensive Midfield": 3, "Right Midfield": 3, "Left Midfield": 3, "Midfield": 3,
  "Centre-Back": 4, "Right-Back": 4, "Left-Back": 4, "Defence": 4,
  "Goalkeeper": 5,
};

export default function HomePage() {
  // Pick the most attack-minded player with a photo from each team
  const spotlightPlayers = Object.values(playersByTeam)
    .filter((squad) => squad.length > 0)
    .map((squad) => {
      const withPhoto = squad.filter((p) => p.photo_url);
      if (withPhoto.length === 0) return squad[0];
      return withPhoto.sort(
        (a, b) => (POS_PRIORITY[a.position] ?? 6) - (POS_PRIORITY[b.position] ?? 6)
      )[0];
    })
    .filter((p): p is NonNullable<typeof p> => p !== undefined)
    .slice(0, 6);

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
          {[...matches]
            .filter((m) => m.type === "scheduled" && m.team_a.fifa_rank && m.team_b.fifa_rank)
            .sort((a, b) => (a.team_a.fifa_rank + a.team_b.fifa_rank) - (b.team_a.fifa_rank + b.team_b.fifa_rank))
            .slice(0, 6)
            .map((match) => (
            <Link key={match.slug} href={`/matches/${match.slug}`} className="match-card block">
              <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold mb-2">
                {match.stage} · Group {match.group}
              </p>
              <div className="flex items-center gap-2 mb-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={match.team_a.flag_url}
                  alt={match.team_a.name}
                  width={24}
                  height={16}
                  className="rounded-sm object-cover shrink-0"
                  style={{ width: 24, height: "auto" }}
                />
                <span
                  className="font-black text-white text-base"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {match.team_a.name}
                </span>
                <span className="text-zinc-600 font-normal mx-1">vs</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={match.team_b.flag_url}
                  alt={match.team_b.name}
                  width={24}
                  height={16}
                  className="rounded-sm object-cover shrink-0"
                  style={{ width: 24, height: "auto" }}
                />
                <span
                  className="font-black text-white text-base"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {match.team_b.name}
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-2">
                {new Date(match.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                · {match.city}
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
          {[...teams].sort((a, b) => a.fifa_rank - b.fifa_rank).slice(0, 6).map((team) => (
            <Link key={team.slug} href={`/teams/${team.slug}`} className="entity-card block">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={team.flag_url}
                    alt={`${team.name} flag`}
                    width={28}
                    height={18}
                    className="rounded-sm object-cover shrink-0"
                    style={{ width: 28, height: "auto" }}
                  />
                  <p className="font-black text-white text-base truncate" style={{ letterSpacing: "-0.02em" }}>
                    {team.name}
                  </p>
                </div>
                <span className="tag shrink-0 ml-2">{team.code.toUpperCase()}</span>
              </div>
              <div className="flex gap-4 text-sm">
                <div>
                  <p className="stat-label">FIFA Rank</p>
                  <p className="text-sm font-bold text-white mt-0.5">#{team.fifa_rank}</p>
                </div>
                <div>
                  <p className="stat-label">WC Titles</p>
                  <p className="text-sm font-bold text-white mt-0.5">{team.wc_titles}</p>
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
          {[...stadiums].sort((a, b) => b.capacity - a.capacity).slice(0, 6).map((stadium) => (
            <Link key={stadium.slug} href={`/stadiums/${stadium.slug}`} className="entity-card block overflow-hidden !p-0">
              {/* Stadium photo */}
              {stadium.photo_url && (
                <div className="w-full h-28 overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={stadium.photo_url}
                    alt={stadium.name}
                    className="w-full h-full object-cover"
                  />
                  {stadium.is_final_venue && (
                    <span className="badge-green absolute top-2 left-2">Final</span>
                  )}
                </div>
              )}
              <div className="p-3">
                <p className="font-black text-white leading-tight text-sm" style={{ letterSpacing: "-0.02em" }}>
                  {stadium.name}
                </p>
                <p className="text-xs text-zinc-400 mt-1">{stadium.city}, {stadium.state}</p>
                <p className="text-xs text-zinc-600 mt-1">
                  Cap. {stadium.capacity.toLocaleString()} · {stadium.wc_matches} WC matches
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Squad Spotlight ── */}
      {spotlightPlayers.length > 0 && (
        <section>
          <div className="section-row">
            <h2 className="section-title text-xl">Squad Spotlight</h2>
            <Link href="/players" className="arrow-link">Browse squads →</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {spotlightPlayers.map((player) => (
              <Link key={player.slug} href={`/players/${player.slug}`} className="entity-card block">
                <div className="flex items-start gap-3 mb-2">
                  {player.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={player.photo_url}
                      alt={player.name}
                      width={48}
                      height={48}
                      className="rounded-lg object-cover object-top shrink-0"
                      style={{ width: 48, height: 48 }}
                    />
                  ) : (
                    <div
                      className="rounded-lg shrink-0 flex items-center justify-center"
                      style={{ width: 48, height: 48, backgroundColor: "rgba(255,255,255,0.05)" }}
                    >
                      <FlagImg nationality={player.nationality} size={32} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white truncate" style={{ letterSpacing: "-0.02em" }}>
                      {player.name}
                    </p>
                    <p className="text-sm text-zinc-400 mt-0.5 flex items-center gap-1">
                      <FlagImg nationality={player.nationality} size={16} /> {player.nationality}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-zinc-500">{player.position} · {player.teamName}</p>
                <p className="mt-3 text-xs font-semibold" style={{ color: "#00FF87" }}>
                  View profile →
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
