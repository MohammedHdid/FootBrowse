import type { Metadata } from "next";
import Link from "next/link";
import { players } from "@/lib/data";

export const metadata: Metadata = {
  title: "World Cup 2026 Players",
  description:
    "Browse FIFA World Cup 2026 player profiles — stats, positions, clubs, and international records on FootBrowse.",
};

export default function PlayersPage() {
  return (
    <div className="space-y-8">
      <div className="border-b border-zinc-800 pb-6">
        <h1>World Cup 2026 Players</h1>
        <p className="mt-2 text-zinc-400">
          {players.length} player profiles — positions, international stats,
          club careers, and World Cup records.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((player) => (
          <Link
            key={player.slug}
            href={`/players/${player.slug}`}
            className="block section-block hover:border-emerald-600 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-base">
                {player.name}
              </span>
              <span className="tag">#{player.kitNumber}</span>
            </div>
            <p className="text-sm text-zinc-400">
              {player.position} · {player.teamName}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {player.club} · {player.clubLeague}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div>
                <p className="stat-label">Caps</p>
                <p className="text-sm font-semibold text-white">
                  {player.caps}
                </p>
              </div>
              <div>
                <p className="stat-label">Int&apos;l Goals</p>
                <p className="text-sm font-semibold text-white">
                  {player.internationalGoals}
                </p>
              </div>
              <div>
                <p className="stat-label">WC Goals</p>
                <p className="text-sm font-semibold text-white">
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
