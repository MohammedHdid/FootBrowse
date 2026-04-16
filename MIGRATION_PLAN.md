# FootBrowse — Full Product & Migration Plan
### Last updated: 2026-04-16 | Current: Phase 5 — UX Overhaul

---

## READ BEFORE EXECUTING ANY TASK

- Read `CLAUDE_CONTEXT.md` first — task status, design system, key decisions
- Never touch `/data/` or `/lib/` unless the task explicitly says to
- Each TASK is a self-contained session — mark complete in `CLAUDE_CONTEXT.md` when done
- Phase order matters: UX → Supabase → Scripts → LLM → SEO → Live Scores

---

## Architecture

```
API-Football v3
    │  GitHub Actions (scheduled + event-based)
    ▼
scripts/sync/          → data/ JSON  (Phases 1–5)
                       → Supabase    (Phase 6+)
    ▼
Next.js 14 App Router  SSG → ISR (Phase 10)
    ▼
Vercel CDN
```

**Priority leagues:** World Cup 2026 (id=1), UCL (id=2), Premier League (id=39), La Liga (id=140), Bundesliga (id=78)

---

## ✅ Phases 1–4 Complete

API client · 5 leagues · 1,411 fixtures · standings · top scorers · unified match page (Preview + Finished, ALL leagues) · 172 club teams · 3,269 club players · 193 coaches · injuries · H2H + predictions + odds (WC + clubs unified) · Where to Watch · Travel & Tickets · WC bootstrap (wc-fixture-ids.json + wc-team-ids.json)

## ✅ Phase 5 partial

TASK 30: Homepage date navigation — `DateMatchesSection` client component, ±3/7 day window from fixture files, replaces `today.json` dependency.

---

## Phase 5 — UX Overhaul
*Mobile-first. Match Forza Football / Sofascore patterns. No new data dependencies.*

---

### TASK 40 — Match Page: Sticky Hero + Horizontal Tab Navigation

**The single biggest UX upgrade. Every match page benefits immediately.**

**Pattern (from Forza Football / Sofascore):**
```
┌──────────────────────────────────────────┐  ← sticky, compresses on scroll
│  🏆 Premier League · Matchday 34         │
│  🔴 Arsenal   2 ─── 1   Chelsea 🔵       │  ← always visible when compressed
│  FT · Emirates Stadium · Apr 16          │
├──────────────────────────────────────────┤  ← sticky tab bar
│  Overview │ Events │ Stats │ Lineups │ H2H │ Odds │ Squad  │
└──────────────────────────────────────────┘
│  [scrollable tab content]                │
```

**URL tab routing:**
- `?tab=overview` (default), `?tab=events`, `?tab=stats`, `?tab=lineups`, `?tab=h2h`, `?tab=odds`, `?tab=squad`
- Use `useSearchParams()` in a `"use client"` wrapper inside `<Suspense>`
- `<link rel="canonical">` always points to base URL without `?tab=`
- Each tab URL is indexable — Google sees unique content per tab

**Shrinking header behaviour:**
- Full state (top of page): large logos ~72px, full team names, score, date/venue/time below
- Compressed state (scrolled > 80px): logos shrink to 32px, one-line layout, score only
- CSS `transition` on height + opacity — no JS reflow, no layout shift
- Tab bar detaches from hero and becomes `position: sticky; top: 0` once compressed

**Tab definitions:**

*Preview mode (status = NS):*
| Tab | Content |
|---|---|
| Overview | Form pills + team comparison + venue card + broadcaster list |
| Lineups | Starting XI + formation (from TASK 31) or "Not yet announced" |
| H2H | Head-to-head history + recent meetings |
| Odds | Bet365 widget with affiliate links |
| Squad | Squad comparison (existing MatchSquads component) |

*Finished / Live mode (status = FT / 1H / 2H / HT):*
| Tab | Content |
|---|---|
| Overview | Goal scorers + key events summary + player highlights |
| Events | Full match timeline (TASK 32) |
| Statistics | Stat bars — shots, possession, corners, cards, xG (TASK 32) |
| Lineups | Confirmed starting XI |
| Squad | Squad comparison |

**Component architecture:**
```
app/leagues/[slug]/matches/[match-slug]/
  page.tsx                    ← server component: data loading + metadata only
  MatchPageClient.tsx         ← "use client": receives all data as props, owns tab state
  components/
    MatchHero.tsx             ← sticky shrinking hero (useScrollY hook)
    MatchTabBar.tsx           ← horizontal scrollable tab strip
    tabs/
      OverviewTab.tsx
      EventsTab.tsx
      StatsTab.tsx
      LineupsTab.tsx
      H2HTab.tsx
      OddsTab.tsx
      SquadTab.tsx
```

