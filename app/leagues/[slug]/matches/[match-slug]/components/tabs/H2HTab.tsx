"use client";
import Image from "next/image";
import type { MatchPageData } from "../../MatchPageClient";

export default function H2HTab({ data }: { data: MatchPageData }) {
  const { h2h, homeName, awayName, homeLogo, awayLogo } = data;

  if (!h2h || h2h.played === 0) {
    return (
      <div className="section-block py-10 text-center">
        <p className="text-zinc-600 text-sm">No head-to-head data available.</p>
      </div>
    );
  }

  const w1 = Math.round((h2h.homeWins / h2h.played) * 100);
  const wx = Math.round((h2h.draws    / h2h.played) * 100);
  const w2 = 100 - w1 - wx;

  return (
    <section className="section-block">
      <h2 className="section-title text-xl mb-1">Head-to-Head</h2>
      <p className="text-xs text-zinc-600 mb-4">Last {h2h.played} meetings</p>

      {/* Win counts */}
      <div className="rounded-2xl overflow-hidden mb-4" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="grid grid-cols-3 pt-5 pb-4 px-3">
          {[
            { logo: homeLogo, name: homeName, wins: h2h.homeWins },
            null,
            { logo: awayLogo, name: awayName, wins: h2h.awayWins },
          ].map((item, idx) =>
            item ? (
              <div key={idx} className="flex flex-col items-center gap-2">
                <Image src={item.logo} alt={item.name} width={28} height={28} className="object-contain" unoptimized />
                <span className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-500 text-center truncate max-w-[60px]">
                  {item.name.split(" ")[0]}
                </span>
                <span className="text-5xl font-black tabular-nums leading-none text-white"
                  style={{ letterSpacing: "-0.04em" }}>
                  {item.wins}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">wins</span>
              </div>
            ) : (
              <div key={idx} className="flex flex-col items-center gap-2 justify-center">
                <span className="text-5xl font-black tabular-nums leading-none"
                  style={{ color: "#52525b", letterSpacing: "-0.04em" }}>
                  {h2h.draws}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">draws</span>
              </div>
            )
          )}
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
            return (
              <div key={m.fixture_id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-[10px] text-zinc-600 shrink-0 w-16 tabular-nums">
                  {new Date(m.date).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
                </span>
                <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                  <span className={`text-xs font-bold truncate text-right ${homeWon ? "text-white" : "text-zinc-500"}`}>
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
                  <span className={`text-xs font-bold truncate ${awayWon ? "text-white" : "text-zinc-500"}`}>
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
  );
}
