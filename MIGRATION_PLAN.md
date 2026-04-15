# FootBrowse Migration Plan
## Architecture: API-Football v3 Multi-League Platform
### Last updated: 2026-04-15 | Status: Phase 5 — Match Experience + Homepage

---

## READ THIS BEFORE EXECUTING ANY TASK

- Read `/CLAUDE_CONTEXT.md` first — task log, current status, design system
- Never touch `/data/` or `/lib/` unless the task explicitly says to
- Each TASK is a self-contained session
- Mark the TASK complete in `CLAUDE_CONTEXT.md` when done

---

## Vision

A multi-league football platform with:
1. **Homepage** — today's matches grouped by league, browseable by date (Sofascore-style)
2. **League pages** — fixtures, standings, teams, top scorers
3. **Match pages** — two modes: Preview (lineup, H2H, prediction, odds, where to watch, travel) and Finished (timeline, stats, scorers)
4. **Team pages** — squad, coach, form, stats, injury report
5. **Player pages** — bio, career stats, AI-generated insights
6. **5,000+ Google-indexed pages** each with unique AI-generated editorial content

---

## API-Football Endpoint Reference

| Endpoint | Returns | Phase |
|---|---|---|
| `GET /leagues` | League metadata | Phase 1 |
| `GET /fixtures?date=` | All fixtures for a date | Daily |
| `GET /fixtures?league=&season=` | All fixtures in league | Phase 1 |
| `GET /fixtures/statistics?fixture=` | Shots, possession, corners etc. | Phase 3 |
| `GET /fixtures/events?fixture=` | Goals, cards, subs | Phase 3 |
| `GET /fixtures/lineups?fixture=` | Starting XI, bench, formation | **TASK 31** |
| `GET /fixtures/headtohead?h2h=` | H2H history | Phase 4 |
| `GET /standings?league=&season=` | League table | Phase 2 |
| `GET /teams?league=&season=` | Team list | Phase 1 |
| `GET /teams/statistics?team=&league=&season=` | Team aggregated stats | Phase 3 |
| `GET /players/squads?team=` | Squad list | Phase 2 |
| `GET /players/topscorers?league=&season=` | Top 20 scorers | Phase 2 |
| `GET /injuries?league=&season=` | Injuries/suspensions | Phase 4 |
| `GET /predictions?fixture=` | Win probability + tips | **DONE** |
| `GET /odds?fixture=&bookmaker=` | Pre-match odds | **DONE** |
| `GET /coachs?team=` | Coach + career | Phase 4 |

**Current plan: Pro (7,500 req/day)**

---

## Priority Leagues

| League | ID | Season |
|---|---|---|
| FIFA World Cup | 1 | 2026 |
| UEFA Champions League | 2 | 2025 |
| Premier League | 39 | 2025 |
| La Liga | 140 | 2025 |
| Bundesliga | 78 | 2025 |

---

## Completed Phases

### ✅ Phase 1–3: Foundation + League Layer + Entity Enrichment (Tasks 1–14)
API client, league pages, fixtures, standings, top scorers, homepage, nav, match events, team stats, player stats, squad sync.

### ✅ Phase 4: Club Teams + Match Unification (Tasks 15–19b, 21, 22)
- Club team pages, club player pages, coach sync, injuries widget
- Unified match page template (Preview + Finished modes, all leagues)
- H2H sync + lib, predictions sync + lib, odds sync + lib
- Where to Watch (static per league), Travel & Tickets for club matches
- All match sections now work for ALL leagues identically

---

## Phase 5: Match Experience + Homepage
*Goal: Best-in-class match pages and Sofascore-style homepage.*

---

### TASK 30 — Homepage Date Navigation
**Goal:** Allow users to browse matches by date — today, tomorrow, yesterday — with prev/next arrows, exactly like Sofascore or FlashScore.

**Current state:** Homepage shows `data/today.json` (today only). No way to browse to tomorrow's or yesterday's fixtures.

