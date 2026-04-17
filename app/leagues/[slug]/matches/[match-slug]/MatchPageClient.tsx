"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import MatchHero from "./components/MatchHero";
import MatchMiniBar from "./components/MatchMiniBar";
import MatchOddsStrip from "./components/MatchOddsStrip";
import MatchTabBar from "./components/MatchTabBar";
import OverviewTab from "./components/tabs/OverviewTab";
import EventsTab from "./components/tabs/EventsTab";
import StatsTab from "./components/tabs/StatsTab";
import LineupsTab from "./components/tabs/LineupsTab";
import H2HTab from "./components/tabs/H2HTab";
import OddsTab from "./components/tabs/OddsTab";
import SquadTab from "./components/tabs/SquadTab";

// ── Shared data types (serialisable — no lib/* imports) ──────────────────────

export interface MatchEventItem {
  minute: number;
  extra: number | null;
  team_id: number;
  player: string;
  assist: string | null;
  type: "Goal" | "Card" | "subst" | "Var";
  detail: string;
}

export interface MatchStatGroup {
  team_id: number;
  possession: number | null;
  shots_on: number | null;
  shots_total: number | null;
  corners: number | null;
  fouls: number | null;
  yellow_cards: number | null;
  red_cards: number | null;
  offsides: number | null;
  saves: number | null;
  xg: number | null;
}

export interface H2HMatchItem {
  fixture_id: number;
  date: string;
  league: string;
  home_id: number;
  home_name: string;
  home_logo: string;
  away_id: number;
  away_name: string;
  away_logo: string;
  home_score: number | null;
  away_score: number | null;
}

export interface LineupPlayerData {
  id: number;
  name: string;
  number: number;
  pos: string;
  grid: string | null;
}

export interface TeamLineupData {
  team_id: number;
  team_name: string;
  formation: string;
  coach: string | null;
  startXI: LineupPlayerData[];
  substitutes: LineupPlayerData[];
}

export interface InjuryItem {
  player_id: number;
  player_name: string;
  player_photo: string | null;
  type: string;
  reason: string | null;
  team_id: number;
  team_name: string;
  team_logo: string;
  team_slug: string;
  fixture_id: number;
  fixture_date: string;
}

export interface SyncedPlayerData {
  id: number;
  slug: string;
  name: string;
  firstName: string;
  lastName: string;
  position: string;
  shirtNumber: number | null;
  nationality: string;
  photo_url: string | null;
  thumbnail_url: string | null;
  teamId: number;
  teamName: string;
  teamSlug: string;
  teamCrest: string;
  bio: string | null;
  dateOfBirth: string | null;
  marketValue: string | null;
}

export interface TeamInfoData {
  name: string;
  slug: string;
  code: string;
  logo?: string;
  teamHrefPrefix?: string;
}

export interface StandingRowData {
  rank: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goal_diff: number;
  description: string | null;
}

export interface MatchPageData {
  // League
  leagueSlug: string;
  leagueName: string;
  leagueLogo: string;

  // Flags
  isWC: boolean;
  isNational: boolean;

  // Teams
  homeId: number;
  awayId: number;
  homeName: string;
  awayName: string;
  homeLogo: string;
  awayLogo: string;
  homeSlug: string;
  awaySlug: string;
  homeIsFlag: boolean;
  awayIsFlag: boolean;
  homeFifaRank: number | null;
  awayFifaRank: number | null;

  // Match meta
  matchDate: string;
  kickoffUtc: string;
  kickoffEst: string | null;
  fixtureStatus: string;
  fixtureStatusLabel: string;
  fixtureId: number | null;
  matchday: number | null;
  stage: string | null;
  city: string | null;
  group: string | null;

  // Status
  finished: boolean;
  live: boolean;
  upcoming: boolean;

  // Score + events
  score: { home: number | null; away: number | null };
  homeTeamId: number;
  events: MatchEventItem[];
  homeStats: MatchStatGroup | null;
  awayStats: MatchStatGroup | null;

  // Form
  homeForm: string;
  awayForm: string;
  homeTeamRecord: {
    wins: number; draws: number; losses: number;
    goals_for: number; goals_against: number;
    clean_sheets: number; played: number;
  } | null;
  awayTeamRecord: {
    wins: number; draws: number; losses: number;
    goals_for: number; goals_against: number;
    clean_sheets: number; played: number;
  } | null;

