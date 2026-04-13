"use client";

import Image from "next/image";
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

const INITIAL_ROWS = 10;

interface Props {
  squad: SyncedPlayer[];
}

export default function SquadTable({ squad }: Props) {
  const [showAll, setShowAll] = useState(false);

  const sorted = [...squad].sort(
    (a, b) => (POS_ORDER[a.position] ?? 5) - (POS_ORDER[b.position] ?? 5)
  );
  const visible = showAll ? sorted : sorted.slice(0, INITIAL_ROWS);
  const hidden = sorted.length - INITIAL_ROWS;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <th className="text-left pb-3 text-[10px] text-zinc-500 font-bold uppercase tracking-widest w-8">#</th>
              <th className="text-left pb-3 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Player</th>
              <th className="text-left pb-3 text-[10px] text-zinc-500 font-bold uppercase tracking-widest hidden sm:table-cell">Position</th>
              <th className="text-center pb-3 text-[10px] text-zinc-500 font-bold uppercase tracking-widest w-12">Age</th>
              <th className="text-center pb-3 text-[10px] text-zinc-500 font-bold uppercase tracking-widest w-12">Flag</th>
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
                  <td className="py-2.5 pr-3 text-zinc-600 font-mono text-xs tabular-nums">
                    {player.shirtNumber ?? "—"}
                  </td>
                  <td className="py-2.5 pr-4">
                    <Link href={`/players/${player.slug}`} className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: pos.bg, border: `1px solid ${pos.border}` }}
                      >
                        {player.photo_url ? (
                          <Image
                            src={player.photo_url}
                            alt={`${player.name} thumbnail`}
                            width={28}
                            height={28}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <span className="text-[9px] font-black" style={{ color: pos.color }}>
                            {player.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span
                        className="font-semibold text-white group-hover:opacity-60 transition-opacity"
                        style={{ letterSpacing: "-0.01em" }}
                      >
                        {player.name}
                      </span>
                      <span
                        className="sm:hidden text-[9px] font-bold px-1.5 py-0.5 rounded ml-1 shrink-0"
                        style={{ backgroundColor: pos.bg, color: pos.color, border: `1px solid ${pos.border}` }}
                      >
                        {pos.label}
                      </span>
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 hidden sm:table-cell">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: pos.bg, color: pos.color, border: `1px solid ${pos.border}` }}
                    >
                      {pos.label}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 text-center text-zinc-400 text-xs tabular-nums">
                    {age ?? "—"}
                  </td>
                  <td className="py-2.5 text-center">
                    <FlagImg nationality={player.nationality} size={20} />
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
          className="mt-4 w-full py-2.5 text-xs font-bold rounded-lg transition-colors"
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: showAll ? "#a1a1aa" : "#00FF87",
          }}
        >
          {showAll
            ? "Show less ↑"
            : `Show all ${sorted.length} players (+${hidden} more) ↓`}
        </button>
      )}
    </div>
  );
}
