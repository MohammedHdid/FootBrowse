import type { Metadata } from "next";
import Link from "next/link";
import { players } from "@/lib/data";

export const metadata: Metadata = {
  title: "World Cup 2026 Players — Stats, Goals & Profiles | FootBrowse",
  description:
    "Browse FIFA World Cup 2026 player profiles — stats, positions, clubs, international records and shirt links on FootBrowse.",
};

function formatMarketValue(eur: number): string {
  if (eur >= 1_000_000_000) return `€${(eur / 1_000_000_000).toFixed(1)}B`;
  if (eur >= 1_000_000) return `€${Math.round(eur / 1_000_000)}M`;
  return `€${(eur / 1_000).toFixed(0)}K`;
}

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
          <span className="badge-green">Top 30 Stars</span>
        </div>
        <h1>World Cup 2026 Players</h1>
        <p className="mt-2 text-zinc-400 text-sm">
          The 30 most valuable players heading into the tournament. Full data available on individual profiles.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...players]
          .sort((a, b) => b.market_value_eur - a.market_value_eur)
          .slice(0, 30)
          .map((player) => (
          <Link key={player.slug} href={`/players/${player.slug}`} className="entity-card block">
            <div className="flex items-start gap-3 mb-2">
              {/* Avatar chip */}
              <div
                className="rounded-lg flex items-center justify-center shrink-0"
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: player.avatar_color,
                }}
              >
                <span className="text-base font-black text-white tabular-nums">
                  {player.jersey_number}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className="block font-black text-white text-base truncate"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {player.name}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={player.flag_url}
                    alt={player.country}
                    width={18}
                    height={12}
                    className="rounded-sm object-cover shrink-0"
                    style={{ width: 18, height: "auto" }}
                  />
                  <p className="text-sm text-zinc-400 truncate">
                    {player.country} · {player.position}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-zinc-600 mb-3">
              {player.club} · {player.league}
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="stat-label">Caps</p>
                <p className="text-sm font-bold text-white mt-0.5">{player.caps}</p>
              </div>
              <div>
                <p className="stat-label">Int&apos;l Goals</p>
                <p className="text-sm font-bold text-white mt-0.5">{player.international_goals}</p>
              </div>
              <div>
                <p className="stat-label">WC Goals</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: "#00FF87" }}>
                  {player.wc_goals}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-zinc-600">
                Value:{" "}
                <span className="font-bold text-blue-400">
                  {formatMarketValue(player.market_value_eur)}
                </span>
              </span>
              <span className="text-xs font-semibold" style={{ color: "#00FF87" }}>
                View profile →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