**Approach:**
- Make homepage a Client Component (`"use client"`)
- Store selected date in state (default: today)
- Filter `data/fixtures/*.json` client-side by selected date
- Prev/next arrow buttons + "Today" reset button
- Display: `← Apr 14 | Today, Apr 15 | Apr 16 →`
- Group by league, same visual as current homepage
- Pre-generate match data as a flat index at build time (or use `data/today.json` pattern extended to a rolling 7-day window)

**Files to modify:**
- `app/page.tsx` — add date picker state + date filtering logic
- `scripts/sync/daily-fixtures.ts` — extend `data/today.json` to a 7-day window (`data/schedule.json`) so client can filter without extra API calls
- OR keep SSG + use `?date=` search param with `useSearchParams`

**Expected output:** User can navigate through days, sees all matches per day grouped by league.

---

### TASK 31 — Pre-Match Lineup Widget
**Goal:** Show the confirmed starting XI and formation on match preview pages, ~2 hours before kickoff.

**How lineups work:**
- API Football releases lineups via `GET /fixtures/lineups?fixture={id}` roughly 60–90 minutes before kickoff
- Before lineup release: returns empty array → show "Lineup TBA"
- After release: returns starting XI (11 players), bench, formation, coach

**Files to create:**
- `scripts/sync/pre-match-lineups.ts` — fetches lineups for matches starting in the next 3 hours; skips if already stored and complete
- `data/lineups/{fixture_id}.json` — lineup file per fixture
- `lib/lineups.ts` — `getLineup(fixtureId)` reader
- `components/MatchLineup.tsx` — visual: formation label, two columns (home/away), starting XI with shirt numbers + positions, bench list

**Files to modify:**
- `app/leagues/[slug]/matches/[match-slug]/page.tsx` — load lineup, show "Lineups" section in Preview mode (above Squad Preview)
- `.github/workflows/pre-match.yml` — NEW workflow: runs every 30 minutes, calls `sync:lineups`
- `package.json` — add `"sync:lineups": "tsx scripts/sync/pre-match-lineups.ts"`

**GitHub Actions cron:** Every 30 min is `*/30 * * * *`. Only ~2 API calls per run (matches starting within 3h).

**Lineup section design:**
```
[ Formation: 4-3-3 ]
Home XI              Away XI
#1 GK Alisson        Courtois #1 GK
#66 CB Alexander-A.  Carvajal #2 RB
...
[ Bench ]
```

**Expected output:** Match preview for a game starting in 90 min shows confirmed starting XI. Shows "Lineup not yet announced" until available.

---

### TASK 32 — Finished Match Page Enhancement
**Goal:** Make the finished match page visually richer — better timeline, better stats, player highlights.

**Current state:** Finished mode has goal scorers, events timeline, match statistics. Good but basic.

**Improvements:**

1. **Events timeline redesign:**
   - Group events by half (1st Half / 2nd Half / Extra Time)
   - Visual match timeline bar at top showing when goals/cards happened (like a progress bar with markers)
   - Cleaner event rows: team color stripe on left side

2. **Stats section improvements:**
   - Add percentage bars to ALL stat rows (not just possession)
   - Show "xG" if available from API
   - Add pass accuracy, offsides, saves if available in match stats

3. **Player highlights section (derived from events):**
   - Highest-impact players: goal scorers with minute, assist givers
   - Cards section: yellow/red card recipients
   - Substitutions summary: who came on/off and when
   - No extra API calls — all from existing `data/match-events/`

4. **Match events sync improvement:**
   - `scripts/sync/match-events-batch.ts` — ensure it catches ALL recently finished matches
   - Currently may miss matches that finished between syncs

**Files to modify:**
- `app/leagues/[slug]/matches/[match-slug]/page.tsx` — restructure Finished mode sections
- `scripts/sync/match-events-batch.ts` — audit and improve reliability

---

### TASK 20 — WC 2026 Dedicated Section (`/world-cup`)
**Goal:** Tournament hub at `/world-cup` for maximum SEO traffic during June–July 2026.

