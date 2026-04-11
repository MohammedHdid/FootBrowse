import type { Metadata } from "next";
import Link from "next/link";
import { teams } from "@/lib/data";

export const metadata: Metadata = {
  title: "World Cup 2026 Teams",
  description:
    "Explore all FIFA World Cup 2026 team profiles — rankings, squads, coaches, and match schedules on FootBrowse.",
};

export default function TeamsPage() {
  return (
    <div className="space-y-8">
      <div className="border-b border-zinc-800 pb-6">
        <h1>World Cup 2026 Teams</h1>
        <p className="mt-2 text-zinc-400">
          {teams.length} team profiles — FIFA rankings, World Cup history, key
          players, and group stage fixtures.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Link
            key={team.slug}
            href={`/teams/${team.slug}`}
            className="block section-block hover:border-emerald-600 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-lg">{team.name}</span>
              <span className="tag">{team.shortName}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div>
                <p className="stat-label">FIFA Rank</p>
                <p className="text-sm font-semibold text-white">
                  #{team.fifaRanking}
                </p>
              </div>
              <div>
                <p className="stat-label">WC Titles</p>
                <p className="text-sm font-semibold text-white">
                  {team.worldCupTitles}
                </p>
              </div>
              <div>
                <p className="stat-label">Confederation</p>
                <p className="text-sm font-semibold text-white">
                  {team.confederation}
                </p>
              </div>
              <div>
                <p className="stat-label">Group</p>
                <p className="text-sm font-semibold text-white">
                  Group {team.group}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Coach: {team.coach}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
