import type { Metadata } from "next";
import Link from "next/link";
import { stadiums } from "@/lib/data";

export const metadata: Metadata = {
  title: "World Cup 2026 Stadiums",
  description:
    "Explore the official FIFA World Cup 2026 stadiums — capacity, surface, location, and hosted matches on FootBrowse.",
};

export default function StadiumsPage() {
  return (
    <div className="space-y-8">
      <div className="border-b border-zinc-800 pb-6">
        <h1>World Cup 2026 Stadiums</h1>
        <p className="mt-2 text-zinc-400">
          {stadiums.length} stadium guides — venue capacity, surface type,
          location, and World Cup 2026 match schedules.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stadiums.map((stadium) => (
          <Link
            key={stadium.slug}
            href={`/stadiums/${stadium.slug}`}
            className="block section-block hover:border-emerald-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="font-bold text-white text-base leading-tight">
                {stadium.name}
              </p>
              {stadium.hostingFinal && (
                <span className="tag text-emerald-400 border-emerald-800 ml-2 shrink-0">
                  Final
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-400">
              {stadium.city}, {stadium.state}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <p className="stat-label">Capacity</p>
                <p className="text-sm font-semibold text-white">
                  {stadium.capacity.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="stat-label">WC Matches</p>
                <p className="text-sm font-semibold text-white">
                  {stadium.worldCup2026Matches}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              {stadium.surface} · Opened {stadium.opened}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
