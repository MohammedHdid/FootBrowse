import type { Metadata } from "next";
import Link from "next/link";
import { teams } from "@/lib/data";

export const metadata: Metadata = {
  title: "World Cup 2026 Teams",
  description:
    "Explore all FIFA World Cup 2026 team profiles — rankings, squads, coaches, and match schedules on FootBrowse.",
};

const FLAGS: Record<string, string> = {
  france: "🇫🇷",
  brazil: "🇧🇷",
  morocco: "🇲🇦",
  argentina: "🇦🇷",
  usa: "🇺🇸",
  spain: "🇪🇸",
};

export default function TeamsPage() {
  return (
    <div className="space-y-8">

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">Teams</span>
      </nav>

      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-2 mb-3">
          <span className="badge-green">{teams.length} Teams</span>
        </div>
        <h1>World Cup 2026 Teams</h1>
        <p className="mt-2 text-zinc-400 text-sm">
          FIFA rankings, World Cup history, key players, and group stage fixtures.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Link key={team.slug} href={`/teams/${team.slug}`} className="entity-card block">
            <div className="flex items-center justify-between mb-3">
              <span className="font-black text-white text-lg" style={{ letterSpacing: "-0.02em" }}>
                {FLAGS[team.slug]} {team.name}
              </span>
              <span className="tag">{team.shortName}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <p className="stat-label">FIFA Rank</p>
                <p className="text-sm font-bold text-white mt-0.5">#{team.fifaRanking}</p>
              </div>
              <div>
                <p className="stat-label">WC Titles</p>
                <p className="text-sm font-bold text-white mt-0.5">{team.worldCupTitles}</p>
              </div>
              <div>
                <p className="stat-label">Confederation</p>
                <p className="text-sm font-bold text-white mt-0.5">{team.confederation}</p>
              </div>
              <div>
                <p className="stat-label">Group</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: "#00FF87" }}>
                  Group {team.group}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-600">Coach: {team.coach}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
