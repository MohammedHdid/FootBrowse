import type { Metadata } from "next";
import Link from "next/link";
import { teams, getTeamMatches } from "@/lib/data";

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
        {teams.map((team) => {
          const nextMatches = getTeamMatches(team.slug).slice(0, 2);
          return (
            <div
              key={team.slug}
              className="entity-card flex flex-col"
              style={{ padding: 0, overflow: "hidden" }}
            >
              {/* ── Team info (clickable to team page) ── */}
              <Link href={`/teams/${team.slug}`} className="block p-4 hover:bg-white/[0.02] transition-colors">
                {/* Color accent bar */}
                <div
                  className="h-0.5 w-full rounded-full mb-3"
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

                <div className="grid grid-cols-2 gap-3">
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

              {/* ── Next matches ── */}
              {nextMatches.length > 0 && (
                <div
                  className="border-t"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold px-4 pt-3 pb-1">
                    Next Matches
                  </p>
                  {nextMatches.map((m) => (
                    <Link
                      key={m.slug}
                      href={`/matches/${m.slug}`}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-white/[0.03] transition-colors group"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      {/* Team A */}
                      <div className="flex items-center gap-1 flex-1 min-w-0 justify-end">
                        <span className="text-xs font-bold text-white truncate text-right">
                          {m.team_a.name}
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.team_a.flag_url}
                          alt={m.team_a.name}
                          width={18}
                          height={12}
                          className="rounded-sm object-cover shrink-0"
                          style={{ width: 18, height: "auto" }}
                        />
                      </div>

                      {/* Centre */}
                      <div className="flex flex-col items-center shrink-0 w-14">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          {new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <span
                          className="text-[10px] font-black mt-0.5"
                          style={{ color: "#00FF87", letterSpacing: "0.05em" }}
                        >
                          VS
                        </span>
                        <span className="text-[9px] text-zinc-600 truncate max-w-full">{m.city}</span>
                      </div>

                      {/* Team B */}
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.team_b.flag_url}
                          alt={m.team_b.name}
                          width={18}
                          height={12}
                          className="rounded-sm object-cover shrink-0"
                          style={{ width: 18, height: "auto" }}
                        />
                        <span className="text-xs font-bold text-white truncate">
                          {m.team_b.name}
                        </span>
                      </div>

                      {/* Arrow */}
                      <span
                        className="text-[10px] font-bold shrink-0 opacity-30 group-hover:opacity-100 transition-opacity"
                        style={{ color: "#00FF87" }}
                      >
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
