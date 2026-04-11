import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  stadiums,
  getStadium,
  getStadiumMatches,
  getTeam,
} from "@/lib/data";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return stadiums.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const stadium = getStadium(params.slug);
  if (!stadium) return {};
  return {
    title: `${stadium.name} — World Cup 2026 Venue Guide`,
    description: `${stadium.name} in ${stadium.city}, ${stadium.state} — capacity ${stadium.capacity.toLocaleString()}, hosting ${stadium.worldCup2026Matches} World Cup 2026 matches${stadium.hostingFinal ? " including the Final" : ""}.`,
  };
}

const FLAGS: Record<string, string> = {
  france: "🇫🇷",
  brazil: "🇧🇷",
  morocco: "🇲🇦",
  argentina: "🇦🇷",
  usa: "🇺🇸",
  spain: "🇪🇸",
};

export default function StadiumPage({ params }: Props) {
  const stadium = getStadium(params.slug);
  if (!stadium) notFound();

  const stadiumMatches = getStadiumMatches(stadium.slug);
  const residentTeams = stadium.teams.map(getTeam).filter(Boolean);

  return (
    <article className="space-y-8">

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <Link href="/stadiums">Stadiums</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{stadium.name}</span>
      </nav>

      {/* Header */}
      <header className="page-header">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="badge-blue">{stadium.country}</span>
              {stadium.hostingFinal && (
                <span className="badge-green">2026 Final Venue</span>
              )}
            </div>
            <h1
              className="text-3xl sm:text-4xl font-black"
              style={{ letterSpacing: "-0.04em" }}
            >
              {stadium.name}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              📍 {stadium.city}, {stadium.state}, {stadium.country}
            </p>
          </div>
        </div>
      </header>

      {/* AD SLOT */}
      {/* <!-- AD SLOT: stadium-page-top --> */}
      <div className="ad-slot">
        <span className="ad-slot-label">Advertisement</span>
        <span className="ad-slot-dims">728×90 — Leaderboard</span>
      </div>

      {/* Venue Stats */}
      <section>
        <h2 className="section-title text-xl mb-4">Venue Details</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="stat-label">Capacity</p>
            <p className="stat-value">{stadium.capacity.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Surface</p>
            <p className="stat-value text-base">{stadium.surface}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Opened</p>
            <p className="stat-value">{stadium.opened}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">WC 2026 Matches</p>
            <p className="stat-value" style={{ color: "#00FF87" }}>
              {stadium.worldCup2026Matches}
            </p>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="section-block">
        <h2 className="section-title text-xl mb-4">Venue Overview</h2>
        <p className="text-zinc-300 leading-relaxed text-sm">{stadium.description}</p>
      </section>

      {/* Hosted Matches */}
      {stadiumMatches.length > 0 && (
        <section>
          <h2 className="section-title text-xl mb-4">World Cup 2026 Fixtures at This Venue</h2>
          <div className="space-y-3">
            {stadiumMatches.map((match) => (
              <Link
                key={match.slug}
                href={`/matches/${match.slug}`}
                className="match-card flex items-center justify-between"
              >
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold mb-1">
                    {match.stage} · Group {match.group}
                  </p>
                  <p className="font-black text-white" style={{ letterSpacing: "-0.02em" }}>
                    {FLAGS[match.homeTeamSlug]} {match.homeTeamName} vs {FLAGS[match.awayTeamSlug]} {match.awayTeamName}
                  </p>
                  <p className="text-sm text-zinc-400 mt-0.5">
                    {new Date(match.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    · {match.kickoffTime} {match.timezone}
                  </p>
                </div>
                <span className="arrow-link shrink-0 ml-4">Preview →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* AD SLOT */}
      {/* <!-- AD SLOT: stadium-page-mid --> */}
      <div className="ad-slot">
        <span className="ad-slot-label">Advertisement</span>
        <span className="ad-slot-dims">300×250 — Medium Rectangle</span>
      </div>

      {/* Resident Teams */}
      {residentTeams.length > 0 && (
        <section>
          <h2 className="section-title text-xl mb-4">Teams at This Venue</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {residentTeams.map(
              (team) =>
                team && (
                  <Link key={team.slug} href={`/teams/${team.slug}`} className="link-card">
                    {FLAGS[team.slug]} {team.name} — Group {team.group} ·{" "}
                    {team.worldCupTitles} title{team.worldCupTitles !== 1 ? "s" : ""}
                  </Link>
                )
            )}
          </div>
        </section>
      )}

      {/* AD SLOT */}
      {/* <!-- AD SLOT: stadium-page-bottom --> */}
      <div className="ad-slot">
        <span className="ad-slot-label">Advertisement</span>
        <span className="ad-slot-dims">728×90 — Leaderboard</span>
      </div>
    </article>
  );
}
