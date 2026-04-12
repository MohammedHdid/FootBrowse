import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  teams,
  getTeam,
  getTeamPlayers,
  getTeamMatches,
  getStadium,
} from "@/lib/data";
import AdSlot from "@/components/AdSlot";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return teams.map((t) => ({ slug: t.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const team = getTeam(params.slug);
  if (!team) return {};
  return {
    title: team.meta_title,
    description: team.meta_description,
  };
}

const FORM_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  W: { bg: "rgba(0,255,135,0.1)", color: "#00FF87", border: "rgba(0,255,135,0.3)" },
  D: { bg: "rgba(245,158,11,0.1)", color: "#F59E0B", border: "rgba(245,158,11,0.3)" },
  L: { bg: "rgba(239,68,68,0.1)", color: "#EF4444", border: "rgba(239,68,68,0.3)" },
};

export default function TeamPage({ params }: Props) {
  const team = getTeam(params.slug);
  if (!team) notFound();

  const teamPlayers = getTeamPlayers(team.slug);
  const teamMatches = getTeamMatches(team.slug);
  const stadium = getStadium(team.stadium_slug);

  return (
    <article className="space-y-8">

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <Link href="/teams">Teams</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{team.name}</span>
      </nav>

      {/* Color bar */}
      <div
        className="h-1 w-full rounded-full"
        style={{ backgroundColor: team.color_primary }}
      />

      {/* Hero */}
      <header className="page-header">
        <div className="flex items-start gap-5 flex-wrap sm:flex-nowrap">
          {/* Flag */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={team.flag_large}
            alt={`${team.name} flag`}
            width={160}
            height={107}
            className="rounded-lg shadow-xl object-cover shrink-0"
            style={{ width: 140, height: "auto" }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="badge-blue">{team.confederation}</span>
              <span className="badge-green">Group {team.group}</span>
              {team.wc_titles > 0 && (
                <span className="tag">{team.wc_titles}× World Champion</span>
              )}
            </div>
            <h1
              className="text-3xl sm:text-4xl font-black text-white"
              style={{ letterSpacing: "-0.04em" }}
            >
              {team.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
              <span>
                Coach:{" "}
                <span className="text-zinc-200 font-semibold">{team.coach}</span>
              </span>
              <span>
                Captain:{" "}
                <span className="text-zinc-200 font-semibold">{team.captain}</span>
              </span>
            </div>

            {/* Form */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-zinc-600 uppercase tracking-widest font-semibold mr-1">
                Form
              </span>
              {team.form.map((result, i) => {
                const style = FORM_STYLE[result] ?? FORM_STYLE["D"];
                return (
                  <span
                    key={i}
                    className="w-7 h-7 rounded flex items-center justify-center text-xs font-black"
                    style={{
                      backgroundColor: style.bg,
                      color: style.color,
                      border: `1px solid ${style.border}`,
                    }}
                  >
                    {result}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <AdSlot slot="1234567890" format="auto" />

      {/* Stats grid */}
      <section>
        <h2 className="section-title text-xl mb-4">Tournament Stats</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="stat-label">FIFA Ranking</p>
            <p className="stat-value">#{team.fifa_rank}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">World Cup Titles</p>
            <p
              className="stat-value"
              style={{ color: team.wc_titles > 0 ? "#00FF87" : "white" }}
            >
              {team.wc_titles}
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label">WC Appearances</p>
            <p className="stat-value">{team.wc_appearances}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Group</p>
            <p className="stat-value" style={{ color: "#00FF87" }}>
              {team.group}
            </p>
          </div>
        </div>
        {/* Best result */}
        <div
          className="mt-4 rounded-xl px-4 py-3 flex items-center gap-3"
          style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <span className="text-lg">🏆</span>
          <div>
            <p className="text-xs text-zinc-600 uppercase tracking-widest font-semibold">
              Best World Cup Result
            </p>
            <p className="text-sm font-bold text-white mt-0.5">{team.best_result}</p>
          </div>
        </div>
      </section>

      {/* Coaching staff & top scorer */}
      <section className="section-block">
        <h2 className="section-title text-xl mb-4">Staff &amp; Records</h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4">
          <div>
            <dt className="stat-label">Head Coach</dt>
            <dd className="text-sm font-bold text-white mt-1">{team.coach}</dd>
          </div>
          <div>
            <dt className="stat-label">Captain</dt>
            <dd className="text-sm font-bold text-white mt-1">{team.captain}</dd>
          </div>
          <div>
            <dt className="stat-label">All-Time Top Scorer</dt>
            <dd className="text-sm font-bold mt-1" style={{ color: "#00FF87" }}>
              {team.top_scorer_all_time}{" "}
              <span className="text-zinc-400 font-normal">
                ({team.top_scorer_all_time_goals} goals)
              </span>
            </dd>
          </div>
          <div>
            <dt className="stat-label">Primary Colour</dt>
            <dd className="flex items-center gap-2 mt-1">
              <span
                className="inline-block w-4 h-4 rounded-sm border border-zinc-700"
                style={{ backgroundColor: team.color_primary }}
              />
              <span className="text-sm font-mono text-zinc-300">{team.color_primary}</span>
            </dd>
          </div>
          <div>
            <dt className="stat-label">Secondary Colour</dt>
            <dd className="flex items-center gap-2 mt-1">
              <span
                className="inline-block w-4 h-4 rounded-sm border border-zinc-700"
                style={{ backgroundColor: team.color_secondary }}
              />
              <span className="text-sm font-mono text-zinc-300">{team.color_secondary}</span>
            </dd>
          </div>
        </dl>
      </section>

      {/* Strengths & Weaknesses */}
      <section>
        <h2 className="section-title text-xl mb-4">Analysis</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: "rgba(0,255,135,0.04)",
              border: "1px solid rgba(0,255,135,0.15)",
            }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: "#00FF87" }}
            >
              Strengths
            </p>
            <ul className="space-y-2">
              {team.strengths.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm text-zinc-300">
                  <span style={{ color: "#00FF87" }}>+</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: "rgba(239,68,68,0.04)",
              border: "1px solid rgba(239,68,68,0.15)",
            }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3 text-red-400">
              Weaknesses
            </p>
            <ul className="space-y-2">
              {team.weaknesses.map((w) => (
                <li key={w} className="flex items-start gap-2 text-sm text-zinc-300">
                  <span className="text-red-500">−</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="section-block">
        <h2 className="section-title text-xl mb-4">Team Overview</h2>
        <p className="text-zinc-300 leading-relaxed text-sm">{team.overview}</p>
      </section>

      {/* Key Players */}
      {teamPlayers.length > 0 && (
        <section>
          <h2 className="section-title text-xl mb-4">Key Players</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teamPlayers.map((player) => (
              <Link
                key={player.slug}
                href={`/players/${player.slug}`}
                className="entity-card block"
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="font-black text-white"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {player.name}
                  </span>
                  <span
                    className="text-base font-black tabular-nums"
                    style={{ color: "#00FF87" }}
                  >
                    #{player.jersey_number}
                  </span>
                </div>
                <p className="text-sm text-zinc-400">{player.position}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {player.club} · {player.league}
                </p>
                <div className="mt-3 flex gap-4 text-xs text-zinc-600">
                  <span>
                    <span className="text-zinc-300 font-bold">{player.caps}</span> caps
                  </span>
                  <span>
                    <span className="text-zinc-300 font-bold">
                      {player.international_goals}
                    </span>{" "}
                    goals
                  </span>
                  <span>
                    <span className="text-zinc-300 font-bold">{player.wc_goals}</span> WC
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <AdSlot slot="1234567890" format="auto" />

      {/* Fixtures */}
      {teamMatches.length > 0 && (
        <section>
          <h2 className="section-title text-xl mb-4">Group Stage Fixtures</h2>
          <div className="space-y-3">
            {teamMatches.map((match) => (
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
            ))}
          </div>
        </section>
      )}

      {/* Stadium */}
      {stadium && (
        <section className="section-block">
          <h2 className="section-title text-xl mb-4">Associated Venue</h2>
          <Link
            href={`/stadiums/${stadium.slug}`}
            className="group flex items-start justify-between"
          >
            <div>
              <p
                className="font-black text-white group-hover:opacity-70 transition-opacity"
                style={{ letterSpacing: "-0.02em" }}
              >
                {stadium.name}
                {stadium.is_final_venue && (
                  <span className="badge-green ml-2 align-middle">Final Venue</span>
                )}
              </p>
              <p className="text-sm text-zinc-400 mt-1">
                {stadium.city}, {stadium.state}
              </p>
              <p className="text-sm text-zinc-500 mt-0.5">
                Cap. {stadium.capacity.toLocaleString()} · {stadium.wc_matches} WC matches
              </p>
            </div>
            <span className="arrow-link shrink-0 ml-4">Venue guide →</span>
          </Link>
        </section>
      )}

      <AdSlot slot="1234567890" format="auto" />
    </article>
  );
}
