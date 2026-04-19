"use client";

import Image from "next/image";
import Link from "next/link";
import type { MatchLineupData, LineupPlayer } from "@/lib/lineups";

interface SquadPlayerLight {
  id: number;
  slug: string;
  photo_url: string | null;
}

interface Props {
  lineup: MatchLineupData | null;
  homeName: string;
  awayName: string;
  homeSquad?: SquadPlayerLight[];
  awaySquad?: SquadPlayerLight[];
}

const POS_LABEL: Record<string, string> = {
  G: "GK",
  D: "DEF",
  M: "MID",
  F: "FWD",
};

function PlayerRow({ player, squadPlayer, reverse = false }: { player: LineupPlayer; squadPlayer?: SquadPlayerLight; reverse?: boolean }) {
  const posLabel = POS_LABEL[player.pos] ?? player.pos;
  const Wrapper = squadPlayer?.slug ? Link : "div";
  const href = squadPlayer?.slug ? `/players/${squadPlayer.slug}` : undefined;

  return (
    <Wrapper
      href={href as any}
      className={`flex items-center gap-2 py-1.5 px-2 rounded-lg group transition-colors hover:bg-white/[0.04] ${reverse ? "flex-row-reverse" : ""}`}
      style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
    >
      <span
        className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-[10px] font-black tabular-nums"
        style={{ backgroundColor: "rgba(255,255,255,0.07)", color: "#A1A1AA" }}
      >
        {player.number}
      </span>
      {squadPlayer?.photo_url ? (
        <Image 
          src={squadPlayer.photo_url} 
          alt={player.name} 
          width={24} height={24} 
          className="w-6 h-6 rounded-full object-cover shrink-0" 
          unoptimized
        />
      ) : (
        <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center bg-slate-800 border border-slate-700">
          <span className="text-[8px] font-black text-slate-500">{player.name.charAt(0)}</span>
        </div>
      )}
      <span className={`flex-1 text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors truncate ${reverse ? "text-right" : ""}`}>
        {player.name}
      </span>
      <span className="shrink-0 text-[9px] font-bold text-zinc-600 w-7 text-center">
        {posLabel}
      </span>
    </Wrapper>
  );
}

export default function MatchLineup({ lineup, homeName, awayName, homeSquad = [], awaySquad = [] }: Props) {
  return (
    <section className="section-block">
      <h2 className="section-title text-xl mb-5">Lineups</h2>

      {!lineup || (lineup.home.startXI.length === 0 && lineup.away.startXI.length === 0) ? (
        <div
          className="rounded-xl px-5 py-6 flex flex-col items-center gap-2 text-center"
          style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <span className="text-2xl">⏳</span>
          <p className="text-sm font-semibold text-zinc-400">Lineups not yet announced</p>
          <p className="text-xs text-zinc-600">Confirmed starting XIs appear ~60–90 min before kickoff</p>
        </div>
      ) : (
        <>
          {/* Formation badges */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div
              className="rounded-lg px-3 py-2 flex items-center gap-2"
              style={{ backgroundColor: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.15)" }}
            >
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500 shrink-0">Formation</span>
              <span className="text-sm font-black" style={{ color: "#00FF87" }}>{lineup.home.formation}</span>
            </div>
            <div
              className="rounded-lg px-3 py-2 flex items-center justify-end gap-2"
              style={{ backgroundColor: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}
            >
              <span className="text-sm font-black" style={{ color: "#3B82F6" }}>{lineup.away.formation}</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500 shrink-0">Formation</span>
            </div>
          </div>

          {/* Team headers */}
          <div className="grid grid-cols-2 gap-3 mb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 truncate">{homeName}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 truncate text-right">{awayName}</p>
          </div>

          {/* Starting XI */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              {lineup.home.startXI.map((p) => (
                <PlayerRow key={p.id} player={p} squadPlayer={homeSquad.find(s => s.id === p.id)} />
              ))}
            </div>
            <div className="flex flex-col gap-1">
              {lineup.away.startXI.map((p) => (
                <PlayerRow key={p.id} player={p} squadPlayer={awaySquad.find(s => s.id === p.id)} reverse />
              ))}
            </div>
          </div>

          {/* Coaches */}
          {(lineup.home.coach || lineup.away.coach) && (
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-[10px] text-zinc-600 truncate">
                <span className="text-zinc-700 mr-1">Coach</span>
                {lineup.home.coach ?? "—"}
              </p>
              <p className="text-[10px] text-zinc-600 truncate text-right">
                {lineup.away.coach ?? "—"}
                <span className="text-zinc-700 ml-1">Coach</span>
              </p>
            </div>
          )}

          {/* Bench */}
          {(lineup.home.substitutes.length > 0 || lineup.away.substitutes.length > 0) && (
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2">Bench</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  {lineup.home.substitutes.map((p) => (
                    <PlayerRow key={p.id} player={p} squadPlayer={homeSquad.find(s => s.id === p.id)} />
                  ))}
                </div>
                <div className="flex flex-col gap-1">
                  {lineup.away.substitutes.map((p) => (
                    <PlayerRow key={p.id} player={p} squadPlayer={awaySquad.find(s => s.id === p.id)} reverse />
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