**All data from existing JSON — zero API calls.**

**Files to create:**
- `app/world-cup/page.tsx` — hub page

**Hub page sections:**
1. Hero: WC 2026 logo, USA/Canada/Mexico, countdown to June 11
2. Groups grid: 12 groups × 4 teams (link to `/leagues/world-cup/teams/[slug]`)
3. Next 7 upcoming fixtures
4. All 48 qualified teams grid with crests
5. 19 stadiums grid
6. Navigation links to league-scoped WC pages

**Note:** All team/player/match/stadium pages already live under `/leagues/world-cup/*`. This hub is purely a landing page + SEO aggregator.

---

### TASK 23 — Top Scorers Leaderboard Page
**Goal:** Cross-league stats leaderboard.

**Files to create:**
- `app/stats/page.tsx` — tabbed: Top Scorers | Top Assists | Most Cards

**0 API calls** — reuses `data/topscorers/*.json`

**Sections:**
- League filter tabs (All / PL / La Liga / UCL / Bundesliga)
- Ranked player cards: photo, name, team, goals/assists, minutes

---

### TASK 23b — Players Directory Redesign
**Goal:** `/players` currently shows WC squads only. Needs to work for all leagues.

**Files to modify:**
- `app/players/page.tsx` — add league filter dropdown + name search bar
- Uses existing `data/club-players.json` + `data/players.json` (0 API calls)

**Filters:** League (All / PL / La Liga / UCL / Bundesliga / WC) + Name search

---

### TASK 24 — Final Polish + Performance Audit
**Checklist:**
- [ ] All pages have `generateMetadata` (title, description, canonical)
- [ ] All pages have Schema.org JSON-LD (SportsEvent, SportsTeam, Person, FAQPage)
- [ ] All pages in `sitemap.ts` — verify count matches expected
- [ ] Mobile layout review on all pages
- [ ] 404 pages work for unknown league/team/player slugs
- [ ] Vercel build time under 3 minutes
- [ ] `data/today.json` freshness indicator on homepage
- [ ] No broken images (fallback for missing logos/photos)

---

## Phase 6: LLM Content Generation
*Goal: Make every page unique and valuable. Pure API data looks identical across thousands of pages — Google's Helpful Content system penalises this. AI-generated editorial text is the #1 SEO differentiator.*

---

### TASK 33 — LLM Content Generation Pipeline
**Goal:** Generate unique, readable editorial content for every team, player, match, and coach page using an LLM (Claude API). Store as JSON. Surface on pages.

**Why this matters:**
- A page about Arsenal vs Barcelona with only raw stats looks like 50 other sites
- A page with a 200-word match preview, team form analysis, and key battle narrative gets Google trust
- Google's E-E-A-T signals reward original, useful text
- This single task could 10x organic traffic

**Content types to generate:**

| Page | Content | Prompt inputs |
|---|---|---|
| Match preview | 150–200 word preview + 3 key stats to watch | Teams, form, H2H, odds, prediction, injuries |
| Match recap (finished) | 150–200 word match report | Final score, scorers, events, stats |
| Team bio | 100–150 word team description | Team name, founded, league, form, coach, style |
| Coach bio | 100 word coaching philosophy + career highlight | Coach name, career, team, formation |
| Player insight | 80–100 word player highlight | Name, position, goals, assists, nationality, age |

**Technical approach:**
- `scripts/sync/generate-ai-content.ts` — batch LLM content generator
  - Uses Anthropic API (`claude-haiku-4-5` for speed/cost, `claude-sonnet-4-6` for quality)
  - Rate limit: ~1 req/sec to stay within API limits
  - Skip if content already exists and is less than 7 days old
  - 3-retry logic for failures
- `data/ai-content/matches/{slug}.json` — `{ preview, recap, generated_at }`
- `data/ai-content/teams/{slug}.json` — `{ bio, generated_at }`
- `data/ai-content/players/{slug}.json` — `{ insight, generated_at }`
- `data/ai-content/coaches/{slug}.json` — `{ bio, generated_at }`

