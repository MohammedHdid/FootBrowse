"use client";
import Image from "next/image";
import Link from "next/link";

interface Props {
  leagueSlug: string;
  leagueName: string;
  leagueLogo: string;
  isWC: boolean;
  group: string | null;
  stage: string | null;
  fixtureStatusLabel: string;
  finished: boolean;
  live: boolean;
  matchday: number | null;
  homeName: string;
  awayName: string;
  homeLogo: string;
  awayLogo: string;
  homeSlug: string;
  awaySlug: string;
  homeIsFlag: boolean;
  awayIsFlag: boolean;
  homeFifaRank: number | null;
  awayFifaRank: number | null;
  homeRecord: string | null;
  awayRecord: string | null;
  score: { home: number | null; away: number | null };
  kickoffUtc: string;
  kickoffEst: string | null;
  matchDate: string;
  city: string | null;
  venueName: string | null;
}

export default function MatchHero(p: Props) {
  const statusColor = p.live ? "#EF4444" : p.finished ? "#71717A" : "#00FF87";
  const statusBg    = p.live ? "rgba(239,68,68,0.1)" : p.finished ? "rgba(255,255,255,0.06)" : "rgba(0,255,135,0.1)";

  return (
    <div className="px-4 pt-4 pb-5"
      style={{ backgroundColor: "#0a0a0a", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      {/* League + status row */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Image src={p.leagueLogo} alt={p.leagueName} width={18} height={18} className="object-contain rounded-sm" unoptimized />
        <Link href={`/leagues/${p.leagueSlug}`}
          className="text-xs font-bold text-zinc-400 hover:text-white transition-colors">
          {p.leagueName}
        </Link>
        {p.isWC && p.group && <span className="badge-green">Group {p.group}</span>}
        {!p.isWC && p.stage && <span className="tag text-xs">{p.stage}</span>}
        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ color: statusColor, backgroundColor: statusBg }}>
          {p.fixtureStatusLabel}
        </span>
      </div>

      {/* Teams + score/VS */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-center">
          <Link href={`/leagues/${p.leagueSlug}/teams/${p.homeSlug}`}>
            {p.homeIsFlag ? (
              <Image src={p.homeLogo} alt={p.homeName} width={160} height={107} priority
                className="mx-auto rounded shadow-lg object-cover" style={{ height: 72, width: "auto" }} />
            ) : (
              <Image src={p.homeLogo} alt={p.homeName} width={72} height={72} priority unoptimized
                className="mx-auto object-contain" style={{ height: 64, width: "auto" }} />
            )}
            <p className="mt-3 text-xl sm:text-2xl font-black text-white hover:opacity-70 transition-opacity"
              style={{ letterSpacing: "-0.03em" }}>{p.homeName}</p>
          </Link>
          {p.homeFifaRank != null && (
            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">FIFA #{p.homeFifaRank}</p>
          )}
          {p.homeRecord && <p className="text-xs text-zinc-500 mt-1">{p.homeRecord}</p>}
        </div>

        <div className="text-center px-2 sm:px-6 shrink-0">
          {p.finished || p.live ? (
            <>
              <p className="text-4xl sm:text-5xl font-black text-white tabular-nums"
                style={{ letterSpacing: "-0.05em" }}>
                {p.score.home ?? 0}<span className="mx-2 text-zinc-600">–</span>{p.score.away ?? 0}
              </p>
              <p className="text-xs font-bold mt-1 uppercase tracking-widest" style={{ color: statusColor }}>
                {p.fixtureStatusLabel}
              </p>
            </>
          ) : (
            <>
              <p className="text-4xl sm:text-5xl font-black" style={{ color: "#00FF87", letterSpacing: "-0.04em" }}>VS</p>
              <p className="text-xs text-zinc-600 mt-1 uppercase tracking-widest">{p.kickoffUtc} UTC</p>
            </>
          )}
        </div>

        <div className="flex-1 text-center">
          <Link href={`/leagues/${p.leagueSlug}/teams/${p.awaySlug}`}>
            {p.awayIsFlag ? (
              <Image src={p.awayLogo} alt={p.awayName} width={160} height={107} priority
                className="mx-auto rounded shadow-lg object-cover" style={{ height: 72, width: "auto" }} />
            ) : (
              <Image src={p.awayLogo} alt={p.awayName} width={72} height={72} priority unoptimized
                className="mx-auto object-contain" style={{ height: 64, width: "auto" }} />
            )}
            <p className="mt-3 text-xl sm:text-2xl font-black text-white hover:opacity-70 transition-opacity"
              style={{ letterSpacing: "-0.03em" }}>{p.awayName}</p>
          </Link>
          {p.awayFifaRank != null && (
            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">FIFA #{p.awayFifaRank}</p>
          )}
          {p.awayRecord && <p className="text-xs text-zinc-500 mt-1">{p.awayRecord}</p>}
        </div>
      </div>

      {/* Meta row */}
      <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-zinc-400"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.25rem" }}>
        <span>📅 {new Date(p.matchDate).toLocaleDateString("en-US", {
          weekday: "long", month: "long", day: "numeric", year: "numeric",
        })}</span>
        <span>🕐 {p.kickoffUtc} UTC{p.kickoffEst ? ` · ${p.kickoffEst} EST` : ""}</span>
        {p.city && <span>📍 {p.city}</span>}
        {!p.city && p.venueName && <span>📍 {p.venueName}</span>}
        {p.matchday != null && <span className="text-zinc-500">Matchday {p.matchday}</span>}
      </div>
    </div>
  );
}
