import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { players, getPlayer, getTeamPlayers } from "@/lib/data";
import { getPositionStyle } from "@/lib/positions";
import FlagImg from "@/components/FlagImg";
import AdSlot from "@/components/AdSlot";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return players.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const player = getPlayer(params.slug);
  if (!player) return {};
  return {
    title: `${player.name} — World Cup 2026 Stats & Profile | FootBrowse`,
    description: `${player.name} is a ${player.nationality} ${player.position} representing ${player.teamName} at the 2026 FIFA World Cup. View stats, profile and squad info on FootBrowse.`,
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
  const relatedPlayers = getTeamPlayers(player.teamSlug)
    .filter((p) => p.slug !== player.slug)
    .slice(0, 4);

  const bio =
    player.bio ||
    `${player.name} is a ${player.nationality} ${player.position} who plays for the ${player.teamName} national team at the 2026 FIFA World Cup.`;

  return (
    <article className="space-y-8">

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <Link href="/players">Players</Link>
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
            {player.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={player.photo_url}
                alt={player.name}
                width={140}
                height={160}
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

            {/* Nationality — clicks through to team page */}
            <div className="mt-2">
              <Link
                href={`/teams/${player.teamSlug}`}
                className="inline-flex items-center gap-1.5 font-semibold text-zinc-300 hover:opacity-70 transition-opacity text-sm"
              >
                <FlagImg nationality={player.nationality} size={18} />
                {player.nationality}
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

      <AdSlot slot="1234567890" format="auto" />

      {/* ── STATS GRID ────────────────────────────────────────── */}
      <section>
        <h2 className="section-title text-xl mb-4">Player Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="stat-card">
            <p className="stat-label">Position</p>
            <p className="text-sm font-bold mt-0.5" style={{ color: pos.color }}>{pos.label}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{player.position}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Market Value</p>
            <p className="stat-value text-blue-400">
              {formatMarketValue(player.marketValue)}
            </p>
          </div>
        </div>
      </section>

      {/* ── BIO ───────────────────────────────────────────────── */}
      <section className="section-block">
        <h2 className="section-title text-xl mb-4">Player Profile</h2>
        <p className="text-zinc-300 leading-relaxed text-sm">{bio}</p>
      </section>

      <AdSlot slot="1234567890" format="auto" />

      {/* ── RELATED PLAYERS ───────────────────────────────────── */}
      {relatedPlayers.length > 0 && (
        <section>
          <h2 className="section-title text-xl mb-4">
            More {player.teamName} Players
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {relatedPlayers.map((related) => {
              const rpos = getPositionStyle(related.position);
              return (
                <Link
                  key={related.slug}
                  href={`/players/${related.slug}`}
                  className="entity-card block"
                >
                  {/* Mini photo or fallback */}
                  <div
                    className="w-full aspect-square rounded-lg overflow-hidden flex items-center justify-center mb-2"
                    style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                  >
                    {related.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={related.photo_url}
                        alt={related.name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <span
                        className="text-2xl font-black tabular-nums"
                        style={{ color: rpos.color, opacity: 0.6 }}
                      >
                        {related.shirtNumber ?? "—"}
                      </span>
                    )}
                  </div>
                  <p
                    className="font-black text-white text-sm truncate"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {related.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: rpos.bg,
                        color: rpos.color,
                        border: `1px solid ${rpos.border}`,
                      }}
                    >
                      {rpos.label}
                    </span>
                    <FlagImg nationality={related.nationality} size={16} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── BACK TO TEAM ──────────────────────────────────────── */}
      <section className="section-block">
        <Link
          href={`/teams/${player.teamSlug}`}
          className="group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={player.teamCrest}
              alt={player.teamName}
              width={40}
              height={40}
              className="object-contain shrink-0"
              style={{ width: 40, height: 40 }}
            />
            <div>
              <p
                className="font-black text-white group-hover:opacity-70 transition-opacity"
                style={{ letterSpacing: "-0.02em" }}
              >
                {player.teamName}
              </p>
              <p className="text-sm text-zinc-500 mt-0.5">View full team profile</p>
            </div>
          </div>
          <span className="arrow-link shrink-0 ml-4">Team profile →</span>
        </Link>
      </section>

      <AdSlot slot="1234567890" format="auto" />
    </article>
  );
}