**New env var needed:**
- `ANTHROPIC_API_KEY` — set in `.env.local` and GitHub Secrets

**GitHub Actions:**
- Add to `weekly-league-data.yml` — regenerate content for upcoming matches each Monday
- Separate `generate-ai-content.yml` — runs weekly, only regenerates stale content

**Surfaces on pages:**
- Match preview page: "Match Preview" section shows AI text (replaces WC-only handcrafted preview)
- Finished match page: "Match Report" section
- Team page: bio paragraph under hero
- Player page: insight paragraph
- Coach section: bio paragraph on team page

**Cost estimate:**
- claude-haiku-4-5: ~$0.25 per 1M input tokens
- Average prompt: ~500 tokens, output: ~200 tokens
- 1,000 pages: ~$0.35 total — negligible

**Expected output:** Every page has 100–200 words of unique editorial. Google indexes the text, not just the data tables.

---

## Phase 7: Database + Live Scores
*Goal: Move beyond static JSON for real-time data.*

---

### TASK 34 — Supabase Schema Setup

**Tables:**
```sql
leagues (id, name, slug, country, logo, season, type, priority)
teams (id, name, slug, logo, league_id, founded, venue_id, api_football_id)
players (id, name, slug, photo, position, nationality, team_id, api_football_id)
matches (id, slug, home_id, away_id, league_id, date, status, score_home, score_away)
standings (league_id, team_id, position, points, played, won, drawn, lost, gf, ga, form)
venues (id, name, slug, city, country, capacity, image)
player_stats (player_id, season, league_id, goals, assists, minutes, appearances)
match_events (match_id, type, minute, player_id, team_id, detail)
coaches (team_id, name, photo, nationality, contract_start)
injuries (player_id, league_id, type, reason, fixture_id)
lineups (match_id, team_id, formation, players jsonb, bench jsonb)
live_events (id, match_id, minute, type, player, team_id, detail, created_at)
ai_content (entity_type, entity_slug, content_type, text, generated_at)
```

**`live_events` table is separate** — high write volume, purged after match ends and merged to `match_events`.

---

### TASK 35 — Data Migration: JSON → Supabase
- `scripts/migrate/seed-supabase.ts` — one-time runner
- `lib/supabase.ts` — typed client
- Strategy: sync scripts write to both JSON AND Supabase during transition; cut over once verified

---

### TASK 36 — ISR for League + Match Pages
- League pages: `export const revalidate = 300` (5 min)
- Live match pages: `revalidate = 30`
- Static entity pages (teams, players): remain fully static

---

### TASK 37 — Live Scores System
**Goal:** Real-time events for live matches. Fires when a match goes live, polls aggressively, archives on FT.

**Architecture:**

```
GitHub Actions cron (every 2 min during match windows)
  └── scripts/live/poll-live-matches.ts
        ├── GET /fixtures?live=all
        ├── For each live match:
        │     ├── GET /fixtures/events?fixture={id}
        │     └── Write to Supabase live_events table
        └── For each just-finished match (status changed to FT):
              ├── Copy live_events → match_events (permanent store)
              ├── Delete from live_events
              └── Trigger Vercel redeploy for that match page
```

**Polling frequency:**
- Match not started: 0 polls
- 0–89 min: every 2 minutes (30 calls/match for full 90 min)
- 90+ min (injury time): every 30 seconds
- Status = FT/AET/PEN: archive + stop

**GitHub Actions approach:**
- `live-scores.yml` — runs every 2 min (`*/2 * * * *`)
- Checks `data/today.json` for matches with status 1H/2H/HT/ET
- Only polls if at least one match is live (saves API quota)

**API calls estimate:**
- 2 live matches × 45 polls = 90 calls per match (well within Pro tier)

---

## Phase 8: Scale
---

### TASK 38 — Add More Leagues

