"use client";
import Image from "next/image";
import MatchLineup from "@/components/MatchLineup";
import InjuryList from "@/components/InjuryList";
import MatchFixedBottom from "../MatchFixedBottom";
import type { MatchPageData } from "../../MatchPageClient";

export default function LineupsTab({ data }: { data: MatchPageData }) {
  const hasInjuries = data.homeInjuries.length > 0 || data.awayInjuries.length > 0;

  return (
    <div className="space-y-6">
      {data.lineup ? (
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        <MatchLineup lineup={data.lineup as any} homeName={data.homeName} awayName={data.awayName} />
      ) : (
        <div className="section-block py-10 text-center">
          <p className="text-sm font-bold text-zinc-500 mb-1">Lineups Not Yet Announced</p>
          <p className="text-xs text-zinc-700">Confirmed starting XIs are typically released 60–90 minutes before kickoff.</p>
        </div>
      )}

      {/* Availability / Injuries */}
      {hasInjuries && (
        <section className="section-block">
          <h2 className="section-title text-xl mb-5">Availability</h2>
          <div className="grid grid-cols-2 gap-6">
            {[
              { name: data.homeName, logo: data.homeLogo, injuries: data.homeInjuries },
              { name: data.awayName, logo: data.awayLogo, injuries: data.awayInjuries },
            ].map(({ name, logo, injuries }) => (
              <div key={name}>
                <div className="flex items-center gap-2 mb-3">
                  <Image src={logo} alt={name} width={16} height={16} className="object-contain" unoptimized />
                  <span className="text-xs font-bold text-zinc-400 truncate">{name}</span>
                </div>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <InjuryList injuries={injuries as any} compact />
                {injuries.length === 0 && <p className="text-xs text-zinc-600 italic">No reports</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <MatchFixedBottom data={data} />
    </div>
  );
}
