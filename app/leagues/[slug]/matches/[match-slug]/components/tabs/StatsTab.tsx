"use client";
import MatchFixedBottom from "../MatchFixedBottom";
import type { MatchPageData } from "../../MatchPageClient";

function StatBar({ home, away, label }: { home: number | null; away: number | null; label: string }) {
  if (home === null && away === null) return null;
  const h = home ?? 0, a = away ?? 0;
  const total = h + a;
  const pct = total > 0 ? (h / total) * 100 : 50;
  return (
    <div className="py-2.5 border-b border-white/[0.04] last:border-0">
      <div className="flex justify-between items-center text-xs mb-1.5">
        <span className="font-bold text-white tabular-nums">{h}</span>
        <span className="text-zinc-500 uppercase tracking-widest text-[10px]">{label}</span>
        <span className="font-bold text-white tabular-nums">{a}</span>
      </div>
      <div className="flex h-1 rounded-full overflow-hidden gap-px">
        <div style={{ width: `${pct}%`, backgroundColor: "rgba(0,255,135,0.5)" }} />
        <div style={{ flex: 1, backgroundColor: "rgba(59,130,246,0.5)" }} />
      </div>
    </div>
  );
}

export default function StatsTab({ data }: { data: MatchPageData }) {
  const { homeStats, awayStats, homeName, awayName } = data;

  if (!homeStats || !awayStats) {
    return (
      <>
        <div className="section-block py-10 text-center">
          <p className="text-zinc-600 text-sm">Match statistics not available.</p>
        </div>
        <MatchFixedBottom data={data} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <section className="section-block">
        <h2 className="section-title text-xl mb-4">Match Statistics</h2>
        <div className="flex justify-between text-[10px] font-bold mb-3">
          <span style={{ color: "#00FF87" }}>{homeName}</span>
          <span style={{ color: "#3B82F6" }}>{awayName}</span>
        </div>
        {homeStats.possession !== null && awayStats.possession !== null && (
          <div className="py-2.5 border-b border-white/[0.04]">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold" style={{ color: "#00FF87" }}>{homeStats.possession}%</span>
              <span className="text-zinc-500 uppercase tracking-widest text-[10px]">Possession</span>
              <span className="font-bold" style={{ color: "#3B82F6" }}>{awayStats.possession}%</span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden">
              <div style={{ width: `${homeStats.possession}%`, backgroundColor: "#00FF87", opacity: 0.7 }} />
              <div style={{ flex: 1, backgroundColor: "#3B82F6", opacity: 0.7 }} />
            </div>
          </div>
        )}
        <StatBar home={homeStats.shots_on}     away={awayStats.shots_on}     label="Shots on Target" />
        <StatBar home={homeStats.shots_total}  away={awayStats.shots_total}  label="Total Shots" />
        <StatBar home={homeStats.corners}      away={awayStats.corners}      label="Corner Kicks" />
        <StatBar home={homeStats.fouls}        away={awayStats.fouls}        label="Fouls" />
        <StatBar home={homeStats.offsides}     away={awayStats.offsides}     label="Offsides" />
        <StatBar home={homeStats.saves}        away={awayStats.saves}        label="Saves" />
        <StatBar home={homeStats.yellow_cards} away={awayStats.yellow_cards} label="Yellow Cards" />
        <StatBar home={homeStats.red_cards}    away={awayStats.red_cards}    label="Red Cards" />
        {(homeStats.xg != null || awayStats.xg != null) && (
          <StatBar home={homeStats.xg} away={awayStats.xg} label="Expected Goals (xG)" />
        )}
      </section>

      <MatchFixedBottom data={data} />
    </div>
  );
}
