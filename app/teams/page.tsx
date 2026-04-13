import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
                  className="h-1 w-full"
                  style={{
                    background: `linear-gradient(to right, ${team.color_primary}, ${team.color_primary}22)`,
                  }}
                />

                <div className="p-4">
                  {/* Badge & Name Section */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3 min-w-0">
                      {team.badge_url ? (
                        <div className="shrink-0 w-12 h-12 flex items-center justify-center p-1 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                          <Image
                            src={team.badge_url}
                            alt={`${team.name} badge`}
                            width={40}
                            height={40}
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <Image
                          src={team.flag_url}
                          alt={`${team.name} flag`}
                          width={40}
                          height={26}
                          className="rounded shadow-sm object-cover shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <span
                          className="block font-black text-white text-lg leading-tight truncate"
                          style={{ letterSpacing: "-0.03em" }}
                        >
                          {team.name}
                        </span>
                        {team.nickname && (
                          <span className="block text-[10px] text-zinc-500 font-bold italic truncate mt-0.5">
                            {team.nickname}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="tag shrink-0">{team.code.toUpperCase()}</span>
                  </div>

                  {/* Main Stats + Kit Preview */}
                  <div className="flex gap-4">
                    {/* Stats Grid */}
                    <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-3">
                      <div>
                        <p className="stat-label">FIFA Rank</p>
                        <p className="text-sm font-black text-white mt-0.5">#{team.fifa_rank}</p>
                      </div>
                      <div>
                        <p className="stat-label">WC Titles</p>
                        <p
                          className="text-sm font-black mt-0.5"
                          style={{ color: team.wc_titles > 0 ? "#00FF87" : "white" }}
                        >
                          {team.wc_titles}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="stat-label">Group</p>
                        <p className="text-sm font-black mt-0.5" style={{ color: "#00FF87" }}>
                          Group {team.group}
                        </p>
                      </div>
                    </div>

                    {/* Kit Preview */}
                    {team.kit_url && (
                      <div className="shrink-0 w-16 h-20 relative flex items-center justify-center bg-zinc-900/50 rounded-lg border border-white/[0.05] overflow-hidden group">
                        <Image
                          src={team.kit_url}
                          alt={`${team.name} kit`}
                          width={60}
                          height={80}
                          className="object-contain relative z-10 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                        />
                        {/* Subtle glow behind kit */}
                        <div
                          className="absolute inset-0 opacity-20"
                          style={{ backgroundColor: team.color_primary }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Form */}
                  <div className="mt-5 pt-4 border-t border-white/[0.05] flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-black mr-1">
                        Form
                      </span>
                      {(team.form || []).map((r, i) => {
                        const style = FORM_STYLE[r] ?? FORM_STYLE["D"];
                        return (
                          <span
                            key={i}
                            className="w-4 h-4 rounded-sm text-[8px] font-black flex items-center justify-center"
                            style={{
                              backgroundColor: `${style.color}15`,
                              color: style.color,
                              border: `1px solid ${style.color}30`,
                            }}
                          >
                            {r}
                          </span>
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-bold">
                      {team.confederation}
                    </span>
                  </div>
                </div>
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
                        <Image
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
                        <Image
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
