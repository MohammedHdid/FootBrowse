"use client";
import MatchFixedBottom from "../MatchFixedBottom";
import type { MatchPageData } from "../../MatchPageClient";

const AFFILIATE_URL = "https://reffpa.com/L?tag=d_5477761m_1599c_&site=5477761&ad=1599";
const BLUE  = "#41AEFF";
const NAVY  = "#1a3d6f";

function isPredictedScore(val: string | null): boolean {
  if (!val) return false;
  const n = parseFloat(val);
  return !isNaN(n) && n >= 0;
}

export default function OddsTab({ data }: { data: MatchPageData }) {
  const { prediction, oddsData, homeName, awayName } = data;

  if (!prediction && !oddsData) {
    return (
      <>
        <div className="section-block py-10 text-center">
          <p className="text-zinc-600 text-sm">Predictions and odds not yet available.</p>
        </div>
        <MatchFixedBottom data={data} />
      </>
    );
  }

  const showGoals = isPredictedScore(prediction?.goals_home ?? null) && isPredictedScore(prediction?.goals_away ?? null);
  const goalsHome = showGoals ? Math.round(parseFloat(prediction!.goals_home!)) : null;
  const goalsAway = showGoals ? Math.round(parseFloat(prediction!.goals_away!)) : null;

  return (
    <div className="space-y-6">
      {/* Prediction */}
      {prediction && (
        <section className="section-block">
          <h2 className="section-title text-xl mb-5">Our Prediction</h2>
          <div className="rounded-xl p-5 mb-4"
            style={{
              background: "linear-gradient(135deg, rgba(0,255,135,0.07) 0%, rgba(0,255,135,0.02) 100%)",
              border: "1px solid rgba(0,255,135,0.18)",
            }}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-1.5">Predicted Winner</p>
                <p className="text-2xl font-black" style={{ color: "#00FF87", letterSpacing: "-0.03em" }}>
                  {prediction.winner_name ?? "Draw"}
                </p>
                {prediction.winner_comment && (
                  <p className="text-xs text-zinc-500 mt-1">{prediction.winner_comment}</p>
                )}
              </div>
              {/* Only show Goals if both values are readable positive numbers */}
              {showGoals && goalsHome !== null && goalsAway !== null && (
                <div className="rounded-lg px-3 py-2 text-center shrink-0"
                  style={{ backgroundColor: "rgba(0,255,135,0.1)", border: "1px solid rgba(0,255,135,0.2)" }}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500 mb-0.5">Predicted Score</p>
                  <p className="text-sm font-black tabular-nums" style={{ color: "#00FF87" }}>
                    {goalsHome} – {goalsAway}
                  </p>
                </div>
              )}
            </div>
            <div style={{ borderTop: "1px solid rgba(0,255,135,0.1)", paddingTop: "1rem" }}>
              <div className="flex justify-between text-xs mb-2">
                <span className="font-bold text-white">{prediction.percent.home}</span>
                <span className="text-zinc-600 text-[10px] uppercase tracking-widest">Win probability</span>
                <span className="font-bold text-white">{prediction.percent.away}</span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden">
                {(() => {
                  const h = parseInt(prediction.percent.home) || 33;
                  const d = parseInt(prediction.percent.draw) || 34;
                  return (
                    <>
                      <div style={{ width: `${h}%`, backgroundColor: "#00FF87", opacity: 0.7 }} />
                      <div style={{ width: `${d}%`, backgroundColor: "#52525b" }} />
                      <div style={{ flex: 1, backgroundColor: "#3B82F6", opacity: 0.7 }} />
                    </>
                  );
                })()}
              </div>
              <div className="flex justify-between mt-1.5 text-[9px] tabular-nums text-zinc-600">
                <span>{homeName.split(" ")[0]}</span>
                <span>Draw {prediction.percent.draw}</span>
                <span>{awayName.split(" ")[0]}</span>
              </div>
            </div>
            {prediction.under_over && (
              <div className="mt-3 flex items-center gap-2 text-xs"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.75rem" }}>
                <span className="text-zinc-600">Over/Under</span>
                <span className="font-bold text-white">{prediction.under_over}</span>
              </div>
            )}
          </div>
          <div className="rounded-lg px-4 py-3"
            style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-600 mb-1">Advice</p>
            <p className="text-sm text-zinc-300">{prediction.advice}</p>
          </div>
        </section>
      )}

      {/* Betting Odds — 1xBet branded */}
      {oddsData && (
        <section className="section-block">
          <h2 className="section-title text-xl mb-4">Betting Odds</h2>
          {(() => {
            const r1 = 1 / oddsData.home_win, rX = 1 / oddsData.draw, r2 = 1 / oddsData.away_win;
            const total = r1 + rX + r2;
            const p1 = Math.round((r1 / total) * 100);
            const pX = Math.round((rX / total) * 100);
            const p2 = 100 - p1 - pX;
            return (
              <div className="rounded-xl p-3"
                style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {/* 1xBet badge */}
                <div className="flex justify-end mb-3">
                  <span className="text-xs font-black px-2 py-0.5 rounded"
                    style={{ backgroundColor: NAVY }}>
                    <span className="text-white">1X</span><span style={{ color: BLUE }}>BET</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { k: "1", label: homeName.split(" ")[0], v: oddsData.home_win },
                    { k: "X", label: "Draw",                 v: oddsData.draw },
                    { k: "2", label: awayName.split(" ")[0], v: oddsData.away_win },
                  ].map(({ k, label, v }) => (
                    <a key={k} href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer nofollow"
                      className="flex flex-col items-center rounded-lg px-2 py-3 gap-1 transition-opacity hover:opacity-80"
                      style={{ backgroundColor: NAVY }}>
                      <span className="text-[9px] font-bold text-zinc-300">{label}</span>
                      <span className="text-[10px] font-bold text-zinc-400">{k}</span>
                      <span className="text-xl font-black tabular-nums leading-none" style={{ color: BLUE }}>
                        {v.toFixed(2)}
                      </span>
                    </a>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="flex overflow-hidden h-1.5 rounded-full mb-1.5">
                    <div style={{ width: `${p1}%`, backgroundColor: "#00FF87", opacity: 0.7 }} />
                    <div style={{ width: `${pX}%`, backgroundColor: "rgba(255,255,255,0.15)" }} />
                    <div style={{ width: `${p2}%`, backgroundColor: BLUE, opacity: 0.7 }} />
                  </div>
                  <div className="grid grid-cols-3 text-[9px] tabular-nums text-zinc-700">
                    <span className="text-center">{p1}%</span>
                    <span className="text-center">{pX}%</span>
                    <span className="text-center">{p2}%</span>
                  </div>
                </div>
              </div>
            );
          })()}
          <p className="text-[10px] text-zinc-700 pt-2">18+ · Gamble responsibly · Odds subject to change</p>
        </section>
      )}

      <MatchFixedBottom data={data} />
    </div>
  );
}
