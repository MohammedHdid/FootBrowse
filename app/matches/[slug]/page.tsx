import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { matches, getMatch, getStadium, getTeamPlayers, getTeam } from "@/lib/data";
import AdSlot from "@/components/AdSlot";
import MatchSquads from "@/components/MatchSquads";
import MatchFlagImg from "@/components/MatchFlagImg";


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
    alternates: { canonical: `https://footbrowse.com/matches/${params.slug}` },
  };
}


export default function MatchPage({ params }: Props) {
  const match = getMatch(params.slug);
  if (!match) notFound();

  const stadium = getStadium(match.stadium_slug);
  const squadA = getTeamPlayers(match.team_a.slug);
  const squadB = getTeamPlayers(match.team_b.slug);
  const teamAFull = getTeam(match.team_a.slug);
  const teamBFull = getTeam(match.team_b.slug);
  const colorA = teamAFull?.color_primary ?? "#00e87a";
  const colorB = teamBFull?.color_primary ?? "#3b82f6";
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

  const faqJsonLd = match.content.faq && match.content.faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": match.content.faq.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  } : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://footbrowse.com" },
      { "@type": "ListItem", "position": 2, "name": "Matches", "item": "https://footbrowse.com/matches" },
      { "@type": "ListItem", "position": 3, "name": `${match.team_a.code.toUpperCase()} vs ${match.team_b.code.toUpperCase()}`, "item": `https://footbrowse.com/matches/${match.slug}` }
    ]
  };

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
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
              <Image
                src={`https://flagcdn.com/w160/${match.team_a.code}.png`}
                alt={`${match.team_a.name} flag`}
                width={160}
                height={107}
                priority
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
              <Image
                src={`https://flagcdn.com/w160/${match.team_b.code}.png`}
                alt={`${match.team_b.name} flag`}
                width={160}
                height={107}
                priority
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

        <AdSlot slot="1234567890" format="auto" />

        {/* ── Match Pulse: Form & Comparison ──────────────────── */}
        <section className="grid gap-4 sm:grid-cols-2">
          {/* Recent Form Card */}
          <div className="section-block !mb-0">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">
              Recent Form (Last 5)
            </h2>
            <div className="space-y-4">
              {/* Team A Form */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image
                    src={match.team_a.flag_url}
                    alt={match.team_a.name}
                    width={20}
                    height={14}
                    className="rounded-sm object-cover shrink-0 opacity-80"
                  />
                  <span className="font-bold text-zinc-300 text-[11px] uppercase tracking-wider">
                    {match.team_a.name}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {(teamAFull?.form || []).length > 0 ? (teamAFull?.form || []).map((r, i) => (
                    <span
                      key={i}
                      className="w-6 h-6 rounded font-black text-[10px] flex items-center justify-center transition-transform hover:scale-110"
                      style={{
                        backgroundColor: r === 'W' ? '#00FF8715' : r === 'L' ? '#EF444415' : '#F59E0B15',
                        color: r === 'W' ? '#00FF87' : r === 'L' ? '#EF4444' : '#F59E0B',
                        border: `1px solid ${r === 'W' ? '#00FF8730' : r === 'L' ? '#EF444430' : '#F59E0B30'}`
                      }}
                    >
                      {r}
                    </span>
                  )) : (
                    <span className="text-[10px] text-zinc-700 tracking-tighter">no recent data</span>
                  )}
                </div>
              </div>
              {/* Team B Form */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image
                    src={match.team_b.flag_url}
                    alt={match.team_b.name}
                    width={20}
                    height={14}
                    className="rounded-sm object-cover shrink-0 opacity-80"
                  />
                  <span className="font-bold text-zinc-300 text-[11px] uppercase tracking-wider">
                    {match.team_b.name}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {(teamBFull?.form || []).length > 0 ? (teamBFull?.form || []).map((r, i) => (
                    <span
                      key={i}
                      className="w-6 h-6 rounded font-black text-[10px] flex items-center justify-center transition-transform hover:scale-110"
                      style={{
                        backgroundColor: r === 'W' ? '#00FF8715' : r === 'L' ? '#EF444415' : '#F59E0B15',
                        color: r === 'W' ? '#00FF87' : r === 'L' ? '#EF4444' : '#F59E0B',
                        border: `1px solid ${r === 'W' ? '#00FF8730' : r === 'L' ? '#EF444430' : '#F59E0B30'}`
                      }}
                    >
                      {r}
                    </span>
                  )) : (
                    <span className="text-[10px] text-zinc-700 tracking-tighter">no recent data</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Comparison Card */}
          <div className="section-block !mb-0">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">
              Team Comparison
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-white/[0.04]">
                <span className="text-zinc-500">FIFA Rank</span>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-white">#{match.team_a.fifa_rank}</span>
                  <span className="text-zinc-700">vs</span>
                  <span className="font-bold text-white">#{match.team_b.fifa_rank}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-white/[0.04]">
                <span className="text-zinc-500">Established</span>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-white">{teamAFull?.year_formed || '—'}</span>
                  <span className="text-zinc-700">·</span>
                  <span className="font-bold text-white">{teamBFull?.year_formed || '—'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5">
                <span className="text-zinc-500">WC Titles</span>
                <div className="flex items-center gap-4">
                  <span className="font-bold" style={{ color: (teamAFull?.wc_titles || 0) > 0 ? '#00FF87' : 'inherit' }}>
                    {teamAFull?.wc_titles || 0}
                  </span>
                  <span className="text-zinc-700">·</span>
                  <span className="font-bold" style={{ color: (teamBFull?.wc_titles || 0) > 0 ? '#00FF87' : 'inherit' }}>
                    {teamBFull?.wc_titles || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Match Preview */}
        <section className="section-block">
          <h2 className="section-title text-xl mb-4">Match Preview</h2>
          <p className="text-zinc-300 leading-relaxed text-sm">{match.content.preview}</p>
        </section>

        {/* Head-to-Head */}
        {match.h2h && (
        <section className="section-block">
          <h2 className="section-title text-xl mb-1">Head-to-Head</h2>
          <p className="text-xs text-zinc-600 mb-4">
            {match.h2h.played} historical meetings (overall statistics)
          </p>

          {/* ── Wins card with split gradient ── */}
          <div
            className="relative rounded-2xl overflow-hidden mb-3"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {/* Split background glow */}
            <div className="absolute inset-0 pointer-events-none flex">
              <div className="flex-1" style={{ background: `linear-gradient(to right, ${colorA}22 0%, transparent 75%)` }} />
              <div className="flex-1" style={{ background: `linear-gradient(to left, ${colorB}22 0%, transparent 75%)` }} />
            </div>

            {/* Numbers row */}
            <div className="relative grid grid-cols-3 pt-6 pb-4 px-3">
              {/* Team A */}
              <div className="flex flex-col items-center gap-2">
                <MatchFlagImg src={match.team_a.flag_url} alt={match.team_a.name} width={28} />
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  {match.team_a.code.toUpperCase()}
                </span>
                <span
                  className="text-6xl font-black tabular-nums leading-none text-white"
                  style={{ letterSpacing: "-0.05em", textShadow: `0 0 32px ${colorA}90` }}
                >
                  {match.h2h.team_a_wins}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">wins</span>
              </div>

              {/* Draws */}
              <div className="flex flex-col items-center gap-2">
                <span style={{ height: 19 }} />
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-700">—</span>
                <span
                  className="text-6xl font-black tabular-nums leading-none"
                  style={{ letterSpacing: "-0.05em", color: "#52525b" }}
                >
                  {match.h2h.draws}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">draws</span>
              </div>

              {/* Team B */}
              <div className="flex flex-col items-center gap-2">
                <MatchFlagImg src={match.team_b.flag_url} alt={match.team_b.name} width={28} />
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  {match.team_b.code.toUpperCase()}
                </span>
                <span
                  className="text-6xl font-black tabular-nums leading-none text-white"
                  style={{ letterSpacing: "-0.05em", textShadow: `0 0 32px ${colorB}90` }}
                >
                  {match.h2h.team_b_wins}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">wins</span>
              </div>
            </div>

            {/* Dominance bar pinned to bottom of card */}
            {match.h2h.played > 0 && (() => {
              const w1 = Math.round((match.h2h!.team_a_wins / match.h2h!.played) * 100);
              const wx = Math.round((match.h2h!.draws / match.h2h!.played) * 100);
              const w2 = 100 - w1 - wx;
              return (
                <>
                  <div className="flex h-1.5 gap-px">
                    <div style={{ width: `${w1}%`, background: `linear-gradient(to right, ${colorA}, ${colorA}bb)` }} />
                    <div style={{ width: `${wx}%`, backgroundColor: "#3f3f46" }} />
                    <div style={{ width: `${w2}%`, background: `linear-gradient(to left, ${colorB}, ${colorB}bb)` }} />
                  </div>
                  <div className="flex items-center justify-between px-4 py-2 text-[9px] font-bold">
                    <span style={{ color: colorA }}>{w1}%</span>
                    <span className="text-zinc-700">{match.h2h.played} played · {wx}% draws</span>
                    <span style={{ color: colorB }}>{w2}%</span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* ── Goals duel card ── */}
          <div
            className="relative rounded-2xl overflow-hidden mb-4"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {/* Split bg */}
            <div className="absolute inset-0 pointer-events-none flex">
              <div className="flex-1" style={{ background: `linear-gradient(to right, ${colorA}14 0%, transparent 70%)` }} />
              <div className="flex-1" style={{ background: `linear-gradient(to left, ${colorB}14 0%, transparent 70%)` }} />
            </div>

            <div className="relative flex items-center py-6">
              {/* Team A goals */}
              <div className="flex-1 flex flex-col items-center gap-1.5">
                <MatchFlagImg src={match.team_a.flag_url} alt={match.team_a.name} width={30} />
                <span
                  className="text-5xl font-black tabular-nums leading-none text-white mt-1"
                  style={{ letterSpacing: "-0.04em", textShadow: `0 0 24px ${colorA}80` }}
                >
                  {match.h2h.team_a_goals_scored}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">goals</span>
              </div>

              {/* VS divider */}
              <div className="flex flex-col items-center shrink-0 px-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-700">VS</span>
                {match.h2h.played > 0 && (
                  <span className="text-[9px] text-zinc-700 tabular-nums mt-1">
                    {((match.h2h.team_a_goals_scored + match.h2h.team_b_goals_scored) / match.h2h.played).toFixed(1)}/game
                  </span>
                )}
              </div>

              {/* Team B goals */}
              <div className="flex-1 flex flex-col items-center gap-1.5">
                <MatchFlagImg src={match.team_b.flag_url} alt={match.team_b.name} width={30} />
                <span
                  className="text-5xl font-black tabular-nums leading-none text-white mt-1"
                  style={{ letterSpacing: "-0.04em", textShadow: `0 0 24px ${colorB}80` }}
                >
                  {match.h2h.team_b_goals_scored}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">goals</span>
              </div>
            </div>
          </div>

          {/* ── Last meetings ── */}
          <div className="space-y-2">
            <div
              className="rounded-xl px-4 py-3 flex items-center justify-between gap-4"
              style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <span className="text-xs text-zinc-500 shrink-0">Last meeting</span>
              <span className="text-sm font-bold text-white text-right">{match.h2h.last_match}</span>
            </div>
            {match.h2h.last_wc_meeting && (
              <div
                className="rounded-xl px-4 py-3 flex items-center justify-between gap-4"
                style={{ backgroundColor: "rgba(0,255,135,0.03)", border: "1px solid rgba(0,255,135,0.12)" }}
              >
                <span className="text-xs text-zinc-500 shrink-0">Last WC meeting</span>
                <span className="text-sm font-bold text-right" style={{ color: "#00FF87" }}>
                  {match.h2h.last_wc_meeting}
                </span>
              </div>
            )}
          </div>
        </section>
        )}

        {/* Betting Odds */}
        {match.odds && match.odds.length > 0 && (() => {
          // William Hill entry displayed as 1xBet (visual only — will switch to real API later)
          const BRAND: Record<string, { color: string; label: string; affiliateUrl?: string }> = {
            "William Hill": { color: "#1452c8", label: "1xBet", affiliateUrl: "https://reffpa.com/L?tag=d_5477761m_1599c_&site=5477761&ad=1599" },
          };
          const displayOdds = match.odds!
            .filter((o) => Object.keys(BRAND).includes(o.bookmaker))
            .slice(0, 2);
          if (displayOdds.length === 0) return null;

          const GOLD = "#e8c45a";

          return (
            <section className="section-block">
              <h2 className="section-title text-xl mb-4">Betting Odds</h2>

              <div className="space-y-3">
                {displayOdds.map((odd) => {
                  const brand = BRAND[odd.bookmaker];
                  const raw1 = 1 / odd.team_a_win;
                  const rawX = 1 / odd.draw;
                  const raw2 = 1 / odd.team_b_win;
                  const total = raw1 + rawX + raw2;
                  const p1 = Math.round((raw1 / total) * 100);
                  const pX = Math.round((rawX / total) * 100);
                  const p2 = 100 - p1 - pX;

                  return (
                    <div
                      key={odd.bookmaker}
                      className="rounded-xl p-3"
                      style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      {/* Bookmaker name — top right */}
                      <div className="flex items-center justify-end mb-3">
                        <span
                          className="text-xs font-black tracking-tight"
                          style={{ color: brand.color }}
                        >
                          {brand.label}
                        </span>
                      </div>

                      {/* 3 buttons */}
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { key: "1", value: odd.team_a_win },
                          { key: "X", value: odd.draw       },
                          { key: "2", value: odd.team_b_win },
                        ] as { key: string; value: number }[]).map(({ key, value }) => (
                          <a
                            key={key}
                            href={brand.affiliateUrl ?? odd.affiliate_url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="flex flex-col items-center justify-between rounded-lg px-2 py-2.5 gap-1.5 transition-colors hover:border-zinc-500 active:opacity-75"
                            style={{
                              backgroundColor: "rgba(0,0,0,0.35)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            <span className="text-[10px] font-bold text-zinc-500">{key}</span>
                            <span
                              className="text-base font-black tabular-nums leading-none"
                              style={{ color: GOLD }}
                            >
                              {value.toFixed(2)}
                            </span>
                          </a>
                        ))}
                      </div>

                      {/* Probability bar */}
                      <div className="mt-3">
                        <div className="flex overflow-hidden h-px rounded-full mb-1.5"
                          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                          <div style={{ width: `${p1}%`, backgroundColor: GOLD, opacity: 0.8 }} />
                          <div style={{ width: `${pX}%`, backgroundColor: "rgba(255,255,255,0.15)" }} />
                          <div style={{ width: `${p2}%`, backgroundColor: GOLD, opacity: 0.5 }} />
                        </div>
                        <div className="grid grid-cols-3 text-[9px] tabular-nums" style={{ color: "#71717a" }}>
                          <span className="text-center">{p1}%</span>
                          <span className="text-center">{pX}%</span>
                          <span className="text-center">{p2}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-zinc-700 pt-2">
                18+ · Gamble responsibly · Odds subject to change
              </p>
            </section>
          );
        })()}

        {/* Prediction */}
        <section className="section-block">
          <h2 className="section-title text-xl mb-5">Our Prediction</h2>

          {/* Main card */}
          <div
            className="rounded-xl p-5 mb-4"
            style={{
              background: "linear-gradient(135deg, rgba(0,255,135,0.07) 0%, rgba(0,255,135,0.02) 100%)",
              border: "1px solid rgba(0,255,135,0.18)",
            }}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-1.5">
                  Predicted Result
                </p>
                <p className="text-3xl font-black" style={{ color: "#00FF87", letterSpacing: "-0.04em" }}>
                  {match.content.prediction}
                </p>
              </div>
              <div
                className="rounded-lg px-3 py-2 text-center shrink-0"
                style={{ backgroundColor: "rgba(0,255,135,0.1)", border: "1px solid rgba(0,255,135,0.2)" }}
              >
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500 mb-0.5">
                  Confidence
                </p>
                <p className="text-sm font-black" style={{ color: "#00FF87" }}>
                  {match.content.prediction_confidence}
                </p>
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(0,255,135,0.1)", paddingTop: "1rem" }}>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-600 mb-1.5">
                Key Battle
              </p>
              <p className="text-sm font-semibold text-zinc-200 leading-relaxed">
                {match.content.key_battle}
              </p>
            </div>
          </div>

          {/* Stats to watch */}
          {match.content.stats_to_watch && match.content.stats_to_watch.length > 0 && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-600 mb-3">
                Stats to Watch
              </p>
              <ul className="space-y-2">
                {match.content.stats_to_watch.map((stat, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-zinc-300 rounded-lg px-3 py-2.5"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span
                      className="shrink-0 text-xs font-black w-5 h-5 rounded flex items-center justify-center mt-0.5"
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {match.tv_channels.map((entry) => (
              <div
                key={entry.country}
                className="rounded-xl p-4"
                style={{
                  backgroundColor: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: "#3b82f6" }}
                  />
                  <span
                    className="text-[9px] font-black uppercase tracking-[0.15em]"
                    style={{ color: "#3b82f6" }}
                  >
                    {entry.country}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {entry.channels.map((ch) => (
                    <li key={ch} className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span className="w-px h-3 bg-zinc-700 shrink-0" />
                      {ch}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <AdSlot slot="1234567890" format="auto" />

        {/* Travel */}
        <section className="section-block">
          <h2 className="section-title text-xl mb-4">Travel & Tickets</h2>

          {/* Airport info pill */}
          <div
            className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3"
            style={{
              backgroundColor: "rgba(59,130,246,0.05)",
              border: "1px solid rgba(59,130,246,0.15)",
            }}
          >
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base"
              style={{ backgroundColor: "rgba(59,130,246,0.12)" }}
            >
              ✈️
            </span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-0.5">
                Nearest airport
              </p>
              <p className="text-sm font-bold text-white">{match.travel.nearest_airport}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href={match.travel.hotel_affiliate_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-opacity hover:opacity-85"
              style={{ backgroundColor: "#00FF87", color: "#0a0a0a" }}
            >
              🏨 Book Hotel
            </a>
            <a
              href={match.travel.flight_affiliate_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold text-zinc-300 transition-colors hover:border-zinc-400 hover:text-white"
              style={{ borderColor: "rgba(255,255,255,0.15)" }}
            >
              ✈️ Find Flights
            </a>
          </div>
        </section>

        {/* Squad Comparison */}
        <MatchSquads
          teamA={match.team_a}
          teamB={match.team_b}
          squadA={squadA}
          squadB={squadB}
        />

        {/* Venue */}
        {stadium && (
          <section className="section-block !p-0 overflow-hidden">
            {stadium.photo_url && (
              <div className="w-full h-40 overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={stadium.photo_url}
                  alt={stadium.name}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(10,10,10,0.85) 0%, transparent 60%)" }}
                />
                {stadium.is_final_venue && (
                  <span className="badge-green absolute top-3 left-4">Final Venue</span>
                )}
                <h2 className="section-title text-xl absolute bottom-3 left-4">Venue</h2>
              </div>
            )}
            <div className="p-4">
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
                    {!stadium.photo_url && stadium.is_final_venue && (
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
            </div>
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
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
              {relatedMatches.map((m) => {
                const city = m.city.split(",")[0].trim();
                return (
                  <Link
                    key={m.slug}
                    href={`/matches/${m.slug}`}
                    className="flex items-center gap-2 sm:gap-3 px-3 py-3 transition-colors hover:bg-white/[0.03] group"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    {/* Team A */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                      <span className="font-bold text-white text-xs sm:text-sm truncate text-right" style={{ letterSpacing: "-0.01em" }}>
                        {m.team_a.name}
                      </span>
                      <MatchFlagImg src={m.team_a.flag_url} alt={m.team_a.name} />
                    </div>

                    {/* Centre */}
                    <div className="flex flex-col items-center shrink-0 w-20 sm:w-28">
                      <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                        {new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <span className="text-[9px] text-zinc-500 mt-0.5 tabular-nums">{m.kickoff_utc} UTC</span>
                      <span className="text-[10px] font-black mt-1" style={{ color: "#00FF87", letterSpacing: "0.05em" }}>VS</span>
                      <span className="text-[9px] text-zinc-400 mt-0.5 text-center truncate max-w-full">{city}</span>
                    </div>

                    {/* Team B */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <MatchFlagImg src={m.team_b.flag_url} alt={m.team_b.name} />
                      <span className="font-bold text-white text-xs sm:text-sm truncate" style={{ letterSpacing: "-0.01em" }}>
                        {m.team_b.name}
                      </span>
                    </div>

                    {/* Odds + arrow (desktop) */}
                    <div className="hidden sm:flex items-center gap-3 shrink-0 ml-2">
                      {m.odds && m.odds.length > 0 && (
                        <div className="flex gap-2 text-[10px] font-bold tabular-nums">
                          <span style={{ color: "#00FF87" }}>{m.odds[0].team_a_win.toFixed(2)}</span>
                          <span className="text-zinc-500">{m.odds[0].draw.toFixed(2)}</span>
                          <span className="text-blue-400">{m.odds[0].team_b_win.toFixed(2)}</span>
                        </div>
                      )}
                      <span className="text-[10px] font-bold opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: "#00FF87" }}>→</span>
                    </div>

                    {/* Mobile arrow */}
                    <span className="sm:hidden text-[10px] font-bold shrink-0 opacity-30 group-hover:opacity-100 transition-opacity" style={{ color: "#00FF87" }}>→</span>
                  </Link>
                );
              })}
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

        <AdSlot slot="1234567890" format="auto" />
      </article>
    </>
  );
}
