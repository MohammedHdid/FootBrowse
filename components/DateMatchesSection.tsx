"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { DayFixtures } from "@/lib/date-fixtures";

type MatchFilter = "all" | "live" | "upcoming" | "finished";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  FT: "FT", AET: "AET", PEN: "Pens",
  "1H": "Live", "2H": "Live", HT: "HT", ET: "ET", NS: "—",
};

function isLive(s: string) {
  return ["1H", "2H", "HT", "ET", "BT", "P", "LIVE"].includes(s);
}
function isFinished(s: string) {
  return ["FT", "AET", "PEN"].includes(s);
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  days: DayFixtures[];
  todayStr: string; // YYYY-MM-DD
}

export default function DateMatchesSection({ days, todayStr }: Props) {
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [filter, setFilter] = useState<MatchFilter>("all");

  const selectedIdx = days.findIndex((d) => d.date === selectedDate);
  const selectedDay = days[selectedIdx] ?? null;

  const filteredLeagues = selectedDay?.leagues.map(group => {
    const fixtures = group.fixtures.filter(f => {
      const live = isLive(f.status);
      const finished = isFinished(f.status);
      const upcoming = !live && !finished;
      if (filter === "live") return live;
      if (filter === "upcoming") return upcoming;
      if (filter === "finished") return finished;
      return true;
    });
    return { ...group, fixtures };
  }).filter(group => group.fixtures.length > 0) ?? [];

  const totalFilteredMatches = filteredLeagues.reduce((n, g) => n + g.fixtures.length, 0);

  function prev() {
    if (selectedIdx > 0) {
      const newDate = days[selectedIdx - 1].date;
      setSelectedDate(newDate);
      document.getElementById(`date-pill-${newDate}`)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }
  function next() {
    if (selectedIdx < days.length - 1) {
      const newDate = days[selectedIdx + 1].date;
      setSelectedDate(newDate);
      document.getElementById(`date-pill-${newDate}`)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }

  return (
    <section className="pt-6">
      {/* Header */}
      <div className="section-row mb-3">
        <h2 className="section-title text-xl">
          Matches
          {totalFilteredMatches > 0 && (
            <span
              className="ml-2 bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-700"
            >
              {totalFilteredMatches}
            </span>
          )}
        </h2>
        <Link href="/leagues" className="arrow-link text-[11px]">
          All leagues →
        </Link>
      </div>

      {/* Date strip */}
      <div className="flex items-center gap-1.5 mb-5 w-full">
        {/* Prev arrow */}
        <button
          onClick={prev}
          disabled={selectedIdx === 0}
          aria-label="Previous day"
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span className="text-sm font-bold text-slate-300 leading-none">‹</span>
        </button>

        {/* Date pills */}
        <div className="flex gap-1.5 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x scroll-smooth">
          {days.map((day) => {
            const isToday = day.date === todayStr;
            const isSelected = day.date === selectedDate;
            const hasMatches = day.leagues.some((l) => l.fixtures.length > 0);
            const dateObj = new Date(day.date + "T00:00:00");
            return (
              <button
                key={day.date}
                id={`date-pill-${day.date}`}
                onClick={() => {
                  setSelectedDate(day.date);
                  document.getElementById(`date-pill-${day.date}`)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                }}
                className="snap-center flex flex-col items-center justify-center shrink-0 w-12 h-14 sm:w-14 sm:h-16 rounded-xl transition-all"
                style={
                  isSelected
                    ? { backgroundColor: "#00FF87", color: "#0a0a0a" }
                    : {
                        backgroundColor: "rgba(255,255,255,0.03)",
                        border: "1px solid #334155",
                        color: "#94a3b8",
                      }
                }
              >
                <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                  {isToday
                    ? "TODAY"
                    : dateObj
                        .toLocaleDateString("en-US", { weekday: "short" })
                        .toUpperCase()}
                </span>
                <span
                  className="text-base font-black tabular-nums mt-0.5 leading-none"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {dateObj.getDate()}
                </span>
                {/* Dot indicator for days with matches */}
                <span
                  className="w-1 h-1 rounded-full mt-1.5"
                  style={{
                    backgroundColor: hasMatches
                      ? isSelected
                        ? "rgba(10,10,10,0.4)"
                        : "#00FF87"
                      : "transparent",
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Next arrow */}
        <button
          onClick={next}
          disabled={selectedIdx === days.length - 1}
          aria-label="Next day"
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span className="text-sm font-bold text-slate-300 leading-none">›</span>
        </button>
      </div>

      {/* Filters */}
      {selectedDay && selectedDay.leagues.length > 0 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { id: "all", label: "All" },
            { id: "live", label: "Live", liveDot: true },
            { id: "upcoming", label: "Upcoming" },
            { id: "finished", label: "Finished" }
          ].map((f) => {
            const isSelected = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as MatchFilter)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  isSelected 
                    ? "bg-slate-200 text-slate-900 border border-transparent" 
                    : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800"
                }`}
              >
                {f.liveDot && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-red-500 animate-pulse" : "bg-red-500/50"}`} />
                )}
                {f.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Match list */}
      {(!selectedDay || selectedDay.leagues.length === 0) ? (
        <div
          className="text-center py-10 rounded-xl"
          style={{
            backgroundColor: "rgba(255,255,255,0.02)",
            border: "1px solid #334155",
          }}
        >
          <p className="text-slate-400 text-sm font-bold">No matches on this date.</p>
          <p className="text-slate-600 text-xs mt-1">
            Try another day or browse fixtures by league.
          </p>
          <Link
            href="/leagues"
            className="arrow-link text-xs mt-4 inline-block"
          >
            Browse all leagues →
          </Link>
        </div>
      ) : filteredLeagues.length === 0 ? (
        <div
          className="text-center py-10 rounded-xl"
          style={{
            backgroundColor: "rgba(255,255,255,0.02)",
            border: "1px solid #334155",
          }}
        >
          <p className="text-slate-400 text-sm font-bold">No {filter} matches found.</p>
          <button
            onClick={() => setFilter("all")}
            className="text-xs text-blue-400 mt-2 font-semibold hover:underline"
          >
            Clear filter
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLeagues.map((group) => (
            <div key={group.leagueSlug}>
              {/* League header row */}
              <div className="flex items-center gap-2 mb-3">
                <Link
                  href={`/leagues/${group.leagueSlug}`}
                  className="flex items-center gap-2 group min-w-0"
                >
                  <div className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg bg-slate-50 shadow-inner p-0.5">
                    <Image
                      src={group.leagueLogo}
                      alt={group.leagueName}
                      width={18}
                      height={18}
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors truncate">
                    {group.leagueName}
                  </span>
                </Link>
                <div
                  className="flex-1 h-px"
                  style={{ backgroundColor: "#334155" }}
                />
                <Link
                  href={`/leagues/${group.leagueSlug}/matches`}
                  className="text-[10px] font-bold shrink-0"
                  style={{ color: "#00FF87" }}
                >
                  All fixtures →
                </Link>
              </div>

              {/* Fixture rows */}
              <div className="space-y-1.5">
                {group.fixtures.map((f) => {
                  const live = isLive(f.status);
                  const finished = isFinished(f.status);
                  const homeWon = finished && (f.score.home ?? 0) > (f.score.away ?? 0);
                  const awayWon = finished && (f.score.away ?? 0) > (f.score.home ?? 0);
                  return (
                    <Link
                      key={f.fixture_id}
                      href={`/leagues/${group.leagueSlug}/matches/${f.slug}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
                      style={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderLeft: live ? "3px solid #EF4444" : finished ? "3px solid #475569" : "3px solid #3B82F6",
                      }}
                    >
                      {/* Left: status / time */}
                      <div className="shrink-0 w-14 flex flex-col items-center justify-center gap-1.5 py-1">
                        <span className="text-[10px] font-bold text-zinc-500 tabular-nums">
                          {f.kickoff_utc}
                        </span>

                        {live ? (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 scale-90">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[8px] font-black tracking-wider text-red-500 uppercase">LIVE</span>
                          </div>
                        ) : finished ? (
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter bg-slate-800 px-1 rounded">
                            {STATUS_LABEL[f.status] ?? f.status}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                            —
                          </span>
                        )}
                      </div>

                      {/* Center: home + away rows */}
                      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                        {/* Home */}
                        <div className="flex items-center gap-2">
                          <Image src={f.home_team.logo} alt={f.home_team.name}
                            width={16} height={16} className="object-contain shrink-0" unoptimized />
                          <span className={`text-xs truncate flex-1 ${homeWon ? "font-bold text-white" : "font-medium text-slate-300"}`}>
                            {f.home_team.name}
                          </span>
                          <span className={`text-sm font-black tabular-nums shrink-0 ml-2 ${live ? "text-red-400" : homeWon ? "text-white" : finished ? "text-slate-400" : "text-slate-600"}`}>
                            {finished || live ? (f.score.home ?? 0) : "—"}
                          </span>
                        </div>
                        {/* Away */}
                        <div className="flex items-center gap-2">
                          <Image src={f.away_team.logo} alt={f.away_team.name}
                            width={16} height={16} className="object-contain shrink-0" unoptimized />
                          <span className={`text-xs truncate flex-1 ${awayWon ? "font-bold text-white" : "font-medium text-slate-300"}`}>
                            {f.away_team.name}
                          </span>
                          <span className={`text-sm font-black tabular-nums shrink-0 ml-2 ${live ? "text-red-400" : awayWon ? "text-white" : finished ? "text-slate-400" : "text-slate-600"}`}>
                            {finished || live ? (f.score.away ?? 0) : "—"}
                          </span>
                        </div>
                      </div>

                      {/* Right: chevron */}
                      <span className="shrink-0 text-slate-600 text-xs font-bold">›</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
