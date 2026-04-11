import type { Metadata } from "next";
import Link from "next/link";
import { matches } from "@/lib/data";

export const metadata: Metadata = {
  title: "World Cup 2026 Matches",
  description:
    "Browse all FIFA World Cup 2026 match previews, fixtures, head-to-head stats, and key matchups on FootBrowse.",
};

export default function MatchesPage() {
  return (
    <div className="space-y-8">
      <div className="border-b border-zinc-800 pb-6">
        <h1>World Cup 2026 Matches</h1>
        <p className="mt-2 text-zinc-400">
          {matches.length} match previews — group stage fixtures, head-to-head
          records, and key player matchups.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((match) => (
          <Link
            key={match.slug}
            href={`/matches/${match.slug}`}
            className="block section-block hover:border-emerald-600 transition-colors"
          >
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">
              {match.stage} · Group {match.group} · Matchday {match.matchday}
            </p>
            <p className="text-lg font-bold text-white">
              {match.homeTeamName}{" "}
              <span className="text-zinc-500 font-normal text-base">vs</span>{" "}
              {match.awayTeamName}
            </p>
            <p className="text-sm text-zinc-400 mt-2">
              {new Date(match.date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="text-sm text-zinc-500 mt-0.5">
              {match.kickoffTime} {match.timezone} · {match.stadiumName}
            </p>
            <p className="mt-3 text-xs text-zinc-500 line-clamp-2">
              {match.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
