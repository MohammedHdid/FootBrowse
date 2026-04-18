"use client";

import { useState } from "react";
import Link from "next/link";
import MatchFlagImg from "@/components/MatchFlagImg";

interface MatchTeam {
  name: string;
  code: string;
  flag_url: string;
  fifa_rank: number;
  slug: string;
}

interface MatchOdds {
  team_a_win: number;
  draw: number;
  team_b_win: number;
}

interface Match {
  slug: string;
  stage: string;
  group?: string | null;
  date: string;
  city: string;
  kickoff_utc: string;
  team_a: MatchTeam;
  team_b: MatchTeam;
  odds?: MatchOdds[] | null;
}

interface Section {
  label: string;
  key: string;
  matches: Match[];
}

interface Props {
  sections: Section[];
}

function MatchRow({ match }: { match: Match }) {
  const date = new Date(match.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  // Show only the city name (before any comma)
  const city = match.city.split(",")[0].trim();

  return (
    <Link
      href={`/matches/${match.slug}`}
      className="flex items-center gap-2 sm:gap-3 px-3 py-3 transition-colors hover:bg-white/[0.03] group"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
    >
      {/* Team A */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
        <span
          className="font-bold text-white text-xs sm:text-sm truncate text-right"
          style={{ letterSpacing: "-0.01em" }}
        >
          {match.team_a.name}
        </span>
        <MatchFlagImg src={match.team_a.flag_url} alt={match.team_a.name} />
      </div>

      {/* Centre: date · time · VS · city */}
      <div className="flex flex-col items-center shrink-0 w-20 sm:w-28">
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          {date}
        </span>
        <span className="text-[9px] text-slate-500 mt-0.5 tabular-nums">
          {match.kickoff_utc} UTC
        </span>
        <span
          className="text-[10px] font-black mt-1"
          style={{ color: "#00FF87", letterSpacing: "0.05em" }}
        >
          VS
        </span>
        <span className="text-[9px] text-slate-400 mt-0.5 text-center leading-tight truncate max-w-full">
          {city}
        </span>
      </div>

      {/* Team B */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <MatchFlagImg src={match.team_b.flag_url} alt={match.team_b.name} />
        <span
          className="font-bold text-white text-xs sm:text-sm truncate"
          style={{ letterSpacing: "-0.01em" }}
        >
          {match.team_b.name}
        </span>
      </div>

      {/* Odds + arrow */}
      <div className="hidden sm:flex items-center gap-3 shrink-0 ml-2">
        {match.odds && match.odds.length > 0 && (
          <div className="flex gap-2 text-[10px] font-bold tabular-nums">
            <span style={{ color: "#00FF87" }}>{match.odds[0].team_a_win.toFixed(2)}</span>
            <span className="text-slate-500">{match.odds[0].draw.toFixed(2)}</span>
            <span className="text-blue-400">{match.odds[0].team_b_win.toFixed(2)}</span>
          </div>
        )}
        <span
          className="text-[10px] font-bold group-hover:opacity-100 opacity-40 transition-opacity"
          style={{ color: "#00FF87" }}
        >
          →
        </span>
      </div>

      {/* Mobile arrow only */}
      <span
        className="sm:hidden text-[10px] font-bold shrink-0 opacity-30 group-hover:opacity-100 transition-opacity"
        style={{ color: "#00FF87" }}
      >
        →
      </span>
    </Link>
  );
}

function AccordionSection({
  label,
  matches,
  defaultOpen,
}: {
  label: string;
  matches: Match[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid #334155" }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-slate-700/50"
        style={{ backgroundColor: "#1e293b" }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="font-black text-white text-sm"
            style={{ letterSpacing: "-0.02em" }}
          >
            {label}
          </span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded tabular-nums"
            style={{
              backgroundColor: "rgba(0,255,135,0.1)",
              color: "#00FF87",
              border: "1px solid rgba(0,255,135,0.2)",
            }}
          >
            {matches.length}
          </span>
        </div>
        <span
          className="text-slate-400 text-sm transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>

      {/* Rows */}
      {open && (
        <div>
          {matches.map((match) => (
            <MatchRow key={match.slug} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MatchesAccordion({ sections }: Props) {
  return (
    <div className="space-y-3">
      {sections.map((section, i) => (
        <AccordionSection
          key={section.key}
          label={section.label}
          matches={section.matches}
          defaultOpen={i === 0}
        />
      ))}
    </div>
  );
}
