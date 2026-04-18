"use client";

interface Props {
  oddsData: { home_win: number; draw: number; away_win: number } | null;
}

const AFFILIATE_URL = "https://reffpa.com/L?tag=d_5477761m_1599c_&site=5477761&ad=1599";
const BLUE = "#41AEFF";
const NAVY = "#1a3d6f";

export default function MatchOddsStrip({ oddsData }: Props) {
  if (!oddsData) return null;

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2.5"
      style={{ backgroundColor: "#0f172a", borderBottom: "1px solid rgba(51, 65, 85, 0.4)" }}>
      {/* 1 — Home */}
      <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer nofollow"
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-opacity hover:opacity-80"
        style={{ backgroundColor: NAVY }}>
        <span className="text-sm font-black tabular-nums" style={{ color: BLUE }}>
          {oddsData.home_win.toFixed(2)}
        </span>
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">1</span>
      </a>

      {/* X — Draw */}
      <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer nofollow"
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-opacity hover:opacity-80"
        style={{ backgroundColor: NAVY }}>
        <span className="text-sm font-black tabular-nums" style={{ color: BLUE }}>
          {oddsData.draw.toFixed(2)}
        </span>
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">X</span>
      </a>

      {/* 2 — Away */}
      <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer nofollow"
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-opacity hover:opacity-80"
        style={{ backgroundColor: NAVY }}>
        <span className="text-sm font-black tabular-nums" style={{ color: BLUE }}>
          {oddsData.away_win.toFixed(2)}
        </span>
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">2</span>
      </a>

      {/* 1xBet label */}
      <span className="text-[10px] font-black ml-1 shrink-0">
        <span className="text-white">1X</span><span style={{ color: BLUE }}>BET</span>
      </span>
    </div>
  );
}
