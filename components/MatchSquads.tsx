"use client";

import { useState } from "react";
import Link from "next/link";
import type { SyncedPlayer } from "@/lib/types";
import { getPositionStyle } from "@/lib/positions";
import FlagImg from "@/components/FlagImg";

const POS_ORDER: Record<string, number> = {
  Goalkeeper: 1,
  "Centre-Back": 2, "Right-Back": 2, "Left-Back": 2, Defence: 2,
  "Central Midfield": 3, "Defensive Midfield": 3, "Right Midfield": 3,
  "Left Midfield": 3, Midfield: 3,
  "Centre-Forward": 4, "Attacking Midfield": 4, "Right Winger": 4,
  "Left Winger": 4, "Second Striker": 4, Offence: 4,
};

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const INITIAL_ROWS = 8;

interface TeamInfo {
  name: string;
  slug: string;
  code: string;
}

interface Props {
  teamA: TeamInfo;
  teamB: TeamInfo;
  squadA: SyncedPlayer[];
  squadB: SyncedPlayer[];
}

function MiniTable({ squad, teamSlug }: { squad: SyncedPlayer[]; teamSlug: string }) {
  const [showAll, setShowAll] = useState(false);
  void teamSlug;

  const sorted = [...squad].sort(
    (a, b) => (POS_ORDER[a.position] ?? 5) - (POS_ORDER[b.position] ?? 5)
  );
  const visible = showAll ? sorted : sorted.slice(0, INITIAL_ROWS);
  const hidden = sorted.length - INITIAL_ROWS;

  if (squad.length === 0) {
    return (
      <p
        className="text-sm text-zinc-600 italic py-6 text-center rounded-xl"
        style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
      >
        Squad not yet confirmed
      </p>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <th className="text-left pb-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest w-7">#</th>
              <th className="text-left pb-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Player</th>
              <th className="text-left pb-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Pos</th>
              <th className="text-center pb-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest w-10">Age</th>
              <th className="text-center pb-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest w-10">Flag</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((player) => {
              const pos = getPositionStyle(player.position);
              const age = calcAge(player.dateOfBirth);
              return (
                <tr
                  key={player.slug}
                  className="group transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <td className="py-2 pr-2 text-zinc-600 font-mono text-xs tabular-nums">
                    {player.shirtNumber ?? "—"}
                  </td>
                  <td className="py-2 pr-3">
                    <Link href={`/players/${player.slug}`} className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: pos.bg, border: `1px solid ${pos.border}` }}
                      >
                        {player.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover object-top" />
                        ) : (
                          <span className="text-[8px] font-black" style={{ color: pos.color }}>{player.name.charAt(0)}</span>
                        )}
                      </div>
                      <span
                        className="font-semibold text-white text-xs group-hover:opacity-60 transition-opacity truncate"
                        style={{ letterSpacing: "-0.01em" }}
                      >
                        {player.name}
                      </span>
                    </Link>
                  </td>
                  <td className="py-2 pr-2">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: pos.bg, color: pos.color, border: `1px solid ${pos.border}` }}
                    >
                      {pos.label}
                    </span>
                  </td>
                  <td className="py-2 pr-1 text-center text-zinc-400 text-xs tabular-nums">{age ?? "—"}</td>
                  <td className="py-2 text-center">
                    <FlagImg nationality={player.nationality} size={18} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sorted.length > INITIAL_ROWS && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 w-full py-2 text-xs font-bold rounded-lg transition-colors"
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: showAll ? "#a1a1aa" : "#00FF87",
          }}
        >
          {showAll ? "Show less ↑" : `Show all ${sorted.length} (+${hidden} more) ↓`}
        </button>
      )}
    </div>
  );
}

export default function MatchSquads({ teamA, teamB, squadA, squadB }: Props) {
  const [activeTab, setActiveTab] = useState<"a" | "b">("a");
  const hasAny = squadA.length > 0 || squadB.length > 0;

  if (!hasAny) return null;

  return (
    <section>
      <h2 className="section-title text-xl mb-4">Squad Comparison</h2>

      {/* Mobile: tab switcher */}
      <div className="flex lg:hidden gap-2 mb-4">
        {[
          { key: "a" as const, team: teamA, count: squadA.length },
          { key: "b" as const, team: teamB, count: squadB.length },
        ].map(({ key, team, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="flex-1 py-2.5 px-3 rounded-lg text-sm font-bold transition-all"
            style={
              activeTab === key
                ? { backgroundColor: "#00FF87", color: "#0a0a0a" }
                : { backgroundColor: "rgba(255,255,255,0.05)", color: "#a1a1aa", border: "1px solid rgba(255,255,255,0.08)" }
            }
          >
            {team.name}
            {count > 0 && (
              <span className="ml-1.5 text-[10px] opacity-70">({count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Mobile: single active table */}
      <div className="lg:hidden">
        <MiniTable
          squad={activeTab === "a" ? squadA : squadB}
          teamSlug={activeTab === "a" ? teamA.slug : teamB.slug}
        />
      </div>

      {/* Desktop: side by side */}
      <div className="hidden lg:grid grid-cols-2 gap-6">
        {[
          { team: teamA, squad: squadA },
          { team: teamB, squad: squadB },
        ].map(({ team, squad }) => (
          <div key={team.slug}>
            <div className="flex items-center gap-2 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/w40/${team.code}.png`}
                alt={team.name}
                width={28}
                height={18}
                className="rounded-sm object-cover shrink-0"
                style={{ width: 28, height: "auto" }}
              />
              <Link
                href={`/teams/${team.slug}`}
                className="font-black text-white hover:opacity-70 transition-opacity"
                style={{ letterSpacing: "-0.02em" }}
              >
                {team.name}
              </Link>
              {squad.length > 0 && (
                <span className="text-xs text-zinc-600 ml-1">({squad.length})</span>
              )}
            </div>
            <MiniTable squad={squad} teamSlug={team.slug} />
          </div>
        ))}
      </div>
    </section>
  );
}
