# READ THIS FILE FIRST BEFORE DOING ANYTHING
# FootBrowse — Claude Session Memory

Last updated: 2026-04-16
Current Phase: **Phase 5 — UX Overhaul**
Next task: **TASK 41 — Homepage Vertical Stacked Match Cards**

---

## Vision

1. **Homepage** → date-navigable match list, vertical stacked cards (home/away top-bottom)
2. **Match page** → sticky shrinking hero (logos + score always visible) + horizontal tab menu
3. **League/Team/Player pages** → sticky identity header + horizontal tabs
4. **5,000+ SEO pages** — each with unique AI-generated editorial text
5. **Live scores** — real-time events via Supabase during matches (WC 2026 priority)

**WC 2026 starts: June 11, 2026 | Hard deadline: May 25, 2026**

---

## API Keys

```
API_FOOTBALL_KEY=f02e9ab608ec4ab3d42b1e82af607e35   ← .env.local ✅
ANTHROPIC_API_KEY=<to add>                           ← TASK 33
NEXT_PUBLIC_SUPABASE_URL=<to add>                    ← TASK 34
SUPABASE_SERVICE_ROLE_KEY=<to add>                   ← TASK 34
```

GitHub Secrets: `API_FOOTBALL_KEY`, `VERCEL_DEPLOY_HOOK_URL`, `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
API-Football: Pro plan — 7,500 req/day

---

## Stack

Next.js 14 App Router · TypeScript · Tailwind CSS · Vercel · Git JSON (→ Supabase Phase 6)
**Local path:** `C:\Users\Dell\.antigravity\Footbrowse\`

---

## Design System (DO NOT CHANGE)

```
Brand:        #00FF87 (green)
Background:   #0a0a0a
Card bg:      rgba(255,255,255,0.03–0.05)
Card border:  rgba(255,255,255,0.07–0.10)
Text:         #FFFFFF / #A1A1AA (zinc-400) / #71717A (zinc-500)
Font:         font-black (900) heroes · -0.04em headings · -0.02em cards
```

---

## Completed Work (Phases 1–4 + partial 5)

Phases 1–4 DONE: API client · 5 leagues · 1,411 fixtures · standings · top scorers · 172 club teams · 3,269 club players · 193 coaches · injuries · unified match page (Preview + Finished, all leagues) · H2H + predictions + odds (WC + clubs) · Where to Watch · Travel & Tickets · WC API ID bootstrap (wc-fixture-ids.json + wc-team-ids.json)

Phase 5 partial: TASK 30 ✅ (homepage date navigation — DateMatchesSection, ±3/7 day window)
TASK 40 ✅ (match page sticky hero + horizontal tab navigation — MatchPageClient + 7 tab components)

---

## Full Task Plan

### Phase 5 — UX Overhaul (CURRENT)

| # | Task | Description | Priority |
|---|---|---|---|
| 40 | Match page tabs | Sticky shrinking hero + URL tab menu (?tab=) | ✅ DONE |
| 41 | Homepage cards | Vertical stacked match cards (home top / away bottom) | 🔴 NEXT |
| 42 | Entity page tabs | Sticky header + tabs on League / Team / Player pages | 🔴 HIGH |
| 31 | Lineup widget | Pre-match sync script + GitHub Action + MatchLineup component | 🟡 MED |
| 32 | Finished match | Richer timeline, stat bars, player highlights section | 🟡 MED |
| 20 | WC hub | `/world-cup` hub page (countdown, groups, fixtures, stadiums) | 🟡 MED |
| 23 | Stats page | Cross-league top scorers / assists leaderboard at `/stats` | 🟢 LOW |
| 23b | Players dir | `/players` with league filter + name search | 🟢 LOW |
| 43 | Site search | Instant JSON-indexed search for teams / players / matches | 🟢 LOW |

### Phase 6 — Supabase (moved up — before LLM + scripts)

| # | Task | Description |
|---|---|---|
| 34 | Supabase schema | Full DB design + setup via Supabase MCP |
| 35 | Data migration | Seed scripts: JSON → Supabase (leagues, teams, players, fixtures, stats) |

### Phase 7 — Scripts Audit + Full Automation

| # | Task | Description |
|---|---|---|
| 50 | Scripts audit | Remove redundancy, rewrite scripts to write to Supabase |
| 51 | Pre-match action | `.github/workflows/pre-match.yml` — 30-min cron for lineups |
| 52 | Post-match action | `.github/workflows/post-match.yml` — hourly catch for FT events |

### Phase 8 — LLM Content

| # | Task | Description |
|---|---|---|
| 33 | LLM pipeline | Claude API — match previews, team bios, player insights, coach bios → Supabase ai_content |

### Phase 9 — SEO Audit

| # | Task | Description |
|---|---|---|
| 24 | SEO audit | Metadata, Schema.org, sitemap, og:image, 404s, Core Web Vitals, PWA manifest, Vercel Analytics |

### Phase 10 — ISR + Live Scores

| # | Task | Description |
|---|---|---|
| 36 | ISR | Revalidate strategy per page type (match/league/player) |
| 37 | Live scores | Poll during matches → Supabase live_events → Realtime on client |

### Phase 11 — Scale

| # | Task | Description |
|---|---|---|
| 38 | More leagues | Serie A, Ligue 1, Eredivisie, MLS, Copa Libertadores |

---

## Key Decisions

1. **Tab state in URL** — `?tab=events` (SEO crawlable, shareable)
2. **Shrinking sticky hero** — compresses on scroll, score always visible
3. **JSON → Supabase Phase 6** — Supabase comes BEFORE LLM and scripts audit
4. **LLM writes to Supabase** — `ai_content` table, never to JSON files
5. **Scripts audit WITH Supabase target** — no double migration
6. **Live scores = Supabase Realtime** — Phase 10 only
7. **Single API source** — API-Football v3 only. `data/matches.json` + `data/teams.json` are handcrafted ground truth until WC starts.

---

## Critical Files

```
/MIGRATION_PLAN.md                                  ← full spec for every task
/CLAUDE_CONTEXT.md                                  ← this file
/app/page.tsx                                       ← homepage
/app/layout.tsx
/app/leagues/[slug]/matches/[match-slug]/page.tsx   ← unified match page
/app/leagues/[slug]/page.tsx                        ← league page
/app/leagues/[slug]/teams/[teamSlug]/page.tsx       ← team page
/app/players/[slug]/page.tsx                        ← player page
/components/DateMatchesSection.tsx                  ← homepage date nav
/lib/date-fixtures.ts                               ← multi-day fixture loader
/lib/wc-ids.ts                                      ← WC slug → API ID lookups
/lib/predictions.ts · /lib/odds.ts · /lib/h2h.ts · /lib/injuries.ts
/scripts/sync/                                      ← all sync scripts
/data/                                              ← JSON source of truth (until Phase 6)
```
