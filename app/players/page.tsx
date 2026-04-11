import type { Metadata } from "next";
import Link from "next/link";
import { players } from "@/lib/data";

export const metadata: Metadata = {
  title: "World Cup 2026 Players",
  description:
    "Browse FIFA World Cup 2026 player profiles — stats, positions, clubs, and international records on FootBrowse.",
};

const FLAGS: Record<string, string> = {
  france: "🇫🇷",
  brazil: "🇧🇷",
  morocco: "🇲🇦",
  argentina: "🇦🇷",
  usa: "🇺🇸",
  spain: "🇪🇸",
};

export default function PlayersPage() {
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
          <span className="badge-green">{players.length} Profiles</span>
        </div>
        <h1>World Cup 2026 Players</h1>
        <p className="mt-2 text-zinc-400 text-sm">
          Positions, international stats, club careers, and World Cup records.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((player) => (
          <Link key={player.slug} href={`/players/${player.slug}`} className="entity-card block">
            <div className="flex items-start justify-between mb-2">
              <span className="font-black text-white text-base" style={{ letterSpacing: "-0.02em" }}>
                {player.name}
              </span>
              <span
                className="text-xl font-black tabular-nums shrink-0 ml-2"
                style={{ color: "#00FF87" }}
              >
                #{player.kitNumber}
              </span>
            </div>
            <p className="text-sm text-zinc-400">
              {FLAGS[player.teamSlug]} {player.teamName} · {player.position}
            </p>
            <p className="text-xs text-zinc-600 mt-0.5">{player.club} · {player.clubLeague}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div>
                <p className="stat-label">Caps</p>
                <p className="text-sm font-bold text-white mt-0.5">{player.caps}</p>
              </div>
              <div>
                <p className="stat-label">Int&apos;l Goals</p>
                <p className="text-sm font-bold text-white mt-0.5">{player.internationalGoals}</p>
              </div>
              <div>
                <p className="stat-label">WC Goals</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: "#00FF87" }}>
                  {player.worldCupGoals}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
