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

export default function StadiumPage({ params }: Props) {
  const stadium = getStadium(params.slug);
  if (!stadium) notFound();

  const stadiumMatches = getStadiumMatches(stadium.slug);
  const residentTeams = stadium.teams.map(getTeam).filter(Boolean);

  return (
    <article className="space-y-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-zinc-500 flex gap-1 items-center">
        <Link href="/" className="hover:text-zinc-300">
          Home
        </Link>
        <span>/</span>
        <Link href="/stadiums" className="hover:text-zinc-300">
          Stadiums
        </Link>
        <span>/</span>
        <span className="text-zinc-300">{stadium.name}</span>
      </nav>

      {/* Header */}
      <header className="border-b border-zinc-800 pb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">
              {stadium.city}, {stadium.state}, {stadium.country}
            </p>
            <h1>{stadium.name}</h1>
          </div>
          {stadium.hostingFinal && (
            <span className="rounded bg-emerald-900/50 border border-emerald-700 px-3 py-1.5 text-sm font-bold text-emerald-300">
              2026 Final Venue
            </span>
          )}
        </div>
      </header>

      {/* AD SLOT */}
      {/* <!-- AD SLOT: stadium-page-top --> */}
      <div className="ad-slot">Advertisement</div>

      {/* Venue Stats */}
      <section>
        <h2 className="mb-4">Venue Details</h2>
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
            <p className="stat-value">{stadium.worldCup2026Matches}</p>
          </div>
        </div>
      </section>

      {/* Stadium Overview */}
      <section className="section-block">
        <h2 className="mb-3">Venue Overview</h2>
        <p className="text-zinc-300 leading-relaxed">{stadium.description}</p>
      </section>

      {/* Hosted Matches */}
      {stadiumMatches.length > 0 && (
        <section>
          <h2 className="mb-4">World Cup 2026 Fixtures at This Venue</h2>
          <div className="space-y-3">
            {stadiumMatches.map((match) => (
              <Link
                key={match.slug}
                href={`/matches/${match.slug}`}
                className="flex items-center justify-between section-block hover:border-emerald-600 transition-colors"
              >
                <div>
                  <p className="text-xs text-zinc-500 mb-1">
                    {match.stage} · Group {match.group}
                  </p>
                  <p className="font-medium text-white">
                    {match.homeTeamName} vs {match.awayTeamName}
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
                <span className="text-emerald-400 text-sm font-medium shrink-0 ml-4">
                  Preview →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* AD SLOT */}
      {/* <!-- AD SLOT: stadium-page-mid --> */}
      <div className="ad-slot">Advertisement</div>

      {/* Resident Teams */}
      {residentTeams.length > 0 && (
        <section>
          <h2 className="mb-4">Teams at This Venue</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {residentTeams.map(
              (team) =>
                team && (
                  <Link
                    key={team.slug}
                    href={`/teams/${team.slug}`}
                    className="link-card"
                  >
                    {team.name} — Group {team.group} ·{" "}
                    {team.worldCupTitles} title
                    {team.worldCupTitles !== 1 ? "s" : ""}
                  </Link>
                )
            )}
          </div>
        </section>
      )}

      {/* AD SLOT */}
      {/* <!-- AD SLOT: stadium-page-bottom --> */}
      <div className="ad-slot">Advertisement</div>
    </article>
  );
}
