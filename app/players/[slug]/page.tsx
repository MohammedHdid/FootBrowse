import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { players, getPlayer, getTeam, getMatch } from "@/lib/data";

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
    title: player.meta_title,
    description: player.meta_description,
  };
}

function formatMarketValue(eur: number): string {
  if (eur >= 1_000_000_000) return `€${(eur / 1_000_000_000).toFixed(1)}B`;
  if (eur >= 1_000_000) return `€${Math.round(eur / 1_000_000)}M`;
  return `€${(eur / 1_000).toFixed(0)}K`;
}

export default function PlayerPage({ params }: Props) {
  const player = getPlayer(params.slug);
  if (!player) notFound();

  const team = getTeam(player.team_slug);
  const playerMatches = player.matches.map(getMatch).filter(Boolean);

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

      {/* Header */}
      <header className="page-header">
        <div className="flex items-start gap-5 flex-wrap sm:flex-nowrap">

          {/* Avatar — flag + jersey number on team colour */}
          <div
            className="rounded-2xl shrink-0 flex flex-col items-center justify-center gap-2 relative overflow-hidden"
            style={{
              width: 120,
              height: 140,
              backgroundColor: player.avatar_color,
              boxShadow: `0 0 40px ${player.avatar_color}40`,
            }}
          >
            {/* Flag */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={player.flag_url}
              alt={player.country}
              width={56}
              height={38}
              className="rounded-sm object-cover opacity-90 shadow"
              style={{ width: 56, height: "auto" }}
            />
            {/* Jersey number */}
            <span
              className="text-3xl font-black tabular-nums leading-none"
              style={{
                color: "rgba(255,255,255,0.95)",
                textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                letterSpacing: "-0.04em",
              }}
            >
              {player.jersey_number}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="badge-blue">{player.position}</span>
              <span className="badge-green">{player.country}</span>
            </div>
            <h1
              className="text-3xl sm:text-4xl font-black text-white"
              style={{ letterSpacing: "-0.04em" }}
            >
              {player.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
              {team && (
                <Link
                  href={`/teams/${team.slug}`}
                  className="font-semibold text-zinc-200 hover:opacity-70 transition-opacity inline-flex items-center gap-1.5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={player.flag_url}
                    alt={player.country}
                    width={20}
                    height={14}
                    className="rounded-sm object-cover"
                    style={{ width: 20, height: "auto" }}
                  />
                  {team.name}
                </Link>
              )}
              <span className="text-zinc-700">·</span>
              <span>{player.club}</span>
              <span className="text-zinc-700">·</span>
              <span>{player.league}</span>
            </div>
          </div>
        </div>
      </header>

      {/* AD SLOT */}
      <div className="ad-slot">
        <span className="ad-slot-label">Advertisement</span>
        <span className="ad-slot-dims">728×90 — Leaderboard</span>
      </div>

      {/* Stats grid */}
      <section>
        <h2 className="section-title text-xl mb-4">International Statistics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="stat-label">Caps</p>
            <p className="stat-value">{player.caps}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Int&apos;l Goals</p>
            <p className="stat-value">{player.international_goals}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">WC Goals</p>
            <p className="stat-value" style={{ color: "#00FF87" }}>
              {player.wc_goals}
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label">WC Tournaments</p>
            <p className="stat-value">{player.wc_appearances}</p>
          </div>
        </div>
      </section>

      {/* Player details */}
      <section className="section-block">
        <h2 className="section-title text-xl mb-4">Player Details</h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5">
          <div>
            <dt className="stat-label">Age</dt>
            <dd className="text-sm font-bold text-white mt-1">{player.age}</dd>
          </div>
          <div>
            <dt className="stat-label">Club</dt>
            <dd className="text-sm font-bold text-white mt-1">{player.club}</dd>
          </div>
          <div>
            <dt className="stat-label">League</dt>
            <dd className="text-sm font-bold text-white mt-1">{player.league}</dd>
          </div>
          <div>
            <dt className="stat-label">Position</dt>
            <dd className="text-sm font-bold text-white mt-1">{player.position}</dd>
          </div>
          <div>
            <dt className="stat-label">Jersey Number</dt>
            <dd className="text-sm font-black mt-1" style={{ color: "#00FF87" }}>
              #{player.jersey_number}
            </dd>
          </div>
          <div>
            <dt className="stat-label">Market Value</dt>
            <dd className="text-sm font-black mt-1 text-blue-400">
              {formatMarketValue(player.market_value_eur)}
            </dd>
          </div>
        </dl>
      </section>

      {/* Strengths */}
      <section className="section-block">
        <h2 className="section-title text-xl mb-4">Key Strengths</h2>
        <div className="flex flex-wrap gap-2">
          {player.strengths.map((strength) => (
            <span
              key={strength}
              className="rounded-full px-4 py-1.5 text-sm font-bold"
              style={{
                backgroundColor: "rgba(0,255,135,0.07)",
                border: "1px solid rgba(0,255,135,0.2)",
                color: "#00FF87",
              }}
            >
              {strength}
            </span>
          ))}
        </div>
      </section>

      {/* Overview */}
      <section className="section-block">
        <h2 className="section-title text-xl mb-4">Player Profile</h2>
        <p className="text-zinc-300 leading-relaxed text-sm">{player.overview}</p>
      </section>

      {/* Shirt CTA */}
      <section
        className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{
          backgroundColor: `${player.avatar_color}12`,
          border: `1px solid ${player.avatar_color}30`,
        }}
      >
        <div>
          <p className="font-black text-white" style={{ letterSpacing: "-0.02em" }}>
            {player.name} Official Shirt
          </p>
          <p className="text-sm text-zinc-400 mt-0.5">
            Get the official {player.country} #{player.jersey_number} jersey
          </p>
        </div>
        <a
          href={player.shirt_affiliate_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold transition-opacity hover:opacity-80 shrink-0"
          style={{ backgroundColor: "#00FF87", color: "#0a0a0a" }}
        >
          👕 Buy Shirt →
        </a>
      </section>

      {/* AD SLOT */}
      <div className="ad-slot">
        <span className="ad-slot-label">Advertisement</span>
        <span className="ad-slot-dims">300×250 — Medium Rectangle</span>
      </div>

      {/* Player's matches */}
      {playerMatches.length > 0 && (
        <section>
          <h2 className="section-title text-xl mb-4">
            Matches at World Cup 2026
          </h2>
          <div className="space-y-3">
            {playerMatches.map((match) => {
              if (!match) return null;
              return (
                <Link
                  key={match.slug}
                  href={`/matches/${match.slug}`}
                  className="match-card flex items-center justify-between"
                >
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold mb-1">
                      {match.stage} · Group {match.group}
                    </p>
                    <p
                      className="font-black text-white"
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      {match.team_a.name} vs {match.team_b.name}
                    </p>
                    <p className="text-sm text-zinc-400 mt-0.5">
                      {new Date(match.date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      · {match.city}
                    </p>
                  </div>
                  <span className="arrow-link shrink-0 ml-4">Preview →</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* National team card */}
      {team && (
        <section className="section-block">
          <h2 className="section-title text-xl mb-4">National Team</h2>
          <Link
            href={`/teams/${team.slug}`}
            className="group flex items-start justify-between"
          >
            <div className="flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={team.flag_url}
                alt={`${team.name} flag`}
                width={48}
                height={32}
                className="rounded-sm object-cover mt-1 shrink-0"
                style={{ width: 48, height: "auto" }}
              />
              <div>
                <p
                  className="font-black text-white group-hover:opacity-70 transition-opacity"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {team.name}
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  FIFA #{team.fifa_rank} · Group {team.group} · {team.wc_titles} WC title
                  {team.wc_titles !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Coach: {team.coach} · Captain: {team.captain}
                </p>
              </div>
            </div>
            <span className="arrow-link shrink-0 ml-4">Team profile →</span>
          </Link>
        </section>
      )}

      {/* AD SLOT */}
      <div className="ad-slot">
        <span className="ad-slot-label">Advertisement</span>
        <span className="ad-slot-dims">728×90 — Leaderboard</span>
      </div>
    </article>
  );
}