**Strategy:** `page.tsx` stays a pure server component — loads all data, passes everything as serialisable props to `<MatchPageClient>`. No data fetching in client components. Tab switch = zero network requests.

**Migration:** Move existing section JSX from `page.tsx` into the appropriate tab components. No logic changes — same `lib/*` readers, same props.

---

### TASK 41 — Homepage: Vertical Stacked Match Cards

**Current (side-by-side, desktop pattern):**
```
[19:45]  [Arsenal logo + name ——————] [VS] [—————— Chelsea logo + name]
```

**New (vertical stacked, mobile-first — industry standard):**
```
┌────────────────────────────────────────────┐
│  19:45          Premier League             │
│  🔴  Arsenal                         2     │
│  🔵  Chelsea                         1     │
│  FT                                        │
└────────────────────────────────────────────┘
```

Details:
- Left column (w-12): kickoff time when NS · live minute when 1H/2H · "HT" · "FT"
- Center: crest (24×24) + full team name — two rows
- Right: one score number per row (or "—" if NS)
- Live matches: green left border pulse
- Status badge replaces time when live: pulsing "LIVE" or "HT"
- Compact padding: `py-2.5 px-4` per card

**Files:** `components/DateMatchesSection.tsx` — redesign fixture row JSX only.

---

### TASK 42 — Entity Pages: Sticky Header + Horizontal Tabs

**Same shrinking header + tab pattern as TASK 40, applied to League / Team / Player pages.**

**League page (`/leagues/[slug]`):**
```
Header: league logo + name + season badge
Tabs:   Overview | Fixtures | Standings | Teams | Top Scorers
```
- Overview: next 5 fixtures + current top 5 standings + top scorer
- Other tabs: existing page sections moved into tab components

**Team page (`/leagues/[slug]/teams/[teamSlug]`):**
```
Header: club crest (or flag) + team name + league badge
Tabs:   Overview | Squad | Fixtures | Stats
```
- Overview: form + coach + venue + injury summary

**Player page (`/players/[slug]`):**
```
Header: player photo (or initial avatar) + name + position + club crest
Tabs:   Overview | Stats | Matches
```
- Overview: bio (LLM text when available) + key season stats
- Stats: career stats table
- Matches: recent appearances

**Shared pattern across all entity pages:**
- `useSearchParams` + `?tab=` URL routing
- `<Suspense>` wrapper around tab content area
- `position: sticky; top: 0` tab bar after hero compresses

**Files:** `app/leagues/[slug]/page.tsx`, `app/leagues/[slug]/teams/[teamSlug]/page.tsx`, `app/players/[slug]/page.tsx`

---

### TASK 31 — Pre-Match Lineup Widget

**Sync script:** `scripts/sync/pre-match-lineups.ts`
- Runs every 30 min via GitHub Actions
- Finds fixtures with kickoff within next 4 hours
- Calls `GET /fixtures/lineups?fixture={id}`
- Saves to `data/lineups/{fixture_id}.json`
- Skips if lineup already has 11 confirmed starters
- WC fixtures: uses `wc-fixture-ids.json`

**Data format:**
```json
{
  "fixture_id": 12345,
  "fetched_at": "2026-04-16T17:30:00Z",
  "home": {
    "team_id": 33, "team_name": "Arsenal", "formation": "4-3-3",
    "start_xi": [{ "player_id": 1, "name": "Raya", "number": 22, "pos": "G", "grid": "1:1" }],
    "bench": [{ "player_id": 2, "name": "Turner", "number": 30, "pos": "G" }],
    "coach": { "id": 100, "name": "Mikel Arteta" }
  },
  "away": { "..." }
}
```

**Component:** `components/MatchLineup.tsx`
- Two-column: home left, away right
- Formation label centred between columns
- Player rows: shirt number + name + position badge
- Bench section collapsed by default (show/hide)
- Fallback: "Lineup not yet announced" card with expected kickoff time

**GitHub Action:** `.github/workflows/pre-match.yml` — `*/30 * * * *`

**`lib/lineups.ts`:** `getLineup(fixtureId: number): LineupFile | null`

**package.json:** add `"sync:lineups": "tsx scripts/sync/pre-match-lineups.ts"`

