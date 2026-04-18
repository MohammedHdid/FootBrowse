"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import InjuryList from "@/components/InjuryList";
import AdSlot from "@/components/AdSlot";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TeamFixtureItem {
  fixture_id: number;
  slug: string;
  date: string;
  kickoff_utc: string;
  home_team: { slug: string; name: string; logo: string };
  away_team: { slug: string; name: string; logo: string };
  score: { home: number | null; away: number | null };
  stage: string | null;
}

export interface TeamPlayerItem {
  id: number;
  name: string;
  age: number;
  number: number | null;
  photo: string;
  slug: string | null;
}

export interface TeamPositionGroup {
  position: string;
  players: TeamPlayerItem[];
}

export interface TeamCoachCareerItem {
  team_name: string;
  team_logo: string | null;
  start: string | null;
  end: string | null;
}

export interface TeamInjuryItem {
  player_id: number;
  player_name: string;
  player_photo: string | null;
  type: string;
  reason: string | null;
  team_id: number;
  team_name: string;
  team_logo: string;
  team_slug: string;
  fixture_id: number;
  fixture_date: string;
}

export interface TeamPageData {
  teamSlug: string;
  teamName: string;
  teamLogo: string;
  teamFlag: string | null;
  teamColor: string | null;
  isWC: boolean;

  leagueSlug: string;
  leagueName: string;
  leagueLogo: string;
  season: string;

  coachName: string | null;
  coachPhoto: string | null;
  coachNat: string | null;
  coachAge: number | null;
  coachCareer: TeamCoachCareerItem[];

  formChars: string[];

  stats: {
    league_name: string;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    clean_sheets: number;
    failed_to_score: number;
  } | null;

  upcoming: TeamFixtureItem[];
  results: TeamFixtureItem[];

  positionGroups: TeamPositionGroup[];
  totalPlayers: number;

  venue: { name: string; city: string | null; capacity: number | null; image: string | null } | null;

  injuries: TeamInjuryItem[];

  wcInfo: {
    fifa_rank: number;
    wc_titles: number;
    wc_appearances: number;
    group: string | null;
    best_result: string | null;
    confederation: string;
    nickname: string | null;
  } | null;

  clubInfo: { founded: number | null; country: string | null } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const FORM_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  W: { bg: "rgba(0,255,135,0.12)",  color: "#00FF87", border: "rgba(0,255,135,0.3)" },
  D: { bg: "rgba(234,179,8,0.12)",  color: "#EAB308", border: "rgba(234,179,8,0.3)" },
  L: { bg: "rgba(239,68,68,0.12)",  color: "#EF4444", border: "rgba(239,68,68,0.3)" },
};

const POS_COLORS: Record<string, { color: string; bg: string; border: string; label: string }> = {
  Goalkeeper: { color: "#EAB308", bg: "rgba(234,179,8,0.12)",  border: "rgba(234,179,8,0.3)",  label: "GK"  },
  Defender:   { color: "#3B82F6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", label: "DEF" },
  Midfielder: { color: "#22C55E", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.3)",  label: "MID" },
  Forward:    { color: "#EF4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)",  label: "FWD" },
};

