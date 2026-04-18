import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "Search — Teams, Players & Matches | FootBrowse",
  description: "Search FootBrowse for teams, players, and matches across the World Cup 2026, Premier League, La Liga, Bundesliga, and UEFA Champions League.",
  alternates: { canonical: "https://footbrowse.com/search" },
};

export default function SearchPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">Search</span>
      </nav>

      {/* Header */}
      <header>
        <h1 className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>
          Search FootBrowse
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Teams · Players · Matches
        </p>
      </header>

      <Suspense fallback={
        <div className="animate-pulse rounded-xl h-14 w-full"
          style={{ backgroundColor: "rgba(24,24,27,0.9)", border: "1px solid rgba(63,63,70,0.8)" }} />
      }>
        <SearchClient />
      </Suspense>

    </div>
  );
}