---

### TASK 32 — Finished Match Page Enhancement

**Goal:** Make the finished match experience visually rich. No new data — everything comes from existing `data/match-events/*.json`.

**1. Events timeline (EventsTab):**
- Visual timeline bar at the top: 90-min progress bar with event markers (⚽🟨🟥🔄) at correct minute positions
- Events grouped by half: "1st Half" / "2nd Half" / "Extra Time" headers
- Each event row: left team-color stripe + minute pill + icon + player name
- Substitutions: one row, "↑ Player In · ↓ Player Out · 72'"

**2. Statistics (StatsTab):**
- ALL stat rows have percentage bar (currently only possession does)
- Home = #00FF87 bar, Away = #3B82F6 bar
- Show xG, pass accuracy, offsides, saves if present in API response
- Possession shown as large split bar at top (stays as-is)

**3. Player highlights (OverviewTab — new section):**
- "Match Highlights" card: goal scorers with minute + assist name
- Cards summary: yellow/red with player name + minute
- Key substitutions: sub + minute + team
- Zero extra API calls — all derived from existing events array

---

### TASK 20 — WC 2026 Hub (`/world-cup`)

**Standalone page at `/world-cup` — not under `/leagues/`.**

**Sections:**
1. Hero: countdown to June 11 2026 (client component, live countdown) + "48 Teams · 104 Matches · USA, Canada & Mexico"
2. Group stage grid: all 12 groups × 4 teams with flags, links to `/leagues/world-cup/teams/[slug]`
3. Next 7 upcoming WC fixtures
4. All 48 teams grid: flag + name + FIFA rank
5. All 19 stadiums: city + capacity + photo
6. Quick nav: → All WC fixtures | → WC standings | → WC squads

**Zero API calls** — all from `data/matches.json`, `data/teams.json`, `data/stadiums.json`

**Files:** `app/world-cup/page.tsx`

---

### TASK 23 — Top Scorers Leaderboard (`/stats`)

**Cross-league stats at `/stats`.**

**Tabs:** Top Scorers | Top Assists | Most Cards
**Filter:** All Leagues | Premier League | La Liga | UCL | Bundesliga

**Data:** `data/topscorers/*.json` — zero API calls.

Ranked list: position number + player photo + name + club crest + goals/assists + minutes played

**Files:** `app/stats/page.tsx`

---

### TASK 23b — Players Directory Redesign (`/players`)

**Current state:** WC squads only.

**New state:** All leagues searchable.

**Filters (client-side, no API):**
- League dropdown: All | Premier League | La Liga | UCL | Bundesliga | World Cup
- Name search: instant filter as you type

**Data:** `data/club-players.json` + `data/players.json` — zero API calls.

**Files:** `app/players/page.tsx`

---

### TASK 43 — Site-Wide Search (`/search`)

**Goal:** Instant search across all teams, players, and matches.

**Implementation:**
- At build time, generate `public/search-index.json` — flat array of all searchable entities
- Client-side fuzzy filter with `?q=` URL param (shareable, back-button works)
- Result categories: Teams · Players · Matches
- Each result: entity name + league/team + link

**Search index entry:**
```json
{ "type": "team",   "name": "Arsenal", "slug": "arsenal", "league": "premier-league", "logo": "..." }
{ "type": "player", "name": "Bukayo Saka", "slug": "bukayo-saka-1234", "team": "Arsenal", "photo": "..." }
{ "type": "match",  "name": "Arsenal vs Chelsea", "slug": "arsenal-vs-chelsea-2026-04-16", "league": "premier-league", "date": "..." }
```

Index size: ~5,000 entries at ~500 bytes each = ~2.5MB — acceptable for a one-time load.

**Search input in navbar** (always visible) — links to `/search?q=`

**Files:** `app/search/page.tsx`, `scripts/build/generate-search-index.ts` (run at build time via `next.config.js` or `prebuild` script), update `app/layout.tsx` for search input in nav.

---

## Phase 6 — Supabase Setup
*Moved before Scripts Audit and LLM so that both can target Supabase from day one — no double migration.*

---

### TASK 34 — Supabase Database Schema

**Use Supabase MCP** (`@supabase/mcp-server-supabase`) for all schema operations.

