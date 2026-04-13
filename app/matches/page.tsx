import type { Metadata } from "next";
import Link from "next/link";
import { matches } from "@/lib/data";
import MatchesAccordion from "@/components/MatchesAccordion";

export const metadata: Metadata = {
  title: "World Cup 2026 Matches — Fixtures, Previews & Odds | FootBrowse",
  description:
    "Browse all FIFA World Cup 2026 match previews, fixtures, head-to-head stats, betting odds and predictions on FootBrowse.",
};

const STAGE_ORDER = [
  "Group Stage",
  "Round of 32",
  "Round of 16",
  "Quarter Finals",
  "Semi Finals",
  "Third Place Play-off",
  "Final",
];

export default function MatchesPage() {
  // Build accordion sections
  const sections: { label: string; key: string; matches: typeof matches }[] = [];

  for (const stage of STAGE_ORDER) {
    const stageMatches = matches.filter((m) => m.stage === stage);
    if (stageMatches.length === 0) continue;

    if (stage === "Group Stage") {
      // One sub-section per group letter (A–L)
      const groups = Array.from(new Set(stageMatches.map((m) => m.group).filter(Boolean))).sort();
      for (const group of groups) {
        const groupMatches = stageMatches
          .filter((m) => m.group === group)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        sections.push({
          label: `Group ${group}`,
          key: `group-${group}`,
          matches: groupMatches,
        });
      }
    } else {
      sections.push({
        label: stage,
        key: stage,
        matches: stageMatches.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
      });
    }
  }

  return (
    <div className="space-y-8">

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">Matches</span>
      </nav>

      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-2 mb-3">
          <span className="badge-green">{matches.length} Fixtures</span>
          <span className="badge-blue">{sections.length} rounds</span>
        </div>
        <h1>World Cup 2026 Fixtures</h1>
        <p className="mt-2 text-zinc-400 text-sm">
          Tap any group or round to expand · click a match for full preview, odds &amp; predictions.
        </p>
      </div>

      {/* Legend row (desktop only) */}
      <div
        className="hidden sm:flex items-center px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-zinc-600"
        style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
      >
        <span className="flex-1 text-right pr-2">Home</span>
        <span className="w-20 text-center">Date / City</span>
        <span className="flex-1 pl-2">Away</span>
        <span className="w-32 text-right">Odds (1 / X / 2)</span>
        <span className="w-4" />
      </div>

      <MatchesAccordion sections={sections} />
    </div>
  );
}
