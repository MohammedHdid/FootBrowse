"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AdSlot from "@/components/AdSlot";

export interface PlayerStatSeason {
  season: number;
  club: string;
  club_logo: string;
  league: string;
  appearances: number;
  goals: number;
  assists: number;
  minutes: number;
}

export interface RelatedPlayerItem {
  slug: string;
  name: string;
  position: string;
  posLabel: string;
  posColor: string;
  posBg: string;
  posBorder: string;
  photo_url: string | null;
  teamCrest: string;
  teamName: string;
}

export interface PlayerPageData {
  slug: string;
  name: string;
  position: string;
  posLabel: string;
  posColor: string;
  posBg: string;
  posBorder: string;
  photoSrc: string | null;
  shirtNumber: number | null;
  dateOfBirth: string | null;
  age: number | null;
  nationality: string;
  teamName: string;
  teamSlug: string;
  teamCrest: string;
  teamHref: string;
  marketValueFmt: string;
  bio: string | null;
  isClub: boolean;
  seasons: PlayerStatSeason[];
  relatedPlayers: RelatedPlayerItem[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function FlagFallback({ nationality, size = 18 }: { nationality: string; size?: number }) {
  return (
    <span className="text-xs text-zinc-500" style={{ fontSize: size * 0.7 }}>
      {nationality.slice(0, 2).toUpperCase()}
    </span>
  );
}

const TABS = ["Overview", "Stats"] as const;
type Tab = (typeof TABS)[number];

// ── Component ─────────────────────────────────────────────────────────────────

export default function PlayerPageClient({ data }: { data: PlayerPageData }) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  const pos = { color: data.posColor, bg: data.posBg, border: data.posBorder, label: data.posLabel };

  return (
    <>
      {/* Sticky tab bar */}
      <div className="sticky top-14 z-40 overflow-x-auto"
        style={{ backgroundColor: "#0a0a0a", borderBottom: "1px solid rgba(39,39,42,0.7)" }}>
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                "shrink-0 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap",
                activeTab === tab
                  ? "text-white border-b-2"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]",
              ].join(" ")}
              style={activeTab === tab ? { borderBottomColor: "#00FF87" } : {}}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6 pt-6 pb-8">

        <AdSlot slot="1234567890" format="auto" />

        {/* ── OVERVIEW tab ── */}
        {activeTab === "Overview" && (
          <>
            {/* Quick stat pills */}
            <div className="flex flex-wrap gap-2">
              {data.age !== null && (
                <div className="rounded-lg px-3 py-2 text-center min-w-[56px]"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Age</p>
                  <p className="text-lg font-black text-white tabular-nums mt-0.5">{data.age}</p>
                </div>
              )}
              {data.shirtNumber && (
                <div className="rounded-lg px-3 py-2 text-center min-w-[56px]"
                  style={{ backgroundColor: pos.bg, border: `1px solid ${pos.border}` }}>
                  <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: pos.color, opacity: 0.7 }}>No.</p>
                  <p className="text-lg font-black tabular-nums mt-0.5" style={{ color: pos.color }}>#{data.shirtNumber}</p>
                </div>
              )}
              {data.dateOfBirth && (
                <div className="rounded-lg px-3 py-2 text-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Born</p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {new Date(data.dateOfBirth).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              )}
              {data.marketValueFmt !== "N/A" && (
                <div className="rounded-lg px-3 py-2 text-center"
                  style={{ backgroundColor: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
                  <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">Value</p>
                  <p className="text-sm font-black text-blue-300 mt-0.5">{data.marketValueFmt}</p>
                </div>
              )}
            </div>

            {/* Bio */}
            <section className="section-block">
              <h2 className="section-title text-xl mb-4">Player Profile</h2>
              <p className="text-zinc-300 leading-relaxed text-sm">
                {data.bio || `${data.name} is a professional footballer playing as ${data.position} for ${data.teamName}.`}
              </p>
            </section>

            {/* Player Details */}
            <section>
              <h2 className="section-title text-xl mb-4">Player Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="stat-card">
                  <p className="stat-label">Position</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: pos.color }}>{pos.label}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{data.position}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Nationality</p>
                  <p className="text-sm font-bold text-white mt-0.5">{data.nationality}</p>
                </div>
              </div>
            </section>

            {/* Related players */}
            {data.relatedPlayers.length > 0 && (
              <section>
                <h2 className="section-title text-xl mb-4">More {data.teamName} Players</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {data.relatedPlayers.map((rel) => (
                    <Link key={rel.slug} href={`/players/${rel.slug}`}
                      className="entity-card flex items-center gap-3 group">
                      <div className="shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
                        style={{ width: 44, height: 52, backgroundColor: rel.posBg, border: `1px solid ${rel.posBorder}` }}>
                        {rel.photo_url ? (
                          <Image src={rel.photo_url} alt={rel.name} width={44} height={52}
                            className="w-full h-full object-cover object-top" unoptimized />
                        ) : (
                          <span className="text-xs font-black" style={{ color: rel.posColor }}>{rel.posLabel}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{rel.name}</p>
                        <p className="text-[10px] font-bold mt-0.5" style={{ color: rel.posColor }}>{rel.posLabel}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* ── STATS tab ── */}
        {activeTab === "Stats" && (
          <>
            {data.seasons.length > 0 ? (
              <section className="section-block">
                <h2 className="section-title text-xl mb-4">Season Stats</h2>
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-600">
                        <th className="text-left pb-3 pr-3">Season</th>
                        <th className="text-left pb-3 pr-3">Club</th>
                        <th className="text-left pb-3 pr-3">League</th>
                        <th className="text-right pb-3 pr-3">Apps</th>
                        <th className="text-right pb-3 pr-3">Goals</th>
                        <th className="text-right pb-3 pr-3">Assists</th>
                        <th className="text-right pb-3">Mins</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.seasons.map((s, i) => (
                        <tr key={i} className="border-t border-white/[0.04]">
                          <td className="py-2.5 pr-3 text-zinc-400 tabular-nums">
                            {s.season}/{String(s.season + 1).slice(2)}
                          </td>
                          <td className="py-2.5 pr-3">
                            <div className="flex items-center gap-2">
                              <Image src={s.club_logo} alt={s.club} width={16} height={16} className="object-contain shrink-0" />
                              <span className="font-semibold text-zinc-200 truncate max-w-[100px]">{s.club}</span>
                            </div>
                          </td>
                          <td className="py-2.5 pr-3 text-zinc-400 text-xs">{s.league}</td>
                          <td className="py-2.5 pr-3 text-right tabular-nums text-zinc-300">{s.appearances}</td>
                          <td className="py-2.5 pr-3 text-right tabular-nums font-bold"
                            style={{ color: s.goals > 0 ? "#00FF87" : "#52525b" }}>{s.goals}</td>
                          <td className="py-2.5 pr-3 text-right tabular-nums font-bold"
                            style={{ color: s.assists > 0 ? "#3B82F6" : "#52525b" }}>{s.assists}</td>
                          <td className="py-2.5 text-right tabular-nums text-zinc-500 text-xs">
                            {s.minutes.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : (
              <div className="section-block py-10 text-center">
                <p className="text-zinc-500 text-sm">No season stats available.</p>
              </div>
            )}

          </>
        )}

      </div>
    </>
  );
}