**New env vars needed:**
```
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

#### Permanent tables (core data — always populated)

```sql
leagues (
  id uuid PK DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  country text,
  logo text,
  api_id integer,           -- API-Football league ID
  season integer,
  type text,                -- 'League' | 'Cup' | 'Tournament'
  priority integer DEFAULT 99,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

venues (
  id uuid PK DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text,
  city text,
  state text,
  country text,
  capacity integer,
  photo text,
  api_football_id integer,
  created_at timestamptz DEFAULT now()
)

teams (
  id uuid PK DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  logo text,
  country text,
  api_football_id integer,
  league_id uuid REFERENCES leagues(id),
  venue_id uuid REFERENCES venues(id),
  founded integer,
  color_primary text,       -- WC teams
  fifa_rank integer,        -- WC teams
  wc_titles integer,        -- WC teams
  wc_group text,            -- WC teams
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  synced_at timestamptz
)

players (
  id uuid PK DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  photo text,
  position text,
  nationality text,
  date_of_birth date,
  shirt_number integer,
  api_football_id integer,
  team_id uuid REFERENCES teams(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  synced_at timestamptz
)

coaches (
  id uuid PK DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) UNIQUE,
  name text,
  photo text,
  nationality text,
  api_football_id integer,
  career jsonb,             -- [{ team, start, end }]
  created_at timestamptz DEFAULT now(),
  synced_at timestamptz
)

matches (
  id uuid PK DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  league_id uuid REFERENCES leagues(id),
  home_id uuid REFERENCES teams(id),
  away_id uuid REFERENCES teams(id),
  venue_id uuid REFERENCES venues(id),
  date date NOT NULL,
  kickoff_utc text,
  status text DEFAULT 'NS', -- NS | 1H | HT | 2H | ET | PEN | FT | AET | PEN
  score_home integer,
  score_away integer,
  stage text,
  matchday integer,
  group_name text,
  api_football_id integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  synced_at timestamptz
)

standings (
  id uuid PK DEFAULT gen_random_uuid(),
  league_id uuid REFERENCES leagues(id),
  team_id uuid REFERENCES teams(id),
  season integer NOT NULL,
  position integer,
  points integer,
  played integer, won integer, drawn integer, lost integer,
  goals_for integer, goals_against integer, goal_diff integer,
  form text,
  created_at timestamptz DEFAULT now(),
  synced_at timestamptz,
  UNIQUE(league_id, team_id, season)
)

player_stats (
  id uuid PK DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES players(id),
  league_id uuid REFERENCES leagues(id),
  season integer NOT NULL,
  appearances integer, minutes integer,
  goals integer, assists integer,
  yellow_cards integer, red_cards integer,
  rating numeric(4,2),
  shots_on integer, key_passes integer,
  created_at timestamptz DEFAULT now(),
  synced_at timestamptz,
  UNIQUE(player_id, league_id, season)
)

team_stats (
  id uuid PK DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id),
  league_id uuid REFERENCES leagues(id),
  season integer NOT NULL,
  played integer, wins integer, draws integer, losses integer,
  goals_for integer, goals_against integer, clean_sheets integer,
  form text,
  created_at timestamptz DEFAULT now(),
  synced_at timestamptz,
  UNIQUE(team_id, league_id, season)
)

match_events (
  id uuid PK DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id),
  type text,                -- 'Goal' | 'Card' | 'subst' | 'Var'
  detail text,
  minute integer,
  extra_minute integer,
  player_name text,
  player_id uuid REFERENCES players(id),
  assist_name text,
  assist_id uuid REFERENCES players(id),
  team_id uuid REFERENCES teams(id),
  created_at timestamptz DEFAULT now()
)

match_stats (
  id uuid PK DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id),
  team_id uuid REFERENCES teams(id),
  possession integer,
  shots_on integer, shots_total integer,
  corners integer, fouls integer,
  yellow_cards integer, red_cards integer,
  xg numeric(4,2),
  pass_accuracy integer,
  offsides integer, saves integer,
  created_at timestamptz DEFAULT now(),
  synced_at timestamptz,
  UNIQUE(match_id, team_id)
)

lineups (
  id uuid PK DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id),
  team_id uuid REFERENCES teams(id),
  formation text,
  start_xi jsonb,           -- [{ player_id, name, number, pos, grid }]
  bench jsonb,
  coach_name text,
  created_at timestamptz DEFAULT now(),
  synced_at timestamptz,
  UNIQUE(match_id, team_id)
)