  // National comparison
  homeNationalInfo: { fifaRank: number | null; yearFormed: string | number | null; wcTitles: number | string } | null;
  awayNationalInfo: { fifaRank: number | null; yearFormed: string | number | null; wcTitles: number | string } | null;

  // H2H
  h2h: {
    played: number;
    homeWins: number;
    awayWins: number;
    draws: number;
    homeGoals: number;
    awayGoals: number;
    lastMatches: H2HMatchItem[];
  } | null;

  // Prediction
  prediction: {
    advice: string;
    winner_name: string | null;
    winner_comment: string | null;
    percent: { home: string; draw: string; away: string };
    under_over: string | null;
    goals_home: string | null;
    goals_away: string | null;
  } | null;

  // Odds
  oddsData: {
    bookmaker_name: string;
    home_win: number;
    draw: number;
    away_win: number;
  } | null;

  // Lineup
  lineup: {
    home: TeamLineupData;
    away: TeamLineupData;
  } | null;

  // Squads
  squadA: SyncedPlayerData[];
  squadB: SyncedPlayerData[];
  teamAInfo: TeamInfoData;
  teamBInfo: TeamInfoData;

  // Injuries
  homeInjuries: InjuryItem[];
  awayInjuries: InjuryItem[];

  // Venue
  venueName: string | null;
  venueCity: string | null;
  venueCapacity: number | null;
  homeClubFounded: number | null;
  stadiumInfo: {
    slug: string;
    name: string;
    city: string;
    state: string;
    capacity: number;
    surface: string;
    roof: string;
    photo_url: string | null;
    is_final_venue: boolean;
  } | null;

  // WC extras
  wcPreview: string | null;

  // Where to Watch
  tvChannels: Array<{ country: string; channels: string[] }>;

  // Travel
  travel: {
    nearest_airport: string | null;
    hotel_affiliate_url: string;
    flight_affiliate_url: string;
  } | null;

  // Standings (club leagues only)
  homeStandingRow: StandingRowData | null;
  awayStandingRow: StandingRowData | null;

  // Related + FAQ
  relatedMatches: Array<{ label: string; href: string; meta: string }>;
  faqItems: Array<{ q: string; a: string }>;
}

// ── Tab config ────────────────────────────────────────────────────────────────

function buildTabs(data: MatchPageData): Array<{ id: string; label: string }> {
  if (data.finished || data.live) {
    return [
      { id: "match-info", label: "Match Info" },
      ...(data.events.length > 0               ? [{ id: "events",  label: "Events" }]     : []),
      ...(data.homeStats || data.awayStats      ? [{ id: "stats",   label: "Statistics" }] : []),
      { id: "lineups",   label: "Lineups" },
      ...(data.squadA.length > 0 || data.squadB.length > 0 ? [{ id: "squad", label: "Squad" }] : []),
    ];
  }
  return [
    { id: "match-info", label: "Match Info" },
    ...(data.h2h && data.h2h.played > 0        ? [{ id: "h2h",     label: "H2H" }]        : []),
    ...(data.prediction || data.oddsData        ? [{ id: "odds",    label: "Odds" }]        : []),
    { id: "lineups",  label: "Lineups" },
    ...(data.squadA.length > 0 || data.squadB.length > 0 ? [{ id: "squad", label: "Squad" }] : []),
  ];
}

// ── Inner component (uses useSearchParams — must be inside Suspense) ──────────

