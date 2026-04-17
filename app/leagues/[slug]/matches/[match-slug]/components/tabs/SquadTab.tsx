"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getPositionStyle } from "@/lib/positions";
import MatchFixedBottom from "../MatchFixedBottom";
import type { MatchPageData, InjuryItem, SyncedPlayerData } from "../../MatchPageClient";

const POS_ORDER: Record<string, number> = {
  Goalkeeper: 1,
  "Centre-Back": 2, "Right-Back": 2, "Left-Back": 2, Defence: 2, Defender: 2,
  "Central Midfield": 3, "Defensive Midfield": 3, "Right Midfield": 3,
  "Left Midfield": 3, Midfield: 3, Midfielder: 3,
  "Centre-Forward": 4, "Attacking Midfield": 4, "Right Winger": 4,
  "Left Winger": 4, "Second Striker": 4, Offence: 4, Forward: 4, Attacker: 4,
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

function AvailabilityBadge({ injury }: { injury: InjuryItem | null }) {
  if (!injury) return <span className="text-[10px] text-zinc-700">—</span>;
  const t = injury.type?.toLowerCase() ?? "";
  if (t.includes("suspend")) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-black"
        style={{ backgroundColor: "rgba(234,179,8,0.15)", color: "#EAB308", border: "1px solid rgba(234,179,8,0.3)" }}>
        S
      </span>
    );
  }
  if (t.includes("doubt")) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-black"
        style={{ backgroundColor: "rgba(249,115,22,0.15)", color: "#F97316", border: "1px solid rgba(249,115,22,0.3)" }}>
        ?
      </span>
    );
  }
  // Injury / other
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-black"
      style={{ backgroundColor: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" }}>
      +
    </span>
  );
}

const INITIAL_ROWS = 8;

function SquadTable({
  squad,
  injuries,
}: {
  squad: SyncedPlayerData[];
  injuries: InjuryItem[];
}) {
  const [showAll, setShowAll] = useState(false);

  if (squad.length === 0) {
    return (
      <p className="text-sm text-zinc-600 italic py-6 text-center rounded-xl"
        style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
        Squad not yet confirmed
      </p>
    );
  }

  // Build injury lookup by player id then by name as fallback
  const injuryById = new Map<number, InjuryItem>();
  const injuryByName = new Map<string, InjuryItem>();
  for (const inj of injuries) {
    injuryById.set(inj.player_id, inj);
    injuryByName.set(inj.player_name.toLowerCase(), inj);
  }

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
              <th className="text-left pb-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest w-7">#</th>
              <th className="text-left pb-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Player</th>
              <th className="text-center pb-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest w-10">AV</th>
              <th className="text-left pb-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Pos</th>
              <th className="text-center pb-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest w-10">Age</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((player) => {
              const pos = getPositionStyle(player.position);
              const age = calcAge(player.dateOfBirth);
              const injury = injuryById.get(player.id)
                ?? injuryByName.get(player.name.toLowerCase())
                ?? null;
              return (
                <tr key={player.slug}
                  className="group transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td className="py-2 pr-2 text-zinc-600 font-mono text-xs tabular-nums">
                    {player.shirtNumber ?? "—"}
                  </td>
                  <td className="py-2 pr-3">
                    <Link href={`/players/${player.slug}`} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: pos.bg, border: `1px solid ${pos.border}` }}>
                        {player.photo_url ? (
                          <Image src={player.photo_url} alt={player.name} width={24} height={24}
                            className="w-full h-full object-cover object-top" />
                        ) : (
                          <span className="text-[8px] font-black" style={{ color: pos.color }}>
                            {player.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-white text-xs group-hover:opacity-60 transition-opacity truncate"
                        style={{ letterSpacing: "-0.01em" }}>
                        {player.name}
                      </span>
                    </Link>
                  </td>
                  <td className="py-2 text-center">
                    <AvailabilityBadge injury={injury} />
                  </td>
                  <td className="py-2 pr-2">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: pos.bg, color: pos.color, border: `1px solid ${pos.border}` }}>
                      {pos.label}
                    </span>
                  </td>
                  <td className="py-2 text-center text-zinc-400 text-xs tabular-nums">{age ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {sorted.length > INITIAL_ROWS && (
        <button onClick={() => setShowAll((v) => !v)}
          className="mt-3 w-full py-2 text-xs font-bold rounded-lg transition-colors"
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: showAll ? "#a1a1aa" : "#00FF87",
          }}>
          {showAll ? "Show less ↑" : `Show all ${sorted.length} (+${hidden} more) ↓`}
        </button>
      )}
    </div>
  );
}

export default function SquadTab({ data }: { data: MatchPageData }) {
  const [activeTeam, setActiveTeam] = useState<"home" | "away">("home");

  if (data.squadA.length === 0 && data.squadB.length === 0) {
    return (
      <>
        <div className="section-block py-10 text-center">
          <p className="text-zinc-600 text-sm">Squad data not available.</p>
        </div>
        <MatchFixedBottom data={data} />
      </>
    );
  }

  const teams = [
    { key: "home" as const, name: data.homeName, logo: data.homeLogo, squad: data.squadA as SyncedPlayerData[], injuries: data.homeInjuries as InjuryItem[] },
    { key: "away" as const, name: data.awayName, logo: data.awayLogo, squad: data.squadB as SyncedPlayerData[], injuries: data.awayInjuries as InjuryItem[] },
  ];
  const active = teams.find((t) => t.key === activeTeam)!;

  return (
    <div className="space-y-6">
      <section className="section-block">
        <h2 className="section-title text-xl mb-4">Squad</h2>

        {/* Team switcher */}
        <div className="flex gap-2 mb-5">
          {teams.map(({ key, name, logo, squad }) => (
            <button key={key} onClick={() => setActiveTeam(key)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold transition-all"
              style={activeTeam === key
                ? { backgroundColor: "#00FF87", color: "#0a0a0a" }
                : { backgroundColor: "rgba(255,255,255,0.05)", color: "#a1a1aa", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Image src={logo} alt={name} width={16} height={16} className="object-contain" unoptimized />
              <span className="truncate">{name}</span>
              {squad.length > 0 && (
                <span className="text-[10px] opacity-70">({squad.length})</span>
              )}
            </button>
          ))}
        </div>

        <SquadTable squad={active.squad} injuries={active.injuries} />
      </section>

      <MatchFixedBottom data={data} />
    </div>
  );
}