h2h (
  id uuid PK DEFAULT gen_random_uuid(),
  team1_id uuid REFERENCES teams(id),  -- always min(api_id)
  team2_id uuid REFERENCES teams(id),  -- always max(api_id)
  played integer,
  team1_wins integer, team2_wins integer, draws integer,
  last_matches jsonb,
  created_at timestamptz DEFAULT now(),
  synced_at timestamptz,
  UNIQUE(team1_id, team2_id)
)

injuries (
  id uuid PK DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES players(id),
  team_id uuid REFERENCES teams(id),
  league_id uuid REFERENCES leagues(id),
  type text,
  reason text,
  match_id uuid REFERENCES matches(id),
  created_at timestamptz DEFAULT now(),
  synced_at timestamptz
)

-- Time-limited: stale after 48h (checked by sync script via valid_until)
predictions (
  id uuid PK DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) UNIQUE,
  advice text,
  winner_api_id integer, winner_name text, winner_comment text,
  percent_home text, percent_draw text, percent_away text,
  under_over text, goals_home text, goals_away text,
  comparison jsonb,
  created_at timestamptz DEFAULT now(),
  synced_at timestamptz,
  valid_until timestamptz  -- synced_at + 48h
)

-- Time-limited: stale after 24h
odds (
  id uuid PK DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) UNIQUE,
  bookmaker_id integer, bookmaker_name text,
  home_win numeric(6,2), draw numeric(6,2), away_win numeric(6,2),
  created_at timestamptz DEFAULT now(),
  synced_at timestamptz,
  valid_until timestamptz  -- synced_at + 24h
)

-- LLM-generated content — written by TASK 33, read by all pages
ai_content (
  id uuid PK DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,    -- 'match' | 'team' | 'player' | 'coach'
  entity_slug text NOT NULL,
  content_type text NOT NULL,   -- 'preview' | 'recap' | 'bio' | 'insight'
  text text NOT NULL,
  model text,                   -- 'claude-haiku-4-5' | 'claude-sonnet-4-6'
  generated_at timestamptz DEFAULT now(),
  valid_until timestamptz,      -- matches: 7d | teams/players: 30d
  UNIQUE(entity_type, entity_slug, content_type)
)
```

---

#### Ephemeral table — live matches only

```sql
-- Written every 2 min during live matches. Cleared to match_events after FT.
live_events (
  id uuid PK DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id),
  type text,
  detail text,
  minute integer,
  extra_minute integer,
  player_name text,
  team_id uuid REFERENCES teams(id),
  created_at timestamptz DEFAULT now()
)
-- Enable Supabase Realtime on this table only
-- RLS: service_role write, anon read
```

---

#### Staleness rules (used by all sync scripts in Phase 7)

| Table | Stale after | Skip condition |
|---|---|---|
| matches (status) | 1 hour | status is FT/AET/PEN |
| standings | 7 days | — |
| player_stats / team_stats | 7 days | — |
| injuries | 7 days | — |
| h2h | 30 days | — |
| coaches | 30 days | — |
| predictions | 48 hours | `valid_until < now()` |
| odds | 24 hours | `valid_until < now()` |
| lineups | — | start_xi has 11 players |
| match_events | never | exists and match is FT |
| ai_content (matches) | 7 days | `valid_until > now()` |
| ai_content (teams/players) | 30 days | `valid_until > now()` |

---

### TASK 35 — Data Migration: JSON → Supabase

**Seed scripts (run in this order — respects FK constraints):**
```
scripts/migrate/01-seed-leagues.ts
scripts/migrate/02-seed-venues.ts
scripts/migrate/03-seed-teams.ts
scripts/migrate/04-seed-fixtures.ts
scripts/migrate/05-seed-players.ts
scripts/migrate/06-seed-stats.ts
scripts/migrate/07-seed-events.ts
scripts/migrate/08-seed-predictions-odds.ts
```

**`lib/supabase.ts`:**
```typescript
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

**Transition strategy (3 phases):**
- A: Seed scripts write to BOTH JSON + Supabase — verify parity
- B: Pages read from Supabase with JSON fallback if null
- C: Remove JSON reads entirely — JSON files become backup only

---

## Phase 7 — Scripts Audit + Full Automation
*Rewrite sync scripts to write to Supabase. Define complete automated schedule.*

---

### TASK 50 — Sync Scripts Full Audit

**Current inventory:**

