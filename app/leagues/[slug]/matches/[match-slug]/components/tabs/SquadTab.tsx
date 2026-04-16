"use client";
import MatchSquads from "@/components/MatchSquads";
import type { MatchPageData } from "../../MatchPageClient";

export default function SquadTab({ data }: { data: MatchPageData }) {
  if (data.squadA.length === 0 && data.squadB.length === 0) {
    return (
      <div className="section-block py-10 text-center">
        <p className="text-zinc-600 text-sm">Squad data not available.</p>
      </div>
    );
  }

  return (
    <MatchSquads
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      teamA={data.teamAInfo as any}
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      teamB={data.teamBInfo as any}
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      squadA={data.squadA as any}
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      squadB={data.squadB as any}
    />
  );
}
