import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { stadiums } from "@/lib/data";

export const metadata: Metadata = {
  title: "World Cup 2026 Stadiums — Venues, Capacity & Travel | FootBrowse",
  description:
    "Explore the official FIFA World Cup 2026 stadiums — capacity, surface, location, transport and hosted matches on FootBrowse.",
};

export default function StadiumsPage() {
  return (
    <div className="space-y-8">

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">Stadiums</span>
      </nav>

      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-2 mb-3">
          <span className="badge-green">{stadiums.length} Venues</span>
        </div>
        <h1>World Cup 2026 Stadiums</h1>
        <p className="mt-2 text-zinc-400 text-sm">
          Venue capacity, surface type, transport links, hotel affiliates and World Cup 2026 match schedules.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stadiums.map((stadium) => (
          <Link key={stadium.slug} href={`/stadiums/${stadium.slug}`} className="entity-card block">
            {/* Photo thumbnail */}
            {(stadium.sportsdb_photos?.[0] || stadium.photo_url) && (
              <div className="overflow-hidden rounded-lg mb-3 -mx-1 -mt-1" style={{ height: 120 }}>
                <Image
                  src={stadium.sportsdb_photos?.[0] || stadium.photo_url}
                  alt={`${stadium.name} thumbnail`}
                  width={400}
                  height={120}
                  className="w-full h-full object-cover opacity-70 hover:opacity-90 transition-opacity"
                  style={{ objectPosition: "center 40%" }}
                />
              </div>
            )}

            <div className="flex items-start justify-between mb-2">
              <p
                className="font-black text-white leading-tight"
                style={{ letterSpacing: "-0.02em" }}
              >
                {stadium.name}
              </p>
              {stadium.is_final_venue && (
                <span className="badge-green ml-2 shrink-0">Final</span>
              )}
            </div>
            <p className="text-sm text-zinc-400">📍 {stadium.city}, {stadium.state}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="stat-label">Capacity</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {stadium.capacity.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="stat-label">WC Matches</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: "#00FF87" }}>
                  {stadium.wc_matches}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-600">
              {stadium.surface} · {stadium.roof} roof · Opened {stadium.opened}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