| Script | Purpose | Schedule | Action |
|---|---|---|---|
| `daily-fixtures.ts` | Today's fixtures + status updates | Daily 06:00 | ✅ Keep — add Supabase write |
| `daily-predictions.ts` | Predictions for next 14d | Daily 06:00 | ✅ Keep — add Supabase write |
| `daily-odds.ts` | Bet365 odds next 7d | Daily 06:00 | ✅ Keep — add Supabase write |
| `weekly-standings.ts` | League tables | Mon 03:00 | ✅ Keep — add Supabase write |
| `weekly-topscorers.ts` | Top scorers/assists | Mon 03:00 | ✅ Keep — add Supabase write |
| `weekly-team-stats.ts` | Team stats per league | Mon 03:00 | ✅ Keep — add Supabase write |
| `weekly-player-stats.ts` | Player career stats | Mon 03:00 | ✅ Keep — add Supabase write |
| `weekly-squads.ts` | Club squad rosters | Mon 03:00 | ✅ Keep — add Supabase write |
| `weekly-injuries.ts` | Injuries/suspensions | Mon 03:00 | ✅ Keep — add Supabase write |
| `weekly-h2h.ts` | H2H for upcoming pairings | Mon 03:00 | ✅ Keep — add Supabase write |
| `weekly-coaches.ts` | Coach data per team | Mon 03:00 | ✅ Keep — add Supabase write |
| `match-events-batch.ts` | Events for finished matches | Daily 06:00 | ⚠️ Change to hourly — currently misses same-day finishes |
| `pre-match-lineups.ts` | Lineups ~90 min before kickoff | Every 30 min | ⬜ TASK 31 |
| `generate-ai-content.ts` | LLM content batch | Weekly | ⬜ TASK 33 |
| `sync-players.ts` | WC players (old) | Manual | ❌ DELETE — superseded by weekly-squads.ts |
| `sync-sportsdb.ts` | TheSportsDB enrichment (old) | Manual | ❌ DELETE — API-Football is sole source |
| `bootstrap-*.ts` | One-time setup | Once done | ✅ Keep as bootstrap scripts, don't run again |

**Staleness check pattern (add to every script in Phase 7):**
```typescript
// Before any API call, check if data is still fresh in Supabase
const { data } = await supabase
  .from('standings')
  .select('synced_at')
  .eq('league_id', leagueId)
  .single()

if (data && Date.now() - new Date(data.synced_at).getTime() < STALE_MS) {
  console.log('  ↩ Fresh — skipping API call')
  continue
}
```

---

### TASK 51 — Pre-Match GitHub Action

**File:** `.github/workflows/pre-match.yml`
```yaml
name: Pre-Match Lineups
on:
  schedule:
    - cron: '*/30 * * * *'
jobs:
  lineups:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run sync:lineups
        env:
          API_FOOTBALL_KEY: ${{ secrets.API_FOOTBALL_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      - name: Commit JSON if changed
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/lineups/
          git diff --staged --quiet || (git commit -m "chore: sync lineups" && git push)
```

---

### TASK 52 — Post-Match GitHub Action

**File:** `.github/workflows/post-match.yml`
- Runs every hour (`0 * * * *`)
- Finds fixtures with FT status in the last 2 hours that have no events file
- Calls match-events-batch.ts for those fixtures
- Triggers AI content generation for match recap (calls generate-ai-content.ts --type=match --slug=...)

---

### Full Automation Schedule

```
Every 30 min:  pre-match-lineups.ts     (skips if no match within 4h)
Every 1 hour:  match-events-batch.ts    (only recently finished matches)
               post-match AI recap      (triggers generate-ai-content for FT matches)
Daily 06:00:   daily-fixtures.ts
               daily-predictions.ts
               daily-odds.ts
Weekly Mon:    weekly-standings.ts
               weekly-topscorers.ts
               weekly-team-stats.ts
               weekly-player-stats.ts
               weekly-squads.ts
               weekly-injuries.ts
               weekly-h2h.ts
               weekly-coaches.ts
Weekly Sun:    generate-ai-content.ts   (batch regen of stale content)
```

**API quota budget (Pro: 7,500 req/day):**

| Scripts | Daily calls |
|---|---|
| Daily scripts | ~70 |
| Pre-match lineups (48 runs × ~2) | ~96 |
| Post-match events (24 runs × ~5) | ~120 |
| Weekly average per day | ~29 |
| **Total** | **~315/day** |

7,185 req/day headroom for Phase 10 live scores.

---

## Phase 8 — LLM Content
*Unique editorial text per page. The #1 SEO differentiator vs pure-API clones.*

---

### TASK 33 — LLM Content Generation Pipeline

