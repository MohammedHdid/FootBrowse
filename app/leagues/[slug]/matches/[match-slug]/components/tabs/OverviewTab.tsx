"use client";
import Image from "next/image";
import InjuryList from "@/components/InjuryList";
import MatchFixedBottom from "../MatchFixedBottom";
import type { MatchPageData } from "../../MatchPageClient";

function zoneColor(description: string | null): string | null {
  if (!description) return null;
  const d = description.toLowerCase();
  if (d.includes("champions league") || d.includes("promotion") || d.includes("next round") || d.includes("qualified")) return "#00FF87";
  if (d.includes("europa league") || d.includes("conference")) return "#3B82F6";
  if (d.includes("relegation") || d.includes("relegated")) return "#EF4444";
  return null;
}

export default function OverviewTab({ data }: { data: MatchPageData }) {
  // ── Finished / Live ──────────────────────────────────────────────────────────
  if (data.finished || data.live) {
    const goalEvents    = data.events.filter((e) => e.type === "Goal");
    const homeGoals     = goalEvents.filter((e) => e.team_id === data.homeTeamId);
    const awayGoals     = goalEvents.filter((e) => e.team_id !== data.homeTeamId);
    const yellowCards   = data.events.filter((e) => e.type === "Card" && e.detail === "Yellow Card");
    const redCards      = data.events.filter((e) => e.type === "Card" && (e.detail === "Red Card" || e.detail === "Yellow-Red Card"));
    const substitutions = data.events.filter((e) => e.type === "subst");
    const hasSummary    = homeGoals.length > 0 || awayGoals.length > 0 || yellowCards.length > 0 || redCards.length > 0;
    const hasCards      = yellowCards.length > 0 || redCards.length > 0 || substitutions.length > 0;

    return (
      <div className="space-y-6">
        {hasSummary ? (
          <section className="section-block">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">Match Summary</h2>
            {(homeGoals.length > 0 || awayGoals.length > 0) && (
              <div
                className={`grid grid-cols-2 gap-4 ${hasCards ? "mb-4 pb-4" : ""}`}
                style={hasCards ? { borderBottom: "1px solid rgba(255,255,255,0.05)" } : {}}>
                <div className="space-y-2.5">
                  {homeGoals.map((e, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-sm leading-none mt-0.5">⚽</span>
                      <div>
                        <p className="text-sm font-semibold text-zinc-200 leading-tight">{e.player}</p>
                        <p className="text-[11px] text-zinc-600 tabular-nums">
                          {e.minute}{e.extra ? `+${e.extra}` : ""}&apos;
                          {e.assist && <span className="ml-1 text-zinc-500">· {e.assist}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2.5 text-right">
                  {awayGoals.map((e, i) => (
                    <div key={i} className="flex items-start gap-2 flex-row-reverse">
                      <span className="text-sm leading-none mt-0.5">⚽</span>
                      <div>
                        <p className="text-sm font-semibold text-zinc-200 leading-tight">{e.player}</p>
                        <p className="text-[11px] text-zinc-600 tabular-nums">
                          {e.minute}{e.extra ? `+${e.extra}` : ""}&apos;
                          {e.assist && <span className="mr-1 text-zinc-500">{e.assist} ·</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {hasCards && (
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {yellowCards.length > 0 && (
                  <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <span className="inline-block w-2.5 h-3.5 rounded-[2px]" style={{ backgroundColor: "#EAB308", opacity: 0.85 }} />
                    {yellowCards.length} yellow {yellowCards.length === 1 ? "card" : "cards"}
                  </span>
                )}
                {redCards.length > 0 && (
                  <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <span className="inline-block w-2.5 h-3.5 rounded-[2px]" style={{ backgroundColor: "#EF4444", opacity: 0.85 }} />
                    {redCards.length} red {redCards.length === 1 ? "card" : "cards"}
                  </span>
                )}
                {substitutions.length > 0 && (
                  <span className="text-xs text-zinc-500">🔄 {substitutions.length} substitutions</span>
                )}
              </div>
            )}
          </section>
        ) : (
          <div className="section-block py-8 text-center">
            <p className="text-zinc-600 text-sm">No match summary available yet.</p>
          </div>
        )}
        <MatchFixedBottom data={data} />
      </div>
    );
  }

  // ── Preview / Upcoming ───────────────────────────────────────────────────────
  const isClub = !data.isWC && !data.isNational;

  return (
    <div className="space-y-6">
      {/* WC preview text */}
      {data.wcPreview && (
        <section className="section-block">
          <h2 className="section-title text-xl mb-4">Match Preview</h2>
          <p className="text-zinc-300 leading-relaxed text-sm">{data.wcPreview}</p>
        </section>
      )}

      {/* Standings snippet — club league only */}
      {isClub && data.homeStandingRow && data.awayStandingRow && (
        <section className="section-block">
          <h2 className="section-title text-xl mb-3">League Table</h2>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
            {/* Header */}
            <div className="grid px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-600"
              style={{ gridTemplateColumns: "24px 1fr 28px 28px 28px 28px 36px 36px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span>Pos</span>
              <span>Club</span>
              <span className="text-center">P</span>
              <span className="text-center">W</span>
              <span className="text-center">D</span>
              <span className="text-center">L</span>
              <span className="text-center">GD</span>
              <span className="text-center">Pts</span>
            </div>
            {/* Rows — sorted by league rank so highest position (lower number) is first */}
            {[
              { row: data.homeStandingRow, name: data.homeName, logo: data.homeLogo },
              { row: data.awayStandingRow, name: data.awayName, logo: data.awayLogo },
            ].sort((a, b) => a.row!.rank - b.row!.rank).map(({ row, name, logo }, idx) => {
              const rankColor = zoneColor(row.description);
              return (
                <div key={name}
                  className="grid px-3 py-2.5 items-center"
                  style={{
                    gridTemplateColumns: "24px 1fr 28px 28px 28px 28px 36px 36px",
                    borderBottom: idx === 0 ? "1px solid rgba(255,255,255,0.05)" : undefined,
                    backgroundColor: idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                  }}>
                  <span className="text-xs font-black" style={{ color: rankColor ?? "#52525b" }}>
                    {row.rank}
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <Image src={logo} alt={name} width={16} height={16} className="object-contain shrink-0" unoptimized />
                    <span className="text-xs font-bold text-zinc-200 truncate">{name}</span>
                  </div>
                  <span className="text-center text-xs text-zinc-400 tabular-nums">{row.played}</span>
                  <span className="text-center text-xs text-zinc-400 tabular-nums">{row.won}</span>
                  <span className="text-center text-xs text-zinc-400 tabular-nums">{row.drawn}</span>
                  <span className="text-center text-xs text-zinc-400 tabular-nums">{row.lost}</span>
                  <span className="text-center text-xs font-bold tabular-nums"
                    style={{ color: row.goal_diff > 0 ? "#00FF87" : row.goal_diff < 0 ? "#EF4444" : "#71717A" }}>
                    {row.goal_diff > 0 ? "+" : ""}{row.goal_diff}
                  </span>
                  <span className="text-center text-xs font-black text-white tabular-nums">{row.points}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Availability */}
      {(data.homeInjuries.length > 0 || data.awayInjuries.length > 0) && (
        <section className="section-block">
          <h2 className="section-title text-xl mb-5">Availability</h2>
          <div className="grid grid-cols-2 gap-6">
            {[
              { name: data.homeName, logo: data.homeLogo, injuries: data.homeInjuries },
              { name: data.awayName, logo: data.awayLogo, injuries: data.awayInjuries },
            ].map(({ name, logo, injuries }) => (
              <div key={name}>
                <div className="flex items-center gap-2 mb-3">
                  <Image src={logo} alt={name} width={16} height={16} className="object-contain" unoptimized />
                  <span className="text-xs font-bold text-zinc-400 truncate">{name}</span>
                </div>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <InjuryList injuries={injuries as any} compact />
                {injuries.length === 0 && <p className="text-xs text-zinc-600 italic">No reports</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <MatchFixedBottom data={data} />
    </div>
  );
}
