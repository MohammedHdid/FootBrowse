"use client";
import MatchLineup from "@/components/MatchLineup";
import type { MatchPageData } from "../../MatchPageClient";

export default function LineupsTab({ data }: { data: MatchPageData }) {
  if (!data.lineup) {
    return (
      <div className="section-block py-10 text-center">
        <p className="text-sm font-bold text-zinc-500 mb-1">Lineups Not Yet Announced</p>
        <p className="text-xs text-zinc-700">Confirmed starting XIs are typically released 60–90 minutes before kickoff.</p>
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    <MatchLineup lineup={data.lineup as any} homeName={data.homeName} awayName={data.awayName} />
  );
}
