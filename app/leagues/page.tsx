import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAllLeagues, formatSeason } from "@/lib/leagues";

export const metadata: Metadata = {
  title: "Football Leagues — Standings, Fixtures & Teams | FootBrowse",
  description:
    "Browse top football leagues including the Premier League, La Liga, Bundesliga, UEFA Champions League and more. Fixtures, standings, and team profiles.",
  alternates: { canonical: "https://footbrowse.com/leagues" },
};

export default function LeaguesPage() {
  const leagues = getAllLeagues();

  return (
    <div className="space-y-8">

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">Leagues</span>
      </nav>

      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-2 mb-3">
          <span className="badge-green">{leagues.length} Leagues</span>
        </div>
        <h1>Football Leagues</h1>
        <p className="mt-2 text-zinc-400 text-sm">
          Top competitions covered — standings, fixtures, teams, and player stats.
        </p>
      </div>

      {/* League grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {leagues.map((league) => (
          <Link
            key={league.slug}
            href={`/leagues/${league.slug}`}
            className="entity-card flex items-center gap-4 group"
          >
            {/* Logo */}
            <div className="shrink-0 w-14 h-14 flex items-center justify-center rounded-xl bg-slate-50 shadow-inner p-1.5">
              <Image
                src={league.logo}
                alt={`${league.name} logo`}
                width={48}
                height={48}
                className="object-contain"
                unoptimized
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p
                className="font-black text-white text-base leading-tight truncate"
                style={{ letterSpacing: "-0.02em" }}
              >
                {league.name}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                {league.flag && (
                  <Image
                    src={league.flag}
                    alt={league.country}
                    width={14}
                    height={10}
                    className="rounded-sm object-cover shrink-0"
                    unoptimized
                  />
                )}
                <span className="text-xs text-zinc-500">{league.country}</span>
                <span className="tag text-[10px]">{formatSeason(league)}</span>
              </div>
            </div>

            {/* Arrow */}
            <span
              className="text-sm font-bold shrink-0 opacity-30 group-hover:opacity-100 transition-opacity"
              style={{ color: "#00FF87" }}
            >
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
