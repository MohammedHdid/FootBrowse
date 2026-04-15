import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAllLeagues, getLeague, formatSeason } from "@/lib/leagues";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return getAllLeagues().map((l) => ({ slug: l.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const league = getLeague(params.slug);
  if (!league) return {};
  const season = formatSeason(league);
  return {
    title: `${league.name} ${season} Standings, Fixtures & Teams | FootBrowse`,
    description: `Follow the ${league.name} ${season} season — fixtures, standings, team profiles and top scorers on FootBrowse.`,
    alternates: { canonical: `https://footbrowse.com/leagues/${league.slug}` },
  };
}

const TABS = [
  { label: "Overview",  href: (slug: string) => `/leagues/${slug}` },
  { label: "Fixtures",  href: (slug: string) => `/leagues/${slug}/matches` },
  { label: "Standings", href: (slug: string) => `/leagues/${slug}/standings` },
  { label: "Teams",     href: (slug: string) => `/leagues/${slug}/teams` },
  { label: "Players",   href: (slug: string) => `/leagues/${slug}/players` },
];

export default function LeaguePage({ params }: Props) {
  const league = getLeague(params.slug);
  if (!league) notFound();

  const season = formatSeason(league);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",    item: "https://footbrowse.com" },
      { "@type": "ListItem", position: 2, name: "Leagues", item: "https://footbrowse.com/leagues" },
      { "@type": "ListItem", position: 3, name: league.name, item: `https://footbrowse.com/leagues/${league.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="space-y-8">

        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumb-sep">›</span>
          <Link href="/leagues">Leagues</Link>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">{league.name}</span>
        </nav>

        {/* Hero */}
        <div className="page-header">
          <div className="flex items-start gap-5">
            {/* Logo */}
            <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.08] p-2.5">
              <Image
                src={league.logo}
                alt={`${league.name} logo`}
                width={60}
                height={60}
                className="object-contain"
                unoptimized
              />
            </div>

            {/* Title block */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="badge-green">{league.type}</span>
                <span className="tag">{season}</span>
                {league.flag && (
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Image
                      src={league.flag}
                      alt={league.country}
                      width={14}
                      height={10}
                      className="rounded-sm object-cover"
                      unoptimized
                    />
                    {league.country}
                  </span>
                )}
                {!league.flag && (
                  <span className="text-xs text-zinc-500">{league.country}</span>
                )}
              </div>
              <h1>{league.name}</h1>
              {league.seasonStart && league.seasonEnd && (
                <p className="mt-1.5 text-xs text-zinc-500">
                  {new Date(league.seasonStart).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {" "}–{" "}
                  {new Date(league.seasonEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div
          className="flex gap-1 overflow-x-auto pb-1 -mb-2"
          style={{ borderBottom: "1px solid rgba(39,39,42,0.7)" }}
        >
          {TABS.map((tab) => {
            const isOverview = tab.label === "Overview";
            return (
              <Link
                key={tab.label}
                href={tab.href(league.slug)}
                className={[
                  "shrink-0 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors rounded-t",
                  isOverview
                    ? "text-white border-b-2"
                    : "text-zinc-500 hover:text-zinc-300",
                ].join(" ")}
                style={isOverview ? { borderBottomColor: "#00FF87" } : {}}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Coming soon placeholders */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Fixtures placeholder */}
          <div className="section-block flex flex-col gap-3">
            <p className="section-title text-sm">Upcoming Fixtures</p>
            <p className="text-xs text-zinc-600">
              Fixtures sync coming in the next update.
            </p>
            <Link
              href={`/leagues/${league.slug}/matches`}
              className="arrow-link text-xs mt-auto"
            >
              View all fixtures →
            </Link>
          </div>

          {/* Standings placeholder */}
          <div className="section-block flex flex-col gap-3">
            <p className="section-title text-sm">Standings</p>
            <p className="text-xs text-zinc-600">
              League table coming in the next update.
            </p>
            <Link
              href={`/leagues/${league.slug}/standings`}
              className="arrow-link text-xs mt-auto"
            >
              View full table →
            </Link>
          </div>

          {/* Top scorers placeholder */}
          {league.topScorers && (
            <div className="section-block flex flex-col gap-3">
              <p className="section-title text-sm">Top Scorers</p>
              <p className="text-xs text-zinc-600">
                Scorer stats coming in the next update.
              </p>
              <Link
                href={`/leagues/${league.slug}/players`}
                className="arrow-link text-xs mt-auto"
              >
                View top scorers →
              </Link>
            </div>
          )}
        </div>

        {/* Season info block */}
        <div className="section-block">
          <p className="section-title text-sm mb-4">Season Info</p>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <dt className="stat-label">Season</dt>
              <dd className="text-sm font-black text-white mt-1">{season}</dd>
            </div>
            <div>
              <dt className="stat-label">Type</dt>
              <dd className="text-sm font-black text-white mt-1">{league.type}</dd>
            </div>
            <div>
              <dt className="stat-label">Country</dt>
              <dd className="text-sm font-black text-white mt-1">{league.country}</dd>
            </div>
            <div>
              <dt className="stat-label">Standings</dt>
              <dd
                className="text-sm font-black mt-1"
                style={{ color: league.standings ? "#00FF87" : "#71717A" }}
              >
                {league.standings ? "Available" : "N/A"}
              </dd>
            </div>
          </dl>
        </div>

      </div>
    </>
  );
}
