"use client";
import Image from "next/image";

interface Props {
  homeName: string;
  awayName: string;
  homeLogo: string;
  awayLogo: string;
  homeIsFlag: boolean;
  awayIsFlag: boolean;
  score: { home: number | null; away: number | null };
  kickoffUtc: string;
  matchDate: string;
  finished: boolean;
  live: boolean;
  fixtureStatusLabel: string;
  elapsed: number | null;
}

export default function MatchMiniBar(p: Props) {
  const statusColor = p.live ? "#EF4444" : p.finished ? "#64748b" : "#3B82F6";
  const statusBg    = p.live ? "rgba(239,68,68,0.1)" : p.finished ? "rgba(255,255,255,0.04)" : "rgba(59,130,246,0.1)";

  return (
    <div className="flex items-center justify-center gap-4 px-4 py-2.5"
      style={{ backgroundColor: "#0f172a", borderBottom: "1px solid rgba(51, 65, 85, 0.4)" }}>
      <Image src={p.homeLogo} alt={p.homeName} width={28} height={28} unoptimized
        className="object-contain shrink-0" style={{ height: p.homeIsFlag ? 18 : 28, width: "auto" }} />

      <div className="text-center min-w-[100px]">
        {p.finished || p.live ? (
          <span className={`text-xl font-black tabular-nums ${p.live ? "text-red-500" : "text-white"}`} style={{ letterSpacing: "-0.04em" }}>
            {p.score.home ?? 0}<span className="mx-1.5 opacity-40">–</span>{p.score.away ?? 0}
          </span>
        ) : (
          <>
            <span className="text-xl font-black" style={{ color: "#00FF87", letterSpacing: "-0.03em" }}>
              {p.kickoffUtc}
            </span>
            <span className="block text-[10px] text-slate-500 mt-0.5">
              {new Date(p.matchDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </>
        )}
        <div className="flex justify-center mt-0.5">
          {p.live ? (
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[8px] font-black tracking-wider text-red-500 uppercase leading-none">
                LIVE {p.elapsed ? `· ${p.elapsed}'` : ""}
              </span>
            </div>
          ) : (
            <span className="block text-[9px] font-bold px-1.5 py-0.5 rounded-full w-fit mx-auto border"
              style={{ color: statusColor, backgroundColor: statusBg, borderColor: p.finished ? "rgba(100,116,139,0.3)" : "rgba(59,130,246,0.3)" }}>
              {p.fixtureStatusLabel}
            </span>
          )}
        </div>
      </div>

      <Image src={p.awayLogo} alt={p.awayName} width={28} height={28} unoptimized
        className="object-contain shrink-0" style={{ height: p.awayIsFlag ? 18 : 28, width: "auto" }} />
    </div>
  );
}