function posStyle(pos: string) {
  return POS_COLORS[pos] ?? {
    color: "#6B7280", bg: "rgba(107,114,128,0.12)",
    border: "rgba(107,114,128,0.3)", label: pos.slice(0, 3).toUpperCase(),
  };
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TABS = ["Overview", "Squad", "Fixtures", "Stats"] as const;
type Tab = (typeof TABS)[number];

// ── Component ─────────────────────────────────────────────────────────────────

export default function TeamPageClient({ data }: { data: TeamPageData }) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  return (
    <>
      {/* Sticky tab bar */}
      <div className="sticky top-14 z-40 overflow-x-auto" style={{ backgroundColor: "#0a0a0a", borderBottom: "1px solid rgba(39,39,42,0.7)" }}>
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                "shrink-0 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap",
                activeTab === tab
                  ? "text-white border-b-2"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]",
              ].join(" ")}
              style={activeTab === tab ? { borderBottomColor: "#00FF87" } : {}}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6 pt-6 pb-8">

        {/* ── OVERVIEW tab ── */}
        {activeTab === "Overview" && (
          <>
            <AdSlot slot="1234567890" format="auto" />

            {/* WC Tournament Stats */}
            {data.wcInfo && (
              <section>
                <h2 className="section-title text-xl mb-4">Tournament Profile</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  {[
                    { label: "FIFA Ranking",    value: `#${data.wcInfo.fifa_rank}` },
                    { label: "WC Titles",       value: data.wcInfo.wc_titles, color: data.wcInfo.wc_titles > 0 ? "#00FF87" : undefined },
                    { label: "WC Appearances",  value: data.wcInfo.wc_appearances },
                    { label: "Group",           value: data.wcInfo.group ?? "—", color: "#00FF87" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="stat-card">
                      <p className="stat-label">{label}</p>
                      <p className="stat-value" style={color ? { color } : {}}>{value}</p>
                    </div>
                  ))}
                </div>
                {data.wcInfo.best_result && (
                  <div className="rounded-xl px-4 py-3 flex items-center gap-3"
                    style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <span className="text-lg">🏆</span>
                    <div>
                      <p className="text-xs text-zinc-600 uppercase tracking-widest font-semibold">Best World Cup Result</p>
                      <p className="text-sm font-bold text-white mt-0.5">{data.wcInfo.best_result}</p>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Form */}
            {data.formChars.length > 0 && (
              <section className="section-block">
                <p className="stat-label mb-2">Recent Form (last {data.formChars.length})</p>
                <div className="flex gap-1.5 flex-wrap">
                  {data.formChars.map((r, i) => {
                    const s = FORM_STYLE[r] ?? FORM_STYLE["D"];
                    return (
                      <span key={i} className="w-7 h-7 flex items-center justify-center rounded text-xs font-black"
                        style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                        {r}
                      </span>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Coach */}
            {data.coachName && data.coachName !== "Unknown" && (
              <section className="section-block">
                <h2 className="section-title text-xl mb-4">Manager</h2>
                <div className="flex items-start gap-4">
                  {data.coachPhoto && (
                    <div className="shrink-0 rounded-xl overflow-hidden"
                      style={{ width: 72, height: 72, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <Image src={data.coachPhoto} alt={data.coachName} width={72} height={72}
                        className="w-full h-full object-cover object-top" unoptimized />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white" style={{ letterSpacing: "-0.02em" }}>{data.coachName}</p>
                    {data.coachNat && <p className="text-sm text-zinc-400 mt-0.5">{data.coachNat}</p>}
                    {data.coachAge && <p className="text-xs text-zinc-600 mt-0.5">Age {data.coachAge}</p>}
                    {data.coachCareer.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-2">Previous Clubs</p>
                        <div className="flex flex-wrap gap-2">
                          {data.coachCareer.slice(0, 6).map((c, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs text-zinc-400 px-2 py-1 rounded-lg"
                              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                              {c.team_logo && <Image src={c.team_logo} alt={c.team_name} width={14} height={14} className="object-contain" unoptimized />}
                              <span>{c.team_name}</span>
                              {c.start && (
                                <span className="text-zinc-600">
                                  {new Date(c.start).getFullYear()}{c.end ? `–${new Date(c.end).getFullYear()}` : "–"}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Injuries */}
            {data.injuries.length > 0 && (
              <section className="section-block">
                <h2 className="section-title text-xl mb-4">
                  Injury Report
                  <span className="ml-2 align-middle text-[10px] font-black px-1.5 py-0.5 rounded"
                    style={{ color: "#EF4444", backgroundColor: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    {data.injuries.length}
                  </span>
                </h2>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <InjuryList injuries={data.injuries as any} />
              </section>
            )}

            {/* Venue */}
            {data.venue?.name && (
              <section className="section-block">
                <h2 className="section-title text-xl mb-4">Stadium</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  {data.venue.image && (
                    <div className="shrink-0 rounded-xl overflow-hidden" style={{ width: "100%", maxWidth: 280 }}>
                      <Image src={data.venue.image} alt={data.venue.name} width={280} height={160}
                        className="w-full object-cover" style={{ aspectRatio: "16/9" }} unoptimized />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white" style={{ letterSpacing: "-0.02em" }}>{data.venue.name}</p>
                    {data.venue.city && <p className="text-sm text-zinc-400 mt-1">{data.venue.city}</p>}
                    {data.venue.capacity && (
                      <p className="text-xs text-zinc-500 mt-1">
                        Capacity: <span className="font-bold text-zinc-300">{data.venue.capacity.toLocaleString()}</span>
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* ── SQUAD tab ── */}
        {activeTab === "Squad" && (
          <section>
            <h2 className="section-title text-xl mb-4">Squad{data.totalPlayers > 0 && ` — ${data.totalPlayers} Players`}</h2>
            <div className="space-y-6">
              {data.positionGroups.map(({ position, players }) => {
                const ps = posStyle(position);
                return (
                  <div key={position}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-black px-2 py-0.5 rounded"
                        style={{ backgroundColor: ps.bg, color: ps.color, border: `1px solid ${ps.border}` }}>
                        {ps.label}
                      </span>
                      <span className="text-xs text-zinc-600 font-bold uppercase tracking-widest">{position}s</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {players.map((p) => {
                        const card = (
                          <div className="entity-card flex items-center gap-3 h-full">
                            <div className="shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
                              style={{ width: 40, height: 48, backgroundColor: ps.bg, border: `1px solid ${ps.border}` }}>
                              {p.photo ? (
                                <Image src={p.photo} alt={p.name} width={40} height={48}
                                  className="w-full h-full object-cover object-top" unoptimized />
                              ) : (
                                <span className="text-sm font-black tabular-nums" style={{ color: ps.color }}>
                                  {p.number ?? "?"}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{p.name}</p>
                              <p className="text-[10px] text-zinc-600 tabular-nums mt-0.5">
                                {p.number ? `#${p.number}` : "—"}{p.age ? ` · ${p.age}y` : ""}
                              </p>
                            </div>
                          </div>
                        );
                        return p.slug ? (
                          <Link key={p.id} href={`/players/${p.slug}`}>{card}</Link>
                        ) : (
                          <div key={p.id}>{card}</div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── FIXTURES tab ── */}
        {activeTab === "Fixtures" && (
          <>
            {data.upcoming.length > 0 && (
              <section>
                <h2 className="section-title text-xl mb-4">Next Fixtures</h2>
                <div className="space-y-2">
                  {data.upcoming.map((f) => {
                    const isHome = f.home_team.slug === data.teamSlug;
                    const opp = isHome ? f.away_team : f.home_team;
                    return (
                      <Link key={f.fixture_id} href={`/leagues/${data.leagueSlug}/matches/${f.slug}`}
                        className="entity-card flex items-center gap-3 group">
                        <span className="text-xs text-zinc-500 w-16 shrink-0">{fmtDate(f.date)}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 shrink-0">
                          {isHome ? "H" : "A"}
                        </span>
                        <Image src={opp.logo} alt={opp.name} width={20} height={20} className="object-contain shrink-0" unoptimized />
                        <span className="font-semibold text-sm text-zinc-200 truncate">{opp.name}</span>
                        <span className="ml-auto text-xs text-zinc-600 shrink-0 group-hover:text-zinc-400 transition-colors">
                          {f.stage} →
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {data.results.length > 0 && (
              <section>
                <h2 className="section-title text-xl mb-4">Recent Results</h2>
                <div className="space-y-2">
                  {data.results.map((f) => {
                    const isHome  = f.home_team.slug === data.teamSlug;
                    const opp     = isHome ? f.away_team : f.home_team;
                    const myG     = isHome ? f.score.home : f.score.away;
                    const oppG    = isHome ? f.score.away : f.score.home;
                    const outcome = myG === null || oppG === null ? "—" : myG > oppG ? "W" : myG < oppG ? "L" : "D";
                    const outcomeColor = outcome === "W" ? "#00FF87" : outcome === "L" ? "#EF4444" : "#EAB308";
                    return (
                      <Link key={f.fixture_id} href={`/leagues/${data.leagueSlug}/matches/${f.slug}`}
                        className="entity-card flex items-center gap-3 group">
                        <span className="text-xs text-zinc-500 w-16 shrink-0">{fmtDate(f.date)}</span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded shrink-0"
                          style={{ color: outcomeColor, backgroundColor: `${outcomeColor}15`, border: `1px solid ${outcomeColor}30` }}>
                          {outcome}
                        </span>
                        <Image src={opp.logo} alt={opp.name} width={20} height={20} className="object-contain shrink-0" unoptimized />
                        <span className="font-semibold text-sm text-zinc-200 truncate">{opp.name}</span>
                        <span className="ml-auto text-xs font-bold tabular-nums text-white shrink-0">
                          {isHome ? `${myG ?? "—"} – ${oppG ?? "—"}` : `${oppG ?? "—"} – ${myG ?? "—"}`}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {data.upcoming.length === 0 && data.results.length === 0 && (
              <div className="section-block py-10 text-center">
                <p className="text-zinc-500 text-sm">No fixtures available.</p>
              </div>
            )}
          </>
        )}

        {/* ── STATS tab ── */}
        {activeTab === "Stats" && (
          <>
            {data.stats ? (
              <section>
                <h2 className="section-title text-xl mb-4">
                  League Performance
                  <span className="badge-blue ml-2 align-middle" style={{ fontSize: 11 }}>{data.stats.league_name}</span>
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                  {[
                    { label: "Played", value: data.stats.played },
                    { label: "Won",    value: data.stats.wins,   color: "#00FF87" },
                    { label: "Drawn",  value: data.stats.draws,  color: "#EAB308" },
                    { label: "Lost",   value: data.stats.losses, color: "#EF4444" },
                    { label: "GF",     value: data.stats.goals_for },
                    { label: "GA",     value: data.stats.goals_against },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="stat-card text-center">
                      <p className="stat-label">{label}</p>
                      <p className="text-2xl font-black tabular-nums" style={{ color: color ?? "#fff" }}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl px-4 py-3 flex items-center justify-between"
                    style={{ backgroundColor: "rgba(0,255,135,0.04)", border: "1px solid rgba(0,255,135,0.12)" }}>
                    <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Clean Sheets</span>
                    <span className="text-xl font-black" style={{ color: "#00FF87" }}>{data.stats.clean_sheets}</span>
                  </div>
                  <div className="rounded-xl px-4 py-3 flex items-center justify-between"
                    style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Failed to Score</span>
                    <span className="text-xl font-black text-white">{data.stats.failed_to_score}</span>
                  </div>
                </div>
              </section>
            ) : (
              <div className="section-block py-10 text-center">
                <p className="text-zinc-500 text-sm">Stats not available for this team.</p>
              </div>
            )}
          </>
        )}

      </div>
    </>
  );
}
