import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { matches, getMatch, getStadium, players as allPlayers } from "@/lib/data";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return matches.map((m) => ({ slug: m.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const match = getMatch(params.slug);
  if (!match) return {};
  return {
    title: match.meta_title,
    description: match.meta_description,
  };
}


export default function MatchPage({ params }: Props) {
  const match = getMatch(params.slug);
  if (!match) notFound();

  const stadium = getStadium(match.stadium_slug);
  const featuredPlayers = allPlayers.filter((p) =>
    p.matches.includes(match.slug)
  );
  const relatedMatches = matches
    .filter((m) => m.slug !== match.slug)
    .sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      if (match.group && a.group === match.group) scoreA += 100;
      if (match.group && b.group === match.group) scoreB += 100;
      if (a.stage === match.stage) scoreA += 50;
      if (b.stage === match.stage) scoreB += 50;
      return scoreB - scoreA;
    })
    .slice(0, 4);

  const faqJsonLd = match.content.faq ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: match.content.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  } : null;

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${match.team_a.name} vs ${match.team_b.name} — FIFA World Cup 2026`,
    startDate: `${match.date}T${match.kickoff_utc}:00Z`,
    location: {
      "@type": "StadiumOrArena",
      name: stadium?.name ?? match.city,
      address: { "@type": "PostalAddress", addressLocality: match.city },
    },
    homeTeam: { "@type": "SportsTeam", name: match.team_a.name },
    awayTeam: { "@type": "SportsTeam", name: match.team_b.name },
    sport: "Football",
    description: match.content.preview,
  };

  return (
    <>
      {/* JSON-LD */}
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />

      <article className="space-y-8">

        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumb-sep">›</span>
          <Link href="/matches">Matches</Link>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">
            {match.team_a.code.toUpperCase()} vs {match.team_b.code.toUpperCase()}
          </span>
        </nav>

        {/* Hero — flags + VS */}
        <header className="page-header">
          <div className="flex items-center gap-2 mb-5">
            <span className="badge-blue">{match.stage}</span>
            {match.group && <span className="badge-green">Group {match.group}</span>}
          </div>

          <div className="flex items-center justify-between gap-4">
            {/* Team A */}
            <div className="flex-1 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/w160/${match.team_a.code}.png`}
                alt={`${match.team_a.name} flag`}
                width={160}
                height={107}
                className="mx-auto rounded shadow-lg object-cover"
                style={{ height: 80, width: "auto" }}
              />
              <Link
                href={`/teams/${match.team_a.slug}`}
                className="block mt-3 text-xl sm:text-2xl font-black text-white hover:opacity-70 transition-opacity"
                style={{ letterSpacing: "-0.03em" }}
              >
                {match.team_a.name}
              </Link>
              <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">
                FIFA #{match.team_a.fifa_rank}
              </p>
            </div>

            {/* VS */}
            <div className="text-center px-2 sm:px-6 shrink-0">
              <p
                className="text-4xl sm:text-5xl font-black"
                style={{ color: "#00FF87", letterSpacing: "-0.04em" }}
              >
                VS
              </p>
              <div className="mt-2 text-xs text-zinc-600 space-y-0.5">
                <p>Group {match.group}</p>
              </div>
            </div>

            {/* Team B */}
            <div className="flex-1 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/w160/${match.team_b.code}.png`}
                alt={`${match.team_b.name} flag`}
                width={160}
                height={107}
                className="mx-auto rounded shadow-lg object-cover"
                style={{ height: 80, width: "auto" }}
              />
              <Link
                href={`/teams/${match.team_b.slug}`}
                className="block mt-3 text-xl sm:text-2xl font-black text-white hover:opacity-70 transition-opacity"
                style={{ letterSpacing: "-0.03em" }}
              >
                {match.team_b.name}
              </Link>
              <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">
                FIFA #{match.team_b.fifa_rank}
              </p>
            </div>
          </div>

          {/* Date / kickoff / venue row */}
          <div
            className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-zinc-400"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.25rem" }}
          >
            <span>
              📅{" "}
              {new Date(match.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span>🕐 {match.kickoff_utc} UTC · {match.kickoff_est} EST</span>
            <span>📍 {match.city}</span>
            {stadium && (
              <Link
                href={`/stadiums/${stadium.slug}`}
                className="font-semibold hover:opacity-70 transition-opacity"
                style={{ color: "#00FF87" }}
              >
                {stadium.name} →
              </Link>
            )}
          </div>
        </header>

        {/* AD SLOT */}
        <div className="ad-slot">
          <span className="ad-slot-label">Advertisement</span>
          <span className="ad-slot-dims">728×90 — Leaderboard</span>
        </div>

        {/* Match Preview */}
        <section className="section-block">
          <h2 className="section-title text-xl mb-4">Match Preview</h2>
          <p className="text-zinc-300 leading-relaxed text-sm">{match.content.preview}</p>
        </section>

        {/* Head-to-Head */}
        {match.h2h && (
        <section className="section-block">
          <h2 className="section-title text-xl mb-5">Head-to-Head Record</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div className="stat-card text-center">
              <p className="stat-label">Played</p>
              <p className="stat-value">{match.h2h.played}</p>
            </div>
            <div className="stat-card text-center">
              <p className="stat-label">{match.team_a.name} Wins</p>
              <p className="stat-value" style={{ color: "#00FF87" }}>
                {match.h2h.team_a_wins}
              </p>
            </div>
            <div className="stat-card text-center">
              <p className="stat-label">Draws</p>
              <p className="stat-value text-zinc-400">{match.h2h.draws}</p>
            </div>
            <div className="stat-card text-center">
              <p className="stat-label">{match.team_b.name} Wins</p>
              <p className="stat-value text-blue-400">{match.h2h.team_b_wins}</p>
            </div>
          </div>

          {/* Goals scored row */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="stat-card text-center">
              <p className="stat-label">{match.team_a.name} Goals All-Time</p>
              <p className="stat-value">{match.h2h.team_a_goals_scored}</p>
            </div>
            <div className="stat-card text-center">
              <p className="stat-label">{match.team_b.name} Goals All-Time</p>
              <p className="stat-value">{match.h2h.team_b_goals_scored}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-zinc-500">
              Last meeting:{" "}
              <span className="text-zinc-200 font-semibold">{match.h2h.last_match}</span>
            </p>
            <p className="text-zinc-500">
              Last World Cup meeting:{" "}
              <span className="text-zinc-200 font-semibold">{match.h2h.last_wc_meeting}</span>
            </p>
          </div>
        </section>
        )}

        {/* Betting Odds */}
        {match.odds && match.odds.length > 0 && (
        <section className="section-block">
          <h2 className="section-title text-xl mb-5">Betting Odds — Best Prices</h2>
          <div className="space-y-3">
            {/* Header row */}
            <div
              className="hidden sm:grid text-xs font-bold uppercase tracking-widest text-zinc-600 px-4"
              style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 2fr" }}
            >
              <span>Bookmaker</span>
              <span className="text-center">{match.team_a.code.toUpperCase()} Win</span>
              <span className="text-center">Draw</span>
              <span className="text-center">{match.team_b.code.toUpperCase()} Win</span>
              <span />
            </div>

            {match.odds.map((odd) => (
              <div
                key={odd.bookmaker}
                className="rounded-xl px-4 py-4 flex flex-col sm:grid sm:items-center gap-3"
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 2fr",
                }}
              >
                <span className="font-bold text-white text-sm">{odd.bookmaker}</span>

                {/* Mobile labels + values */}
                <div className="flex gap-4 sm:contents">
                  <div className="text-center sm:block">
                    <p className="text-xs text-zinc-600 sm:hidden uppercase tracking-wider mb-0.5">
                      {match.team_a.code.toUpperCase()} Win
                    </p>
                    <span
                      className="text-lg font-black"
                      style={{ color: "#00FF87" }}
                    >
                      {odd.team_a_win.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-center sm:block">
                    <p className="text-xs text-zinc-600 sm:hidden uppercase tracking-wider mb-0.5">Draw</p>
                    <span className="text-lg font-black text-zinc-300">
                      {odd.draw.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-center sm:block">
                    <p className="text-xs text-zinc-600 sm:hidden uppercase tracking-wider mb-0.5">
                      {match.team_b.code.toUpperCase()} Win
                    </p>
                    <span className="text-lg font-black text-blue-400">
                      {odd.team_b_win.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <a
                    href={odd.affiliate_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-block rounded-lg px-4 py-2 text-xs font-bold transition-opacity hover:opacity-80"
                    style={{ backgroundColor: "#00FF87", color: "#0a0a0a" }}
                  >
                    {odd.cta}
                  </a>
                </div>
              </div>
            ))}

            <p className="text-xs text-zinc-700 pt-1">
              18+ · Gamble responsibly · Odds subject to change
            </p>
          </div>
        </section>
        )}

        {/* Prediction */}
        <section className="section-block">
          <h2 className="section-title text-xl mb-4">Our Prediction</h2>
          <div className="flex flex-wrap items-start gap-4">
            <div
              className="rounded-xl px-5 py-3 text-center shrink-0"
              style={{
                backgroundColor: "rgba(0,255,135,0.08)",
                border: "1px solid rgba(0,255,135,0.25)",
              }}
            >
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Prediction</p>
              <p className="text-lg font-black" style={{ color: "#00FF87" }}>
                {match.content.prediction}
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                Confidence: {match.content.prediction_confidence}
              </p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Key Battle</p>
              <p className="text-sm font-bold text-white">{match.content.key_battle}</p>
            </div>
          </div>

          {/* Stats to watch */}
          {match.content.stats_to_watch && match.content.stats_to_watch.length > 0 && (
            <div className="mt-5">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Stats to Watch</p>
              <ul className="space-y-2.5">
                {match.content.stats_to_watch.map((stat, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                    <span
                      className="mt-0.5 text-xs font-black w-5 h-5 rounded flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: "rgba(0,255,135,0.1)",
                        color: "#00FF87",
                        border: "1px solid rgba(0,255,135,0.2)",
                      }}
                    >
                      {i + 1}
                    </span>
                    {stat}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* TV Channels */}
        <section className="section-block">
          <h2 className="section-title text-xl mb-4">Where to Watch</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {match.tv_channels.map((entry) => (
              <div
                key={entry.country}
                className="rounded-xl p-3"
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: "#3B82F6" }}
                >
                  {entry.country}
                </p>
                <ul className="space-y-1">
                  {entry.channels.map((ch) => (
                    <li key={ch} className="text-sm font-semibold text-white">
                      {ch}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* AD SLOT */}
        <div className="ad-slot">
          <span className="ad-slot-label">Advertisement</span>
          <span className="ad-slot-dims">300×250 — Medium Rectangle</span>
        </div>

        {/* Travel */}
        <section className="section-block">
          <h2 className="section-title text-xl mb-4">Travel & Tickets</h2>
          <p className="text-sm text-zinc-400 mb-4">
            {match.travel.nearest_airport} is the nearest airport to this venue.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={match.travel.hotel_affiliate_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#00FF87", color: "#0a0a0a" }}
            >
              🏨 {match.travel.hotel_cta}
            </a>
            <a
              href={match.travel.flight_affiliate_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-bold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              style={{ borderColor: "rgba(255,255,255,0.15)" }}
            >
              ✈️ {match.travel.flight_cta}
            </a>
          </div>
        </section>

        {/* Featured Players */}
        {featuredPlayers.length > 0 && (
          <section>
            <h2 className="section-title text-xl mb-4">Featured Players</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {featuredPlayers.map((player) => (
                <Link
                  key={player.slug}
                  href={`/players/${player.slug}`}
                  className="entity-card block"
                >
                  <div className="flex items-center gap-3 mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={player.flag_url}
                      alt={player.country}
                      width={32}
                      height={24}
                      className="rounded-sm object-cover shrink-0"
                      style={{ width: 32, height: "auto" }}
                    />
                    <span
                      className="font-black text-white"
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      {player.name}
                    </span>
                    <span
                      className="ml-auto text-base font-black tabular-nums"
                      style={{ color: "#00FF87" }}
                    >
                      #{player.jersey_number}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">
                    {player.country} · {player.position} · {player.club}
                  </p>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {player.caps} caps · {player.international_goals} int&apos;l goals ·{" "}
                    {player.wc_goals} WC goals
                  </p>
                  <p className="mt-3 text-xs font-bold" style={{ color: "#00FF87" }}>
                    View full profile →
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Venue */}
        {stadium && (
          <section className="section-block">
            <h2 className="section-title text-xl mb-4">Venue</h2>
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
                  Cap. {stadium.capacity.toLocaleString()} · {stadium.surface} · {stadium.roof} roof
                </p>
              </div>
              <span className="arrow-link shrink-0 ml-4">Stadium guide →</span>
            </Link>
          </section>
        )}

        {/* FAQ */}
        {match.content.faq && match.content.faq.length > 0 && (
          <section className="section-block">
            <h2 className="section-title text-xl mb-5">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {match.content.faq.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <p className="font-bold text-white text-sm mb-2">{item.q}</p>
                  <p className="text-sm text-zinc-400 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Matches */}
        {relatedMatches.length > 0 && (
          <section>
            <h2 className="section-title text-xl mb-4">More Matches</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {relatedMatches.map((m) => (
                <Link
                  key={m.slug}
                  href={`/matches/${m.slug}`}
                  className="match-card flex items-center justify-between"
                >
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold mb-1">
                      {m.stage} {m.group ? `· Group ${m.group}` : ""}
                    </p>
                    <p
                      className="font-black text-white"
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      {m.team_a.name} vs {m.team_b.name}
                    </p>
                    <p className="text-sm text-zinc-400 mt-0.5">
                      {new Date(m.date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      · {m.city}
                    </p>
                  </div>
                  <span className="arrow-link shrink-0 ml-4">Preview →</span>
                </Link>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/matches"
                className="inline-block rounded-lg px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-80"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                View all matches →
              </Link>
            </div>
          </section>
        )}

        {/* AD SLOT */}
        <div className="ad-slot">
          <span className="ad-slot-label">Advertisement</span>
          <span className="ad-slot-dims">728×90 — Leaderboard</span>
        </div>
      </article>
    </>
  );
}