**Model selection:**
- `claude-haiku-4-5` — team bios, coach bios, player insights (fast, low cost)
- `claude-sonnet-4-6` — match previews, match recaps (quality matters for high-traffic pages)

**Content types:**

| Entity | Type | Words | Inputs | Model |
|---|---|---|---|---|
| Upcoming match | preview | 150–200 | teams, form, H2H, odds, injuries | Sonnet |
| Finished match | recap | 150–200 | score, scorers, events, stats | Sonnet |
| Team | bio | 100–150 | name, league, founded, coach, form | Haiku |
| Coach | bio | 80–100 | name, career highlights, current club | Haiku |
| Player | insight | 80–100 | position, season stats, nationality, age | Haiku |

**Script:** `scripts/sync/generate-ai-content.ts`
```bash
npm run gen:ai -- --type=matches      # upcoming match previews
npm run gen:ai -- --type=recaps       # finished match recaps
npm run gen:ai -- --type=teams        # team bios
npm run gen:ai -- --type=players      # player insights
npm run gen:ai -- --type=coaches      # coach bios
npm run gen:ai -- --force             # regenerate all (ignore valid_until)
```

**Storage:** Writes to Supabase `ai_content` table (not JSON files).

**Reads on pages (all tabs already defined in TASK 40–42):**
- Match Overview tab: "Match Preview" / "Match Report" block (Sonnet output)
- Team Overview tab: bio paragraph below hero stats
- Player Overview tab: insight paragraph
- Coach widget on team page: bio

**GitHub Actions:**
- `generate-ai-content.yml` — weekly Sunday 02:00 UTC (full batch, skip if valid_until > now)
- Called from `post-match.yml` for individual match recaps

**Rate limiting:** 1 req/sec. Script is resumable — writes each item before moving to next.

**Cost:** `claude-haiku-4-5` at $0.80/M input tokens — ~$0.50 for 5,000 pages. Negligible.

**New env var:** `ANTHROPIC_API_KEY` → `.env.local` + GitHub Secrets

---

## Phase 9 — SEO Audit
*Maximize Google indexing for all 5,000+ pages.*

---

### TASK 24 — Full SEO Audit

**Metadata (every page):**
- [ ] `generateMetadata()` with unique `title`, `description`, `alternates.canonical`
- [ ] Title format: `{Home} vs {Away} — {League} {Date} | FootBrowse`
- [ ] Description: 130–155 chars, unique, includes key entity names
- [ ] `og:title`, `og:description`, `og:image`, `og:type`

**og:image (social cards):**
- [ ] Dynamic via `app/opengraph-image.tsx` using Next.js `ImageResponse`
- Match pages: team logos + VS/score + league badge
- Team pages: club crest + team name + league
- Player pages: player photo + name + stat

**Schema.org JSON-LD:**
- [ ] Homepage: `WebSite` + `Organization` + `SearchAction`
- [ ] Match pages: `SportsEvent` (already partial — audit completeness)
- [ ] Team pages: `SportsTeam`
- [ ] Player pages: `Person`
- [ ] League pages: `SportsOrganization`
- [ ] All pages: `BreadcrumbList`
- [ ] Match pages: `FAQPage` (already partial)

**Sitemap (`app/sitemap.ts`):**
- [ ] All league pages
- [ ] All match pages (1,411 club + 104 WC + more leagues)
- [ ] All team pages (172 club + 48 WC)
- [ ] All player pages (3,269 club + 1,637 WC)
- [ ] All stadium pages
- [ ] `/stats`, `/world-cup`, `/players`, `/search`
- [ ] `changefreq`: upcoming matches = `daily`, finished = `weekly`, teams = `weekly`
- [ ] `priority`: match pages = 0.8, team/player = 0.6, league = 0.9

**Technical SEO:**
- [ ] `robots.txt` — allow all, block `/api/`
- [ ] All `next/image` have `width` + `height` (prevent CLS)
- [ ] Priority images use `priority` prop (prevent LCP issues)
- [ ] No layout shift on tab switch (`min-height` on tab content area)
- [ ] Breadcrumb on every page (already partial — audit missing ones)

**Error pages:**
- [ ] `app/not-found.tsx` — custom 404 with navigation
- [ ] `app/error.tsx` — custom error boundary
- [ ] `app/leagues/[slug]/not-found.tsx` — unknown league slug
- [ ] `app/players/[slug]/not-found.tsx` — unknown player slug

