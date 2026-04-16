# READ THIS FILE FIRST BEFORE DOING ANYTHING
# FootBrowse — Claude Session Memory

Last updated: 2026-04-16  
Current Phase: **Phase 5 — Match Experience + Homepage**  
Next task: **TASK 20 — WC 2026 Hub Page**

---

## Vision

Full navigation flow:
1. **Homepage** → today's matches grouped by league, browse prev/next day
2. **Click league header** → `/leagues/[slug]` (fixtures, standings, teams, scorers)
3. **Click match** → `/leagues/[slug]/matches/[match-slug]` (Preview or Finished mode)
4. **Click team** → `/leagues/[slug]/teams/[team-slug]`
5. **Click player** → `/players/[slug]`

**Google target:** 5,000+ indexed pages (leagues × teams × players × matches), each with unique AI-generated content — not just raw data tables.

**World Cup 2026:** Lives at `/leagues/world-cup` (already canonical). Dedicated `/world-cup` hub section for SEO traffic during tournament (June–July 2026).

---

## API Keys

```
API_FOOTBALL_KEY=f02e9ab608ec4ab3d42b1e82af607e35   ← set in .env.local ✅
```

API-Football account: https://dashboard.api-football.com  
**Current plan: Pro (7,500 requests/day)**

**GitHub Secrets:**
- `API_FOOTBALL_KEY`
- `VERCEL_DEPLOY_HOOK_URL`

---

## Current Architecture

**Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · Vercel · Git-committed JSON  
**Local path:** `C:\Users\Dell\.antigravity\Footbrowse\`

**Data files:**
```
data/leagues.json                  5 priority leagues
data/fixtures/*.json               1,411 fixtures across 5 leagues
data/standings/*.json              league tables
data/topscorers/*.json             top scorers/assists per league
data/today.json                    today's fixtures (rebuilt daily)
data/teams.json                    48 WC national teams (handcrafted, DO NOT REPLACE)
data/club-teams.json               172 club teams
data/players.json                  1,637 WC national team players
data/club-players.json             3,269 club players
data/players-by-team.json          keyed by teamSlug
data/player-stats/*.json           career stat files
data/team-stats/*.json             team stats per league
data/match-events/*.json           cached events for completed matches
data/matches.json                  104 WC 2026 fixtures (handcrafted, DO NOT REPLACE)
data/stadiums.json                 19 WC stadiums
data/coaches/*.json                coach files per team-slug
data/injuries/{league-slug}.json   injury/suspension data
data/h2h/{id1}-{id2}.json          head-to-head history
data/predictions/{fixture_id}.json AI win probability + advice
data/odds/{fixture_id}.json        Bet365 Match Winner odds
data/club-squads/{team-slug}.json  club squad files
```

**Active GitHub Actions:**
- `daily-fixtures.yml` — 06:00 UTC daily: fixtures + predictions + odds
- `weekly-league-data.yml` — Mon 03:00 UTC: standings + topscorers + coaches + injuries + h2h
- `sync-players.yml` — Mon 03:00 UTC: WC squad sync

---

## Task Completion Log

| Task | Description | Status | Notes |
|---|---|---|---|
| TASK 1 | API Client + Environment Setup | ✅ DONE | 2026-04-14 |
| TASK 2 | Bootstrap League Data | ✅ DONE | 2026-04-14 |
| TASK 3 | `/leagues/[slug]` Page Shell | ✅ DONE | 2026-04-14 |
| TASK 4 | Fixtures Sync + `/leagues/[slug]/matches` | ✅ DONE | 2026-04-14 — 1,411 fixtures |
| TASK 5 | Standings Sync + `/leagues/[slug]/standings` | ✅ DONE | 2026-04-14 |
| TASK 6 | Teams Per League | ✅ DONE | 2026-04-14 — 172 club teams metadata |
| TASK 7 | Top Players / Scorers | ✅ DONE | 2026-04-14 |
| TASK 8 | Homepage Redesign | ✅ DONE | 2026-04-14 — multi-league, today's matches |
| TASK 9 | Navigation + Sitemap Update | ✅ DONE | 2026-04-14 |
| TASK 10 | GitHub Actions: New Sync Workflows | ✅ DONE | 2026-04-14 |
| TASK 11 | Match Page: Live Events + Score | ✅ DONE | 2026-04-14 |
| TASK 12 | Team Page: League Context + Stats | ✅ DONE | 2026-04-14 |
| TASK 13 | Player Page: Career Stats | ✅ DONE | 2026-04-14 |
| TASK 14 | Replace football-data.org with API-Football | ✅ DONE | 2026-04-14 — 1,637 players |
| TASK 15 | Bootstrap Club Teams | ✅ DONE | 2026-04-15 — Unified `/leagues/[slug]/teams/[teamSlug]`; `/teams/[slug]` redirects to WC |
| TASK 16 | Bootstrap Club Players | ✅ DONE | 2026-04-15 — 3,269 club players, 4,880 total player pages |
| TASK 17 | Coach Sync | ✅ DONE | 2026-04-15 — 193 coach files; `scripts/sync/weekly-coaches.ts` |
| TASK 18 | Injuries Widget | ✅ DONE | 2026-04-15 — `lib/injuries.ts`, `components/InjuryList.tsx`; on team + match pages |
| TASK 19 | Match Routes Under League Path | ✅ DONE | 2026-04-15 — `/leagues/[slug]/matches/[match-slug]` canonical; `/matches/[slug]` 308 redirects |
| TASK 19b | Match Page Unification | ✅ DONE | 2026-04-15 — Single template, Preview/Finished modes, all sections for all leagues |
| TASK 21 | Predictions Integration | ✅ DONE | 2026-04-15 — `lib/predictions.ts`, `scripts/sync/daily-predictions.ts`, integrated into match page |
| TASK 22 | Odds Integration | ✅ DONE | 2026-04-15 — `lib/odds.ts`, `scripts/sync/daily-odds.ts`, Bet365 odds on all match pages |
| TASK 20 | WC 2026 Dedicated Section (`/world-cup`) | ⬜ TODO | Hub page: groups, fixtures, stadiums, countdown |
| TASK 23 | Top Scorers Leaderboard Page | ⬜ TODO | `/stats` — cross-league leaderboards, 0 API calls |
| TASK 23b | Players Directory Redesign | ⬜ TODO | League filter + search bar; 0 API calls |
| TASK 24 | Final Polish + Performance Audit | ⬜ TODO | SEO meta, Schema.org, sitemap, mobile, 404s |
| TASK 30 | Homepage Date Navigation | ✅ DONE | 2026-04-16 — `DateMatchesSection.tsx`, `lib/date-fixtures.ts`, `lib/wc-ids.ts`; prev/next day arrows + today reset |
| TASK 31 | Pre-Match Lineup Widget | ✅ DONE | 2026-04-16 — `lib/lineups.ts`, `scripts/sync/pre-match-lineups.ts`, `components/MatchLineup.tsx`, `.github/workflows/pre-match.yml`; shows on club match preview pages |
| TASK 32 | Finished Match Page Enhancement | ✅ DONE | 2026-04-16 — Match Summary (goals+assists+cards), visual timeline bar with half grouping, expanded stats (offsides/saves/xG), sync default limit 5→20 + --stale flag |
| TASK 33 | LLM Content Generation | ⬜ TODO | AI-generated match previews, team bios, player insights, coach descriptions — unique text per page for SEO |
| TASK 34 | Supabase Schema Setup | ⬜ TODO | Phase 7 — after LLM content |
| TASK 35 | Data Migration: JSON → Supabase | ⬜ TODO | Phase 7 |
| TASK 36 | ISR for League + Match Pages | ⬜ TODO | Phase 7 |
| TASK 37 | Live Scores System | ⬜ TODO | Phase 7 — trigger on match start, poll 2-3 min (90+ min: 30 sec), archive on FT |
| TASK 38 | Add More Leagues | ⬜ TODO | Serie A, Ligue 1, Eredivisie, MLS, Copa Libertadores |

---

## Phase Progress

| Phase | Tasks | Status | Goal |
|---|---|---|---|
| Phase 1: Foundation | 1–5 | ✅ DONE | API + league pages |
| Phase 2: League Layer | 6–10 | ✅ DONE | Fixtures, standings, nav |
| Phase 3: Entity Enrichment | 11–14 | ✅ DONE | Match events, stats, squads |
| Phase 4: Club Teams + Match Unification | 15–19b, 21, 22 | ✅ DONE | Club teams/players, unified match page, predictions, odds |
| Phase 5: Match Experience + Homepage | 20, 23, 23b, 24, 30, 31, 32 | 🔄 CURRENT | Best-in-class match pages + homepage UX |
| Phase 6: LLM Content | 33 | ⬜ TODO | Unique AI content on every page for SEO trust |
| Phase 7: Database + Live Scores | 34–37 | ⬜ TODO | Supabase, ISR, real-time live scores |
| Phase 8: Scale | 38 | ⬜ TODO | More leagues, more pages |

**World Cup 2026 starts: June 11, 2026**  
**Hard deadline: All features live by May 25, 2026 (2+ weeks buffer before tournament)**

---

## Key Decisions

1. **Zero URL breakage** — All existing slugs preserved. `/matches/[slug]` 308-redirects to `/leagues/[slug]/matches/[match-slug]`.

2. **JSON-first, Supabase in Phase 7** — Keep git-committed JSON through Phase 6. Supabase is Phase 7 (after LLM content is stable).

3. **Single API source** — API-Football v3 only.

4. **WC 2026 handcrafted data is ground truth** — `data/matches.json` and `data/teams.json` are NOT replaced by API until tournament starts.

5. **LLM content is Phase 6 priority** — Google penalises pure-API content that looks duplicated across thousands of pages. Every team/player/match page needs unique editorial text generated by LLM. This is the single biggest SEO differentiator.

6. **Live scores require Supabase** — Polling every 30 seconds during 90+ min cannot commit to git. Phase 7 only.

7. **Lineup data is time-sensitive** — Lineups appear ~2h before kickoff. Needs a frequent GitHub Actions cron (every 30 min) NOT a daily one.

---

## Design System (DO NOT CHANGE)

```
Brand color:       #00FF87 (green)
Background:        #0a0a0a
Card bg:           rgba(255,255,255,0.03–0.05)
Card border:       rgba(255,255,255,0.07–0.10)
Text primary:      #FFFFFF
Text secondary:    #A1A1AA (zinc-400)
Text muted:        #71717A (zinc-500)
Font weight hero:  font-black (900)
Letter spacing:    -0.04em (headings), -0.02em (cards)
Badge green:       .badge-green class
Badge blue:        .badge-blue class
Tag:               .tag class
```

All new pages MUST use the existing design system.

---

## Critical Files

```
/MIGRATION_PLAN.md                             ← Full phased spec for each task
/CLAUDE_CONTEXT.md                             ← This file
/data/                                         ← DO NOT TOUCH unless task says so
/lib/data.ts                                   ← DO NOT TOUCH unless task says so
/app/page.tsx                                  ← Homepage
/app/layout.tsx                                ← Global layout
/app/leagues/[slug]/matches/[match-slug]/page.tsx ← Unified match page (Preview + Finished)
/app/leagues/[slug]/teams/[teamSlug]/page.tsx  ← Team page
/app/players/[slug]/page.tsx                   ← Player page
/lib/predictions.ts                            ← Reads data/predictions/
/lib/odds.ts                                   ← Reads data/odds/
/lib/h2h.ts                                    ← Reads data/h2h/
/lib/injuries.ts                               ← Reads data/injuries/
/scripts/sync/daily-predictions.ts            ← 14-day window, stale after 48h
/scripts/sync/daily-odds.ts                   ← 7-day window, stale after 24h
/scripts/sync/weekly-h2h.ts                   ← Upcoming fixture pairings
/scripts/sync/weekly-injuries.ts              ← Per league
/scripts/sync/weekly-coaches.ts               ← Stale after 7 days
```
