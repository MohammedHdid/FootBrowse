"use client";
import type { MatchPageData } from "../../MatchPageClient";

export default function EventsTab({ data }: { data: MatchPageData }) {
  const { events, homeTeamId, homeName, awayName } = data;

  if (!events.length) {
    return (
      <div className="section-block py-10 text-center">
        <p className="text-zinc-600 text-sm">No match events available yet.</p>
      </div>
    );
  }

  const timelineEvents  = events.filter((e) => e.type === "Goal" || e.type === "Card");
  const firstHalf       = events.filter((e) => e.minute <= 45);
  const secondHalf      = events.filter((e) => e.minute > 45 && e.minute <= 90);
  const extraTime       = events.filter((e) => e.minute > 90);
  const timelineMaxMin  = Math.max(90, ...events.map((e) => e.minute));

  return (
    <section className="section-block">
      <h2 className="section-title text-xl mb-4">Match Timeline</h2>

      {/* Visual bar */}
      {timelineEvents.length > 0 && (
        <div className="relative mb-6" style={{ height: 40, paddingBottom: 14 }}>
          <div className="absolute left-0 right-0 rounded-full"
            style={{ top: "38%", height: 2, backgroundColor: "rgba(255,255,255,0.07)" }} />
          <div className="absolute"
            style={{ left: `${(45 / timelineMaxMin) * 100}%`, top: "20%", height: "36%", width: 1,
              backgroundColor: "rgba(255,255,255,0.15)" }} />
          {timelineEvents.map((e, i) => {
            const isHome = e.team_id === homeTeamId;
            const isGoal = e.type === "Goal";
            const isRed  = e.detail === "Red Card" || e.detail === "Yellow-Red Card";
            const pct    = `${Math.min((e.minute / timelineMaxMin) * 100, 97)}%`;
            return (
              <div key={i} className="absolute -translate-x-1/2"
                style={{ left: pct, top: "calc(38% - 5px)" }}>
                <div className="rounded-[2px]" style={{
                  width: isGoal ? 10 : 7, height: 10,
                  backgroundColor: isGoal ? (isHome ? "#00FF87" : "#3B82F6") : isRed ? "#EF4444" : "#EAB308",
                }} />
              </div>
            );
          })}
          <div className="absolute bottom-0 left-0 text-[9px] text-zinc-700">0&apos;</div>
          <div className="absolute bottom-0 text-[9px] text-zinc-700"
            style={{ left: `${(45 / timelineMaxMin) * 100}%`, transform: "translateX(-50%)" }}>HT</div>
          <div className="absolute bottom-0 right-0 text-[9px] text-zinc-700">{timelineMaxMin}&apos;</div>
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

      {/* Events by half */}
      {[
        { label: "1st Half",   halfEvents: firstHalf },
        { label: "2nd Half",   halfEvents: secondHalf },
        { label: "Extra Time", halfEvents: extraTime },
      ].filter(({ halfEvents }) => halfEvents.length > 0).map(({ label, halfEvents }, hi) => (
        <div key={hi} className="mb-3 last:mb-0">
          <div className="flex items-center gap-3 mb-1.5">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">{label}</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
            <span className="text-[9px] text-zinc-700">{halfEvents.length}</span>
          </div>
          <div className="space-y-0.5">
            {halfEvents.map((e, i) => {
              const isHome = e.team_id === homeTeamId;
              const icon =
                e.type === "Goal"                                           ? "⚽" :
                e.detail === "Yellow Card"                                  ? "🟨" :
                (e.detail === "Red Card" || e.detail === "Yellow-Red Card") ? "🟥" :
                e.type === "subst"                                          ? "🔄" : null;
              if (icon === null) return null;
              return (
                <div key={i}
                  className={`flex items-center gap-3 py-2 px-3 rounded-lg text-sm ${isHome ? "" : "flex-row-reverse"}`}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.025)",
                    borderLeft:  isHome  ? "2px solid rgba(0,255,135,0.25)"  : "2px solid transparent",
                    borderRight: !isHome ? "2px solid rgba(59,130,246,0.25)" : "2px solid transparent",
                  }}>
                  <span className="text-zinc-500 tabular-nums text-xs w-8 shrink-0 text-center">
                    {e.minute}{e.extra ? `+${e.extra}` : ""}&apos;
                  </span>
                  <span className="shrink-0">{icon}</span>
                  <div className={`flex-1 min-w-0 ${isHome ? "" : "text-right"}`}>
                    <span className="font-semibold text-zinc-200">{e.player}</span>
                    {e.type === "Goal" && e.assist && (
                      <p className="text-[11px] text-zinc-500 mt-0.5">Assist: {e.assist}</p>
                    )}
                    {e.type === "subst" && e.assist && (
                      <p className="text-[11px] text-zinc-500 mt-0.5">↑ {e.assist}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
