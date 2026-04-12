import type { Metadata } from "next";
import Link from "next/link";
import { matches } from "@/lib/data";

export const metadata: Metadata = {
  title: "World Cup 2026 Matches — Fixtures, Previews & Odds | FootBrowse",
  description:
    "Browse all FIFA World Cup 2026 match previews, fixtures, head-to-head stats, betting odds and predictions on FootBrowse.",
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
          Group stage fixtures with head-to-head records, odds, TV channels and predictions.
        </p>
      </div>

      {["Group Stage", "Round of 32", "Round of 16", "Quarter Finals", "Semi Finals", "Third Place Play-off", "Final"].map((stage) => {
        const stageMatches = matches.filter(m => m.stage === stage);
        if (stageMatches.length === 0) return null;

        return (
          <div key={stage} className="mb-12 last:mb-0">
            <h2 className="text-2xl font-black text-white mb-4 pb-2 border-b border-zinc-800">{stage}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stageMatches.map((match) => (
                <Link key={match.slug} href={`/matches/${match.slug}`} className="match-card block">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold">
                      {match.stage}{match.group ? ` · Group ${match.group}` : ''}
                    </p>
                    <span className="badge-blue text-xs">{match.kickoff_est} EST</span>
                  </div>

                  {/* Team A */}
                  <div className="flex items-center gap-2 mb-1">
                    {match.team_a.flag_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={match.team_a.flag_url}
                        alt={match.team_a.name}
                        width={24}
                        height={16}
                        className="rounded-sm object-cover shrink-0"
                        style={{ width: 24, height: "auto" }}
                      />
                    ) : (
                      <div className="w-6 h-4 bg-zinc-800 rounded-sm shrink-0"></div>
                    )}
                    <span className="text-base font-black text-white" style={{ letterSpacing: "-0.02em" }}>
                      {match.team_a.name}
                    </span>
                    {match.team_a.fifa_rank > 0 && (
                      <span className="ml-auto text-xs text-zinc-600">
                        #{match.team_a.fifa_rank}
                      </span>
                    )}
                  </div>

                  {/* VS divider */}
                  <p className="text-xs text-zinc-700 font-bold uppercase tracking-widest my-1 ml-8">
                    vs
                  </p>

                  {/* Team B */}
                  <div className="flex items-center gap-2 mb-3">
                    {match.team_b.flag_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={match.team_b.flag_url}
                        alt={match.team_b.name}
                        width={24}
                        height={16}
                        className="rounded-sm object-cover shrink-0"
                        style={{ width: 24, height: "auto" }}
                      />
                    ) : (
                      <div className="w-6 h-4 bg-zinc-800 rounded-sm shrink-0"></div>
                    )}
                    <span className="text-base font-black text-white" style={{ letterSpacing: "-0.02em" }}>
                      {match.team_b.name}
                    </span>
                    {match.team_b.fifa_rank > 0 && (
                      <span className="ml-auto text-xs text-zinc-600">
                        #{match.team_b.fifa_rank}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-zinc-400">
                    {new Date(match.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-zinc-500 mt-0.5">{match.city}</p>

                  {/* Best odds preview */}
                  {match.odds && match.odds.length > 0 && (
                    <div className="mt-3 flex gap-3 text-xs">
                      <span className="text-zinc-600">
                        <span className="font-bold" style={{ color: "#00FF87" }}>
                          {match.odds[0].team_a_win.toFixed(2)}
                        </span>{" "}
                        {match.team_a.code.toUpperCase()}
                      </span>
                      <span className="text-zinc-600">
                        <span className="font-bold text-zinc-400">
                          {match.odds[0].draw.toFixed(2)}
                        </span>{" "}
                        Draw
                      </span>
                      <span className="text-zinc-600">
                        <span className="font-bold text-blue-400">
                          {match.odds[0].team_b_win.toFixed(2)}
                        </span>{" "}
                        {match.team_b.code.toUpperCase()}
                      </span>
                    </div>
                  )}

                  <p className="mt-3 text-xs font-semibold" style={{ color: "#00FF87" }}>
                    Full preview & odds →
                  </p>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