**Priority order:**
1. Serie A (id=135, Italy)
2. Ligue 1 (id=61, France)
3. Eredivisie (id=88, Netherlands)
4. MLS (id=253, USA/Canada)
5. Copa Libertadores (id=13)
6. Domestic cups: FA Cup (id=45), Copa del Rey (id=143), DFB-Pokal (id=81)

**Per new league:**
- Add to `data/leagues.json`
- Run `bootstrap:fixtures`, `bootstrap:teams`, `bootstrap:club-players`
- Add to `LEAGUE_BROADCASTS` in match page
- Add to `generateStaticParams` (already dynamic — no code changes needed)

**Expected output:** Each new league adds ~400 match pages + ~100 team pages + ~600 player pages.

---

## Data Flow (Current)

```
API-Football v3
     │  (GitHub Actions crons)
     ▼
scripts/sync/
  ├── daily-fixtures.ts       (daily 06:00 UTC)
  ├── daily-predictions.ts    (daily 06:00 UTC — next 14 days)
  ├── daily-odds.ts           (daily 06:00 UTC — next 7 days)
  ├── pre-match-lineups.ts    (every 30 min — TASK 31)
  ├── weekly-standings.ts     (Mon 03:00 UTC)
  ├── weekly-topscorers.ts    (Mon 03:00 UTC)
  ├── weekly-squads.ts        (Mon 03:00 UTC)
  ├── weekly-team-stats.ts    (Mon 03:00 UTC)
  ├── weekly-injuries.ts      (Mon 03:00 UTC)
  ├── weekly-h2h.ts           (Mon 03:00 UTC)
  ├── weekly-coaches.ts       (Mon 03:00 UTC)
  └── generate-ai-content.ts  (weekly — TASK 33)
     │  writes JSON
     ▼
data/  (JSON cache — Phases 1–6)
     │  import at build time
     ▼
Next.js 14 App Router (SSG → ISR in Phase 7)
     │
     ▼
Vercel — footbrowse.com

Phase 7 (future):
API-Football → scripts → Supabase DB → Next.js ISR/API routes
```

---

## API Call Budget

| Sync | Frequency | Calls |
|---|---|---|
| `daily-fixtures` | Daily | 1 |
| `daily-predictions` | Daily | ~10 (upcoming fixtures) |
| `daily-odds` | Daily | ~10 |
| `pre-match-lineups` | Every 30 min | ~2–4 (when matches near) |
| `weekly-standings` | Monday | 5 |
| `weekly-topscorers` | Monday | 10 |
| `weekly-squads` | Monday | 48 |
| `weekly-team-stats` | Monday | ~150 |
| `weekly-injuries` | Monday | 5 |
| `weekly-h2h` | Monday | ~30 (new pairs only) |
| `weekly-coaches` | Monday | ~20 (stale only) |
| **Total typical week** | | **~400 calls (Pro: 7,500/day)** |

---

## Timeline

```
✅ Phase 1–3 (Apr 14): Foundation → League → Entity enrichment
✅ Phase 4 (Apr 15):   Club teams + players + unified match page + predictions + odds

🔄 Phase 5 (Apr 16–22): Match experience + homepage UX
   TASK 30 — Homepage date navigation (Sofascore-style)
   TASK 31 — Pre-match lineup widget
   TASK 32 — Finished match page enhancement
   TASK 20 — WC 2026 hub page
   TASK 23 — Top Scorers leaderboard
   TASK 23b — Players directory redesign
   TASK 24 — Final polish + SEO audit

⬜ Phase 6 (Apr 23–30): LLM content
   TASK 33 — AI-generated match previews, team/player/coach bios

⬜ Phase 7 (May+): Database + live scores
   TASK 34–37 — Supabase, ISR, live scores system

⬜ Phase 8 (May+): Scale
   TASK 38 — Serie A, Ligue 1, more leagues

World Cup 2026 starts: June 11, 2026
Hard deadline: All features live by May 25, 2026
```
