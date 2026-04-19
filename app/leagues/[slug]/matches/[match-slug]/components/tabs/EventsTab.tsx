"use client";
import MatchFixedBottom from "../MatchFixedBottom";
import type { MatchPageData } from "../../MatchPageClient";

export default function EventsTab({ data }: { data: MatchPageData }) {
  const { events, homeTeamId, homeName, awayName } = data;

  if (!events.length) {
    return (
      <>
        <div className="section-block py-10 text-center">
          <p className="text-zinc-600 text-sm">No match events available yet.</p>
        </div>
        <MatchFixedBottom data={data} />
      </>
    );
  }

  const timelineEvents  = events.filter((e) => e.type === "Goal" || e.type === "Card");
  // Reversed: newest events at top, oldest at bottom (live feed order)
  const firstHalf       = [...events].filter((e) => e.minute <= 45).reverse();
  const secondHalf      = [...events].filter((e) => e.minute > 45 && e.minute <= 90).reverse();
  const extraTime       = [...events].filter((e) => e.minute > 90).reverse();
  const timelineMaxMin  = Math.max(90, ...events.map((e) => e.minute));

  return (
    <div className="space-y-6">
      <section className="section-block">
        <h2 className="section-title text-xl mb-4">Match Timeline</h2>

        {/* Visual bar */}
        {timelineEvents.length > 0 && (
          <div className="relative mb-10 mt-4 px-1" style={{ height: 44 }}>
            {/* The main track */}
            <div className="absolute left-0 right-0 rounded-full overflow-hidden"
              style={{ top: "18px", height: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="h-full w-full" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)" }} />
            </div>

            {/* Half-time marker */}
            <div className="absolute z-10"
              style={{ left: `${(45 / timelineMaxMin) * 100}%`, top: "10px", height: "22px", width: 1,
                backgroundColor: "rgba(255,255,255,0.3)", boxShadow: "0 0 10px rgba(255,255,255,0.2)" }} />

            {/* Events mapping */}
            {timelineEvents.map((e, i) => {
              const isHome = e.team_id === homeTeamId;
              const isMissed = e.type === "Goal" && e.detail?.toLowerCase().includes("missed");
              const isGoal = e.type === "Goal" && !isMissed && !e.detail?.toLowerCase().includes("cancelled");
              const isRed  = e.detail === "Red Card" || e.detail === "Yellow-Red Card";
              const isCard = e.type === "Card";
              const pct    = `${Math.min((e.minute / timelineMaxMin) * 100, 98)}%`;
              
              const color  = isGoal ? (isHome ? "#00FF87" : "#3B82F6") : isRed ? "#EF4444" : isCard ? "#EAB308" : "#94A3B8";

              return (
                <div key={i} className="absolute -translate-x-1/2 flex flex-col items-center"
                  style={{ left: pct, top: isGoal ? "0px" : "10px" }}>
                  
                  {isGoal ? (
                    <>
                      <span className="text-[12px] leading-none mb-1 drop-shadow-md">⚽</span>
                      <div className="rounded-full blur-[4px]" style={{ width: 12, height: 12, backgroundColor: color, position: 'absolute', top: 0, opacity: 0.5 }} />
                      <div className="rounded-full border-2 border-slate-900" style={{ width: 10, height: 10, backgroundColor: color, position: 'relative', zIndex: 1 }} />
                    </>
                  ) : (
                    <div className="rounded-[1px]" style={{
                      width: 3, 
                      height: 18,
                      backgroundColor: color,
                      boxShadow: `0 0 4px ${color}40`,
                      opacity: 0.8
                    }} />
                  )}
                </div>
              );
            })}

            {/* Time markers */}
            <div className="absolute -bottom-6 left-0 text-[10px] font-bold text-zinc-600">0&apos;</div>
            <div className="absolute -bottom-6 font-bold text-[10px] text-[#00FF87] opacity-60"
              style={{ left: `${(45 / timelineMaxMin) * 100}%`, transform: "translateX(-50%)" }}>HT</div>
            <div className="absolute -bottom-6 right-0 text-[10px] font-bold text-zinc-600">{timelineMaxMin}&apos;</div>
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-4 mb-3">
          <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <span className="w-2 h-2 rounded-[1px]" style={{ backgroundColor: "#00FF87" }} />{homeName}
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <span className="w-2 h-2 rounded-[1px]" style={{ backgroundColor: "#3B82F6" }} />{awayName}
          </span>
        </div>

        {/* Events by half — newest section first, newest event at top within each half */}
        {[
          { label: "Extra Time", halfEvents: extraTime, alwaysShow: false },
          { label: "2nd Half",   halfEvents: secondHalf, alwaysShow: true },
          { label: "1st Half",   halfEvents: firstHalf, alwaysShow: true },
        ].filter(({ halfEvents, alwaysShow }) => halfEvents.length > 0 || alwaysShow).map(({ label, halfEvents }, hi) => (
          <div key={hi} className="mb-3 last:mb-0">
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">{label}</span>
              <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
              <span className="text-[9px] text-zinc-700">{halfEvents.length}</span>
            </div>
            
            {halfEvents.length === 0 ? (
              <div className="flex items-center justify-center py-4 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.015)", border: "1px dashed rgba(255,255,255,0.05)" }}>
                <span className="text-xs font-semibold text-zinc-600">No major events</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {halfEvents.map((e, i) => {
                  const isHome = e.team_id === homeTeamId;
                  const isMissedGoal = e.type === "Goal" && e.detail?.toLowerCase().includes("missed");
                  const isGoal = e.type === "Goal" && !isMissedGoal && !e.detail?.toLowerCase().includes("cancelled");

                  // Premium SVG Icons
                  const GoalIcon = () => (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800/50 border border-slate-700/50">
                      <span className="text-[12px]">⚽</span>
                    </div>
                  );
                  const CardIcon = ({ color }: { color: string }) => (
                    <div className="w-4 h-5 rounded-[2px] shadow-sm" style={{ backgroundColor: color }} />
                  );
                  const SubsIcon = () => (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20">
                      <span className="text-[14px]">🔄</span>
                    </div>
                  );
                  const MissedIcon = () => (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/10 border border-red-500/20">
                      <span className="text-[10px]">❌</span>
                    </div>
                  );

                  return (
                    <div key={i} className={`group flex items-center gap-3 p-2.5 rounded-xl transition-all hover:bg-slate-800/30 border border-transparent hover:border-slate-700/30 ${!isHome ? "flex-row-reverse text-right" : ""}`}>
                      <div className="flex flex-col items-center min-w-[32px]">
                        <span className="text-[11px] font-bold text-slate-500 mb-0.5">{e.minute}&apos;</span>
                        {isGoal && <GoalIcon />}
                        {isMissedGoal && <MissedIcon />}
                        {e.detail === "Yellow Card" && <CardIcon color="#EAB308" />}
                        {(e.detail === "Red Card" || e.detail === "Yellow-Red Card") && <CardIcon color="#EF4444" />}
                        {e.type === "subst" && <SubsIcon />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                          {e.player}
                        </div>
                        <div className={`text-[10px] uppercase font-black tracking-widest ${isHome ? "text-[#00FF87]" : "text-[#3B82F6]"}`}>
                          {e.detail}
                          {e.assist && <span className="normal-case font-medium text-zinc-500 ml-1.5">• Assist: {e.assist}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </section>

      <MatchFixedBottom data={data} />
    </div>
  );
}
