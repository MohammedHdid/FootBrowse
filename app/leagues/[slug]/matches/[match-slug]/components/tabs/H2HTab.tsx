"use client";
import Image from "next/image";
import MatchFixedBottom from "../MatchFixedBottom";
import type { MatchPageData } from "../../MatchPageClient";

export default function H2HTab({ data }: { data: MatchPageData }) {
  const { h2h, homeName, awayName, homeLogo, awayLogo, homeId, awayId } = data;

  if (!h2h || h2h.played === 0) {
    return (
      <>
        <div className="section-block py-10 text-center">
          <p className="text-zinc-600 text-sm">No head-to-head data available.</p>
        </div>
        <MatchFixedBottom data={data} />
      </>
    );
  }

  const w1 = Math.round((h2h.homeWins / h2h.played) * 100);
  const wx = Math.round((h2h.draws    / h2h.played) * 100);
  const w2 = 100 - w1 - wx;

  const homeWinsBigger = h2h.homeWins > h2h.awayWins;
  const awayWinsBigger = h2h.awayWins > h2h.homeWins;

  return (
    <div className="space-y-6">
      <section className="section-block">
        <h2 className="section-title text-xl mb-1">Head-to-Head</h2>
        <p className="text-xs text-zinc-600 mb-4">Last {h2h.played} meetings</p>

        {/* Win counts */}
        <div className="rounded-2xl overflow-hidden mb-4" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="grid grid-cols-3 pt-5 pb-4 px-3">
            {/* Home wins */}
            <div className="flex flex-col items-center gap-2">
              <Image src={homeLogo} alt={homeName} width={28} height={28} className="object-contain" unoptimized />
              <span className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-500 text-center truncate max-w-[60px]">
                {homeName.split(" ")[0]}
              </span>
              <span
                className="tabular-nums leading-none font-black"
                style={{
                  color: "#00FF87",
                  fontSize: homeWinsBigger ? "3.5rem" : "3rem",
                  letterSpacing: "-0.04em",
                }}>
                {h2h.homeWins}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">wins</span>
            </div>

            {/* Draws */}
            <div className="flex flex-col items-center gap-2 justify-center">
              <span className="text-5xl font-black tabular-nums leading-none"
                style={{ color: "#52525b", letterSpacing: "-0.04em" }}>
                {h2h.draws}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">draws</span>
            </div>

            {/* Away wins */}
            <div className="flex flex-col items-center gap-2">
              <Image src={awayLogo} alt={awayName} width={28} height={28} className="object-contain" unoptimized />
              <span className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-500 text-center truncate max-w-[60px]">
                {awayName.split(" ")[0]}
              </span>
              <span
                className="tabular-nums leading-none font-black"
                style={{
                  color: "#3B82F6",
                  fontSize: awayWinsBigger ? "3.5rem" : "3rem",
                  letterSpacing: "-0.04em",
                }}>
                {h2h.awayWins}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">wins</span>
            </div>
          </div>

          {/* Dominance bar */}
          <div className="mx-3 mb-3 flex overflow-hidden rounded-full h-1.5">
            <div style={{ width: `${w1}%`, backgroundColor: "#00FF87", opacity: 0.8 }} />
            <div style={{ width: `${wx}%`, backgroundColor: "rgba(82,82,91,0.5)" }} />
            <div style={{ flex: 1, backgroundColor: "#3B82F6", opacity: 0.7 }} />
          </div>

          <div className="flex items-center justify-between px-4 py-2 text-[9px] font-bold border-t border-white/[0.04]">
            <span style={{ color: "#00FF87" }}>{w1}%</span>
            <span className="text-zinc-700">{h2h.played} played · {wx}% draws</span>
            <span style={{ color: "#3B82F6" }}>{w2}%</span>
          </div>
        </div>

        {/* Recent meetings */}
        {h2h.lastMatches.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Recent Meetings</p>
            {h2h.lastMatches.slice(0, 5).map((m) => {
              const homeWon = (m.home_score ?? 0) > (m.away_score ?? 0);
              const awayWon = (m.away_score ?? 0) > (m.home_score ?? 0);
              // From current match perspective
              const ourHomeWon = homeWon ? m.home_id === homeId : awayWon ? m.away_id === homeId : false;
              const ourAwayWon = homeWon ? m.home_id === awayId : awayWon ? m.away_id === awayId : false;
              const borderColor = ourHomeWon ? "rgba(0,255,135,0.4)" : ourAwayWon ? "rgba(59,130,246,0.4)" : "rgba(82,82,91,0.25)";
              return (
                <div key={m.fixture_id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderLeft: `3px solid ${borderColor}`,
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    if (ourHomeWon) el.style.backgroundColor = "rgba(0,255,135,0.04)";
                    else if (ourAwayWon) el.style.backgroundColor = "rgba(239,68,68,0.04)";
                  }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.02)"; }}
                >
                  <span className="text-[10px] text-zinc-600 shrink-0 w-16 tabular-nums">
                    {new Date(m.date).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
                  </span>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                    <span className={`text-xs truncate text-right ${homeWon ? "text-white font-bold" : "text-zinc-500 font-medium"}`}>
                      {m.home_name}
                    </span>
                    <Image src={m.home_logo} alt={m.home_name} width={16} height={16}
                      className="object-contain shrink-0" unoptimized />
                  </div>
                  <span className="shrink-0 text-sm font-black tabular-nums text-white px-2"
                    style={{ letterSpacing: "0.05em" }}>
                    {m.home_score ?? "?"} – {m.away_score ?? "?"}
                  </span>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <Image src={m.away_logo} alt={m.away_name} width={16} height={16}
                      className="object-contain shrink-0" unoptimized />
                    <span className={`text-xs truncate ${awayWon ? "text-white font-bold" : "text-zinc-500 font-medium"}`}>
                      {m.away_name}
                    </span>
                  </div>
                  <span className="text-[9px] text-zinc-700 shrink-0 hidden sm:block truncate max-w-[80px] text-right">
                    {m.league}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <MatchFixedBottom data={data} />
    </div>
  );
}