function MatchPageInner({ data }: { data: MatchPageData }) {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const pathname     = usePathname();
  const contentRef   = useRef<HTMLDivElement>(null);
  const stickyRef    = useRef<HTMLDivElement>(null);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 80);
    h();
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const tabs     = buildTabs(data);
  const rawTab   = searchParams.get("tab") ?? "match-info";
  const activeTab = tabs.find((t) => t.id === rawTab)?.id ?? "match-info";

  const handleTabChange = (tabId: string) => {
    const url = tabId === "match-info" ? pathname : `${pathname}?tab=${tabId}`;
    router.replace(url, { scroll: false });
    // Scroll content to just below the sticky block — never back to full-hero top
    if (contentRef.current && stickyRef.current) {
      const stickyH = stickyRef.current.offsetHeight;
      const contentTop = contentRef.current.getBoundingClientRect().top + window.scrollY;
      const target = contentTop - stickyH - 8; // 8px breathing room
      if (window.scrollY > target || window.scrollY + window.innerHeight < contentTop) {
        window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
      }
    }
  };

  const homeRecord = data.homeTeamRecord
    ? `${data.homeTeamRecord.wins}W ${data.homeTeamRecord.draws}D ${data.homeTeamRecord.losses}L`
    : null;
  const awayRecord = data.awayTeamRecord
    ? `${data.awayTeamRecord.wins}W ${data.awayTeamRecord.draws}D ${data.awayTeamRecord.losses}L`
    : null;

  return (
    <>
      {/* ── Sticky hero + tab bar (top-14 = 56px to clear the site navbar) ── */}
      <div ref={stickyRef} className="sticky top-14 z-40">
        {scrolled ? (
          <MatchMiniBar
            homeName={data.homeName}
            awayName={data.awayName}
            homeLogo={data.homeLogo}
            awayLogo={data.awayLogo}
            homeIsFlag={data.homeIsFlag}
            awayIsFlag={data.awayIsFlag}
            score={data.score}
            kickoffUtc={data.kickoffUtc}
            matchDate={data.matchDate}
            finished={data.finished}
            live={data.live}
            fixtureStatusLabel={data.fixtureStatusLabel}
          />
        ) : (
          <MatchHero
            leagueSlug={data.leagueSlug}
            leagueName={data.leagueName}
            leagueLogo={data.leagueLogo}
            isWC={data.isWC}
            group={data.group}
            stage={data.stage}
            fixtureStatusLabel={data.fixtureStatusLabel}
            finished={data.finished}
            live={data.live}
            matchday={data.matchday}
            homeName={data.homeName}
            awayName={data.awayName}
            homeLogo={data.homeLogo}
            awayLogo={data.awayLogo}
            homeSlug={data.homeSlug}
            awaySlug={data.awaySlug}
            homeIsFlag={data.homeIsFlag}
            awayIsFlag={data.awayIsFlag}
            homeFifaRank={data.homeFifaRank}
            awayFifaRank={data.awayFifaRank}
            homeRecord={homeRecord}
            awayRecord={awayRecord}
            score={data.score}
            kickoffUtc={data.kickoffUtc}
            kickoffEst={data.kickoffEst}
            matchDate={data.matchDate}
            city={data.city}
            venueName={data.venueName}
          />
        )}
        <MatchOddsStrip oddsData={data.oddsData} />
        <MatchTabBar tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* ── Tab content ── */}
      <div ref={contentRef} className="pt-6 pb-8 space-y-6 max-w-2xl mx-auto px-4">
        {activeTab === "match-info" && <OverviewTab  data={data} />}
        {activeTab === "events"    && <EventsTab    data={data} />}
        {activeTab === "stats"     && <StatsTab     data={data} />}
        {activeTab === "lineups"   && <LineupsTab   data={data} />}
        {activeTab === "h2h"       && <H2HTab       data={data} />}
        {activeTab === "odds"      && <OddsTab      data={data} />}
        {activeTab === "squad"     && <SquadTab     data={data} />}

        <AdSlot slot="1234567890" format="auto" />

        {/* ── Related Matches ── */}
        {data.relatedMatches.length > 0 && (
          <section>
            <h2 className="section-title text-xl mb-4">
              {data.isWC ? "More World Cup Matches" : `More ${data.leagueName} Fixtures`}
            </h2>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
              {data.relatedMatches.map((m, i) => (
                <Link key={i} href={m.href}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03] group"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="text-sm font-semibold text-zinc-300 group-hover:text-white truncate">{m.label}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-zinc-600">{m.meta}</span>
                    <span className="text-[10px] font-bold opacity-30 group-hover:opacity-100"
                      style={{ color: "#00FF87" }}>→</span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link href={`/leagues/${data.leagueSlug}/matches`}
                className="inline-block rounded-lg px-6 py-3 text-sm font-bold text-white hover:opacity-80"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                All {data.leagueName} fixtures →
              </Link>
            </div>
          </section>
        )}

        {/* ── FAQ ── (outside tabs for SEO) */}
        {data.faqItems.length > 0 && (
          <section className="section-block">
            <h2 className="section-title text-xl mb-5">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {data.faqItems.map((item, i) => (
                <div key={i} className="rounded-xl p-4"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="font-bold text-white text-sm mb-2">{item.q}</p>
                  <p className="text-sm text-zinc-400 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

export default function MatchPageClient({ data }: { data: MatchPageData }) {
  return (
    <Suspense fallback={null}>
      <MatchPageInner data={data} />
    </Suspense>
  );
}
