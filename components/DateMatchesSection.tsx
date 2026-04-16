"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { DayFixtures } from "@/lib/date-fixtures";

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

  const selectedIdx = days.findIndex((d) => d.date === selectedDate);
  const selectedDay = days[selectedIdx] ?? null;
  const totalMatches =
    selectedDay?.leagues.reduce((n, g) => n + g.fixtures.length, 0) ?? 0;

  // Visible window: 5 date pills centred on the selected day
  const VISIBLE = 5;
  const half = Math.floor(VISIBLE / 2);
  const startIdx = Math.max(
    0,
    Math.min(selectedIdx - half, days.length - VISIBLE)
  );
  const visibleDays = days.slice(startIdx, startIdx + VISIBLE);

  function prev() {
    if (selectedIdx > 0) setSelectedDate(days[selectedIdx - 1].date);
  }
  function next() {
    if (selectedIdx < days.length - 1) setSelectedDate(days[selectedIdx + 1].date);
  }

  return (
    <section>
      {/* Header */}
      <div className="section-row mb-3">
        <h2 className="section-title text-xl">
          Matches
          {totalMatches > 0 && (
            <span
              className="ml-2 text-[9px] font-black px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(0,255,135,0.15)", color: "#00FF87" }}
            >
              {totalMatches}
            </span>
          )}
        </h2>
        <Link href="/leagues" className="arrow-link text-[11px]">
          All leagues →
        </Link>
      </div>

      {/* Date strip */}
      <div className="flex items-center gap-1.5 mb-5">
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
          <span className="text-sm font-bold text-zinc-300 leading-none">‹</span>
        </button>

        {/* Date pills */}
        <div className="flex gap-1.5 flex-1">
          {visibleDays.map((day) => {
            const isToday = day.date === todayStr;
            const isSelected = day.date === selectedDate;
            const hasMatches = day.leagues.some((l) => l.fixtures.length > 0);
            const dateObj = new Date(day.date + "T00:00:00");
            return (
              <button
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                className="flex-1 flex flex-col items-center py-2 px-1 rounded-xl transition-all"
                style={
                  isSelected
                    ? { backgroundColor: "#00FF87", color: "#0a0a0a" }
                    : {
                        backgroundColor: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "#a1a1aa",
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
          <span className="text-sm font-bold text-zinc-300 leading-none">›</span>
        </button>
      </div>

      {/* Match list */}
      {!selectedDay || selectedDay.leagues.length === 0 ? (
        <div
          className="text-center py-10 rounded-xl"
          style={{
            backgroundColor: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p className="text-zinc-400 text-sm font-bold">No matches on this date.</p>
          <p className="text-zinc-600 text-xs mt-1">
            Try another day or browse fixtures by league.
          </p>
          <Link
            href="/leagues"
            className="arrow-link text-xs mt-4 inline-block"
          >
            Browse all leagues →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {selectedDay.leagues.map((group) => (
            <div key={group.leagueSlug}>
              {/* League header row */}
              <div className="flex items-center gap-2 mb-2">
                <Image
                  src={group.leagueLogo}
                  alt={group.leagueName}
                  width={18}
                  height={18}
                  className="object-contain shrink-0"
                  unoptimized
                />
                <span className="text-xs font-bold text-zinc-300">
                  {group.leagueName}
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ backgroundColor: "rgba(39,39,42,0.6)" }}
                />
                <Link
                  href={`/leagues/${group.leagueSlug}/matches`}
                  className="text-[10px] font-bold"
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
                  return (
                    <Link
                      key={f.fixture_id}
                      href={`/leagues/${group.leagueSlug}/matches/${f.slug}`}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 border hover:border-white/20 transition-colors"
                      style={{
                        backgroundColor: "rgba(24,24,27,0.8)",
                        borderColor: live
                          ? "rgba(0,255,135,0.25)"
                          : "rgba(39,39,42,0.8)",
                      }}
                    >
                      {/* Status / kickoff */}
                      <div className="shrink-0 w-12 text-center">
                        {live ? (
                          <span className="status-pill text-[9px]">LIVE</span>
                        ) : finished ? (
                          <span
                            className="text-[10px] font-bold"
                            style={{ color: "#00FF87" }}
                          >
                            {STATUS_LABEL[f.status] ?? f.status}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-zinc-400">
                            {f.kickoff_utc}
                          </span>
                        )}
                      </div>

                      {/* Home */}
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-xs font-bold text-white truncate text-right">
                          {f.home_team.name}
                        </span>
                        <Image
                          src={f.home_team.logo}
                          alt={f.home_team.name}
                          width={20}
                          height={20}
                          className="object-contain shrink-0"
                          unoptimized
                        />
                      </div>

                      {/* Score / VS */}
                      <div className="shrink-0 w-14 text-center">
                        {finished || live ? (
                          <span
                            className="text-sm font-black text-white tabular-nums"
                            style={{ letterSpacing: "0.05em" }}
                          >
                            {f.score.home ?? 0} — {f.score.away ?? 0}
                          </span>
                        ) : (
                          <span
                            className="text-xs font-black"
                            style={{ color: "#00FF87", letterSpacing: "0.1em" }}
                          >
                            VS
                          </span>
                        )}
                      </div>

                      {/* Away */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Image
                          src={f.away_team.logo}
                          alt={f.away_team.name}
                          width={20}
                          height={20}
                          className="object-contain shrink-0"
                          unoptimized
                        />
                        <span className="text-xs font-bold text-white truncate">
                          {f.away_team.name}
                        </span>
                      </div>
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
