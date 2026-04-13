import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { playersByTeam } from "@/lib/data";
import { getPositionStyle } from "@/lib/positions";
import FlagImg from "@/components/FlagImg";

export const metadata: Metadata = {
  title: "World Cup 2026 Players — Squads & Profiles | FootBrowse",
  description:
    "Browse FIFA World Cup 2026 player profiles — positions, nationalities and squad info for every team on FootBrowse.",
};

export default function PlayersPage() {
  // Build a representative selection: up to 2 players per team,
  // preferring players that have photos.
  const teamEntries = Object.entries(playersByTeam).filter(
    ([, squad]) => squad.length > 0
  );

  const featured = teamEntries.flatMap(([, squad]) => {
    const withPhoto = squad.filter((p) => p.photo_url);
    const pick = withPhoto.length >= 2
      ? withPhoto.slice(0, 2)
      : [...withPhoto, ...squad.filter((p) => !p.photo_url)].slice(0, 2);
    return pick;
  });

  const totalPlayers = Object.values(playersByTeam).reduce(
    (sum, s) => sum + s.length, 0
  );
  const teamsWithData = teamEntries.length;

  return (
    <div className="space-y-8">

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">Players</span>
      </nav>

      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-2 mb-3">
          <span className="badge-green">{teamsWithData} teams</span>
          <span className="badge-blue">{totalPlayers} players</span>
        </div>
        <h1>World Cup 2026 Players</h1>
        <p className="mt-2 text-zinc-400 text-sm">
          {teamsWithData > 0
            ? `Squad data available for ${teamsWithData} of 48 teams. More squads will be added as they are confirmed.`
            : "Full squad data will appear here once teams confirm their World Cup 2026 rosters."}
        </p>
      </div>

      {featured.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((player) => {
            const { color: posColor, label: posLabel } = getPositionStyle(player.position);
            return (
              <Link key={player.slug} href={`/players/${player.slug}`} className="entity-card block">
                <div className="flex items-start gap-3 mb-2">
                  {/* Photo or position-coloured chip */}
                  {player.photo_url ? (
                    <Image
                      src={player.photo_url}
                      alt={`${player.name} photo`}
                      width={44}
                      height={44}
                      className="rounded-lg object-cover object-top shrink-0"
                      style={{ width: 44, height: 44 }}
                    />
                  ) : (
                    <div
                      className="rounded-lg flex items-center justify-center shrink-0 text-sm"
                      style={{
                        width: 44,
                        height: 44,
                        backgroundColor: `${posColor}22`,
                        border: `1px solid ${posColor}44`,
                      }}
                    >
                      <FlagImg nationality={player.nationality} size={28} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span
                      className="block font-black text-white text-base truncate"
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      {player.name}
                    </span>
                    <p className="text-sm text-zinc-400 truncate mt-0.5 flex items-center gap-1">
                      <FlagImg nationality={player.nationality} size={16} /> {player.nationality}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: `${posColor}18`,
                      color: posColor,
                      border: `1px solid ${posColor}33`,
                    }}
                  >
                    {posLabel}
                  </span>
                  <span className="text-xs text-zinc-500">{player.teamName}</span>
                </div>

                <div className="flex items-center justify-end">
                  <span className="text-xs font-semibold" style={{ color: "#00FF87" }}>
                    View profile →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div
          className="rounded-xl px-5 py-12 text-center"
          style={{
            backgroundColor: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p className="text-zinc-400 font-bold mb-2">Squad data coming soon</p>
          <p className="text-zinc-600 text-sm">
            World Cup 2026 rosters will be confirmed closer to the tournament.
          </p>
        </div>
      )}

      {/* Browse by team CTA */}
      <div
        className="rounded-xl px-5 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{
          backgroundColor: "rgba(0,255,135,0.04)",
          border: "1px solid rgba(0,255,135,0.12)",
        }}
      >
        <div>
          <p className="font-black text-white" style={{ letterSpacing: "-0.02em" }}>
            Browse full squads by team
          </p>
          <p className="text-sm text-zinc-400 mt-1">
            View all {totalPlayers} available players organised by national team
          </p>
        </div>
        <Link
          href="/teams"
          className="shrink-0 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#00FF87", color: "#0a0a0a" }}
        >
          View all teams →
        </Link>
      </div>
    </div>
  );
}