**Analytics + monitoring:**
- [ ] Add `@vercel/analytics` — one-line in `app/layout.tsx`
- [ ] Add `@vercel/speed-insights` — Core Web Vitals in Vercel dashboard

**PWA manifest:**
- [ ] `app/manifest.ts` — name, icons, theme_color `#0a0a0a`, background `#0a0a0a`
- [ ] Makes site installable on Android/iOS home screen
- [ ] Good mobile-first signal for Google ranking

---

## Phase 10 — ISR + Live Scores

---

### TASK 36 — ISR Configuration

```typescript
// Upcoming/live match pages
export const revalidate = 60          // 1 minute

// Finished match pages
export const revalidate = 86400       // 24 hours (data never changes)

// League pages (standings, fixtures)
export const revalidate = 300         // 5 minutes

// Team + player pages
export const revalidate = 86400       // 24 hours

// Homepage
export const revalidate = 60          // 1 minute (match statuses change)
```

---

### TASK 37 — Live Scores System

**Architecture:**
```
GitHub Actions (*/2 * * * *)
  └── scripts/live/poll-live-matches.ts
        ├── GET /fixtures?live=all        (1 call to check if anything live)
        ├── If nothing live: exit
        ├── For each live fixture:
        │     ├── GET /fixtures/events?fixture={id}
        │     └── Upsert → Supabase live_events
        └── For each match that just reached FT:
              ├── Copy live_events → match_events (permanent)
              ├── Delete live_events for that match_id
              ├── Trigger Vercel revalidation webhook for match page
              └── Trigger generate-ai-content.ts for match recap
```

**Polling schedule:**
- Minutes 1–89: every 2 minutes (`*/2 * * * *`)
- Minutes 90+: every 1 minute (`* * * * *`) — separate action triggered when status = 2H and minute > 89

**Client (Supabase Realtime):**
```typescript
// In MatchPageClient.tsx when match is live:
const channel = supabase
  .channel(`match-${matchId}`)
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public', table: 'live_events',
    filter: `match_id=eq.${matchId}`
  }, (payload) => updateEvents(payload.new))
  .subscribe()
```

**API quota for live matches:**
- 1 live status check + 2 event calls per match × 45 polls = ~135 calls per 90-min match
- 5 simultaneous live matches = ~675 calls per match window
- Well within 7,500/day Pro limit

---

## Phase 11 — Scale

---

### TASK 38 — Add More Leagues

**Priority order:**
1. Serie A (id=135, Italy) — ~380 matches, ~20 teams
2. Ligue 1 (id=61, France) — ~380 matches, ~20 teams
3. Eredivisie (id=88, Netherlands) — ~306 matches, ~18 teams
4. MLS (id=253, USA/Canada) — ~450 matches, ~30 teams
5. Copa Libertadores (id=13) — ~125 matches

**Per new league (no code changes — routes already dynamic):**
```bash
# 1. Add entry to data/leagues.json
# 2. Run bootstrap scripts:
npm run bootstrap:fixtures    # all season fixtures
npm run bootstrap:teams       # team metadata
npm run bootstrap:club-players # squad rosters
# 3. Add to LEAGUE_BROADCASTS in match page
# 4. Add to generate-ai-content queue
```

Each new league adds ~400 match pages + ~20 team pages + ~600 player pages.

---

## Summary: Full Task List

| Phase | Task | Description | Dependencies |
|---|---|---|---|
| 5 | 40 | Match page tabs | none |
| 5 | 41 | Homepage vertical cards | none |
| 5 | 42 | Entity page tabs | none |
| 5 | 31 | Lineup widget + sync | none |
| 5 | 32 | Finished match enhancement | none |
| 5 | 20 | WC hub page | none |
| 5 | 23 | Stats leaderboard | none |
| 5 | 23b | Players directory | none |
| 5 | 43 | Site-wide search | none |
| 6 | 34 | Supabase schema | none |
| 6 | 35 | Data migration | TASK 34 |
| 7 | 50 | Scripts audit | TASK 35 |
| 7 | 51 | Pre-match action | TASK 31 |
| 7 | 52 | Post-match action | TASK 50 |
| 8 | 33 | LLM content pipeline | TASK 35 (Supabase) |
| 9 | 24 | SEO audit | TASK 33 (LLM text) |
| 10 | 36 | ISR | TASK 35 |
| 10 | 37 | Live scores | TASK 36 |
| 11 | 38 | More leagues | TASK 37 |
