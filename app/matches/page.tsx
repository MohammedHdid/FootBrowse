import type { Metadata } from "next";
import Link from "next/link";
import { matches } from "@/lib/data";

export const metadata: Metadata = {
  title: "World Cup 2026 Matches",
  description:
    "Browse all FIFA World Cup 2026 match previews, fixtures, head-to-head stats, and key matchups on FootBrowse.",
};

const FLAGS: Record<string, string> = {
  france: "🇫🇷",
  brazil: "🇧🇷",
  morocco: "🇲🇦",
  argentina: "🇦🇷",
  usa: "🇺🇸",
  spain: "🇪🇸",
};

export default function MatchesPage() {
  return (
    <div className="space-y-8">

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">Matches</span>
      </nav>

      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-2 mb-3">
          <span className="badge-green">{matches.length} Fixtures</span>
        </div>
        <h1>World Cup 2026 Matches</h1>
        <p className="mt-2 text-zinc-400 text-sm">
          Group stage fixtures with head-to-head records and key player matchups.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((match) => (
          <Link key={match.slug} href={`/matches/${match.slug}`} className="match-card block">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold">
                {match.stage} · Group {match.group} · MD{match.matchday}
              </p>
              <span className="status-pill">{match.status}</span>
            </div>
            <p className="text-lg font-black text-white" style={{ letterSpacing: "-0.02em" }}>
              {FLAGS[match.homeTeamSlug]} {match.homeTeamName}{" "}
              <span className="text-zinc-600 font-normal text-base">vs</span>{" "}
              {FLAGS[match.awayTeamSlug]} {match.awayTeamName}
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
            <p className="mt-3 text-xs text-zinc-600 line-clamp-2 leading-relaxed">
              {match.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
