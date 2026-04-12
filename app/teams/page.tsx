import type { Metadata } from "next";
import Link from "next/link";
import { teams } from "@/lib/data";

export const metadata: Metadata = {
  title: "World Cup 2026 Teams — Squads, Stats & Odds | FootBrowse",
  description:
    "Explore all FIFA World Cup 2026 team profiles — rankings, squads, coaches, form and match schedules on FootBrowse.",
};

const FORM_STYLE: Record<string, { color: string }> = {
  W: { color: "#00FF87" },
  D: { color: "#F59E0B" },
  L: { color: "#EF4444" },
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
            {/* Color accent bar */}
            <div
              className="h-0.5 w-full rounded-full mb-3 -mt-1"
              style={{ backgroundColor: team.color_primary }}
            />

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={team.flag_url}
                  alt={`${team.name} flag`}
                  width={28}
                  height={18}
                  className="rounded-sm object-cover shrink-0"
                  style={{ width: 28, height: "auto" }}
                />
                <span
                  className="font-black text-white text-base truncate"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {team.name}
                </span>
              </div>
              <span className="tag shrink-0 ml-2">{team.code.toUpperCase()}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <p className="stat-label">FIFA Rank</p>
                <p className="text-sm font-bold text-white mt-0.5">#{team.fifa_rank}</p>
              </div>
              <div>
                <p className="stat-label">WC Titles</p>
                <p
                  className="text-sm font-bold mt-0.5"
                  style={{ color: team.wc_titles > 0 ? "#00FF87" : "white" }}
                >
                  {team.wc_titles}
                </p>
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

            {/* Form */}
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mr-0.5">
                Form
              </span>
              {team.form.map((r, i) => {
                const style = FORM_STYLE[r] ?? FORM_STYLE["D"];
                return (
                  <span
                    key={i}
                    className="w-5 h-5 rounded text-[10px] font-black flex items-center justify-center"
                    style={{
                      backgroundColor: `${style.color}15`,
                      color: style.color,
                      border: `1px solid ${style.color}40`,
                    }}
                  >
                    {r}
                  </span>
                );
              })}
            </div>

            <p className="mt-3 text-xs text-zinc-600">Coach: {team.coach}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
