import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAllPlayers, getPlayer, getTeamPlayers } from "@/lib/data";
import { getClubTeamPlayers } from "@/lib/club-players";
import { getPositionStyle } from "@/lib/positions";
import { getPlayerStats } from "@/lib/player-stats";
import FlagImg from "@/components/FlagImg";
import PlayerPageClient, { type PlayerPageData } from "./PlayerPageClient";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return getAllPlayers().map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const player = getPlayer(params.slug);
  if (!player) return {};
  const isClub = !!player.primaryLeagueSlug;
  const title = isClub
    ? `${player.name} — ${player.teamName} Player Profile & Stats | FootBrowse`
    : `${player.name} — World Cup 2026 Stats & Profile | FootBrowse`;
  const description = isClub
    ? `${player.name} plays as ${player.position} for ${player.teamName}. View profile, squad info and career stats on FootBrowse.`
    : `${player.name} is a ${player.nationality} ${player.position} representing ${player.teamName} at the 2026 FIFA World Cup. View stats, profile and squad info on FootBrowse.`;
  return {
    title,
    description,
    alternates: { canonical: `https://footbrowse.com/players/${params.slug}` },
  };
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatMarketValue(val: number | null): string {
  if (!val) return "N/A";
  if (val >= 1_000_000_000) return `€${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `€${Math.round(val / 1_000_000)}M`;
  return `€${(val / 1_000).toFixed(0)}K`;
}


export default function PlayerPage({ params }: Props) {
  const player = getPlayer(params.slug);
  if (!player) notFound();

  const pos = getPositionStyle(player.position);
  const age = calcAge(player.dateOfBirth);
  const isClub = !!player.primaryLeagueSlug;
  const teamHref = isClub
    ? `/leagues/${player.primaryLeagueSlug}/teams/${player.teamSlug}`
    : `/teams/${player.teamSlug}`;
  const relatedPlayers = (
    isClub ? getClubTeamPlayers(player.teamSlug) : getTeamPlayers(player.teamSlug)
  ).filter((p) => p.slug !== player.slug).slice(0, 4);
  const playerStats = getPlayerStats(player.slug);
  const photoSrc = playerStats?.api_photo ?? player.photo_url;


  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://footbrowse.com" },
      { "@type": "ListItem", "position": 2, "name": "Players", "item": "https://footbrowse.com/players" },
      { "@type": "ListItem", "position": 3, "name": player.name, "item": `https://footbrowse.com/players/${player.slug}` }
    ]
  };

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": player.name,
    "jobTitle": "Professional Footballer",
    "nationality": {
      "@type": "Country",
      "name": player.nationality
    },
    "memberOf": [
      {
        "@type": "SportsTeam",
        "name": player.teamName,
        "url": `https://footbrowse.com/teams/${player.teamSlug}`
      }
    ],
    "image": player.photo_url || `https://footbrowse.com/favicon-96x96.png`,
    "description": player.bio || `${player.name} is a professional footballer playing as ${player.position} for ${player.teamName}.`,
    "birthDate": player.dateOfBirth
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <article className="space-y-8">

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{player.name}</span>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <header className="page-header">
        <div className="flex items-start gap-5 flex-wrap sm:flex-nowrap">

          {/* Photo or stylish fallback */}
          <div
            className="rounded-2xl shrink-0 overflow-hidden flex items-center justify-center"
            style={{
              width: 140,
              height: 160,
              backgroundColor: pos.bg,
              border: `1px solid ${pos.border}`,
              boxShadow: `0 0 40px ${pos.color}20`,
            }}
          >
            {photoSrc ? (
              <Image
                src={photoSrc}
                alt={`${player.name} profile photo`}
                width={140}
                height={160}
                priority
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 p-4">
                <FlagImg nationality={player.nationality} size={40} />

                <span
                  className="text-4xl font-black tabular-nums leading-none"
                  style={{ color: pos.color }}
                >
                  {player.shirtNumber ?? "?"}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Position badge row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded"
                style={{ backgroundColor: pos.bg, color: pos.color, border: `1px solid ${pos.border}` }}
              >
                {pos.label}
              </span>
              <span className="badge-blue">{player.position}</span>
            </div>

            {/* Name */}
            <h1
              className="text-3xl sm:text-4xl font-black text-white"
              style={{ letterSpacing: "-0.04em" }}
            >
              {player.name}
            </h1>

            {/* Nationality / club — clicks through to team page */}
            <div className="mt-2">
              <Link
                href={teamHref}
                className="inline-flex items-center gap-1.5 font-semibold text-zinc-300 hover:opacity-70 transition-opacity text-sm"
              >
                {player.nationality ? (
                  <FlagImg nationality={player.nationality} size={18} />
                ) : (
                  <Image
                    src={player.teamCrest}
                    alt={player.teamName}
                    width={18}
                    height={18}
                    className="object-contain"
                  />
                )}
                {player.nationality || player.teamName}
              </Link>
            </div>

            {/* Quick-stat pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              {age !== null && (
                <div
                  className="rounded-lg px-3 py-2 text-center min-w-[56px]"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Age</p>
                  <p className="text-lg font-black text-white tabular-nums mt-0.5">{age}</p>
                </div>
              )}
              {player.shirtNumber && (
                <div
                  className="rounded-lg px-3 py-2 text-center min-w-[56px]"
                  style={{ backgroundColor: pos.bg, border: `1px solid ${pos.border}` }}
                >
                  <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: pos.color, opacity: 0.7 }}>No.</p>
                  <p className="text-lg font-black tabular-nums mt-0.5" style={{ color: pos.color }}>#{player.shirtNumber}</p>
                </div>
              )}
              {player.dateOfBirth && (
                <div
                  className="rounded-lg px-3 py-2 text-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Born</p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {new Date(player.dateOfBirth).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              )}
              {player.marketValue && (
                <div
                  className="rounded-lg px-3 py-2 text-center"
                  style={{ backgroundColor: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}
                >
                  <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">Value</p>
                  <p className="text-sm font-black text-blue-300 mt-0.5">{formatMarketValue(player.marketValue)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <PlayerPageClient data={{
        slug:            player.slug,
        name:            player.name,
        position:        player.position,
        posLabel:        pos.label,
        posColor:        pos.color,
        posBg:           pos.bg,
        posBorder:       pos.border,
        photoSrc,
        shirtNumber:     player.shirtNumber ?? null,
        dateOfBirth:     player.dateOfBirth ?? null,
        age,
        nationality:     player.nationality,
        teamName:        player.teamName,
        teamSlug:        player.teamSlug,
        teamCrest:       player.teamCrest,
        teamHref,
        marketValueFmt:  formatMarketValue(player.marketValue),
        bio:             player.bio ?? null,
        isClub,
        seasons: playerStats?.seasons.map((s) => ({
          season:      s.season,
          club:        s.club,
          club_logo:   s.club_logo,
          league:      s.league,
          appearances: s.appearances,
          goals:       s.goals,
          assists:     s.assists,
          minutes:     s.minutes,
        })) ?? [],
        relatedPlayers: relatedPlayers.map((r) => {
          const rpos = getPositionStyle(r.position);
          return {
            slug:      r.slug,
            name:      r.name,
            position:  r.position,
            posLabel:  rpos.label,
            posColor:  rpos.color,
            posBg:     rpos.bg,
            posBorder: rpos.border,
            photo_url: r.photo_url ?? null,
            teamCrest: player.teamCrest,
            teamName:  player.teamName,
          };
        }),
      } satisfies PlayerPageData} />

    </article>
    </>
  );
}
