/**
 * scripts/sync/weekly-fixtures.ts
 *
 * Fetches all fixtures for each priority league and writes per-league JSON files.
 * Run weekly (or manually) — costs ~5 API calls.
 *
 * Usage:
 *   npx tsx scripts/sync/weekly-fixtures.ts
 *
 * Output:
 *   data/fixtures/{league-slug}-{season}.json  (one file per league)
 */

import fs from 'node:fs'
import path from 'node:path'
import { createApiClient } from '../utils/api-client.js'
import { generateSlug } from '../utils/slug-generator.js'
import type { League } from '../sync/bootstrap-leagues.js'

// ---------------------------------------------------------------------------
// Load .env.local
// ---------------------------------------------------------------------------

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    const v = t.slice(eq + 1).trim()
    if (!process.env[k]) process.env[k] = v
  }
}

// ---------------------------------------------------------------------------
// API-Football fixture response types
// ---------------------------------------------------------------------------

interface ApiFixtureInfo {
  id: number
  date: string       // ISO 8601 e.g. "2024-08-16T19:00:00+00:00"
  venue: { id: number | null; name: string | null; city: string | null }
  status: { long: string; short: string; elapsed: number | null }
}

interface ApiTeamRef {
  id: number
  name: string
  logo: string
}

interface ApiGoals {
  home: number | null
  away: number | null
}

interface ApiLeagueRef {
  id: number
  name: string
  round: string    // e.g. "Regular Season - 5" or "Group Stage - 1"
  season: number
}

interface ApiFixture {
  fixture: ApiFixtureInfo
  league: ApiLeagueRef
  teams: { home: ApiTeamRef; away: ApiTeamRef }
  goals: ApiGoals
  score: {
    halftime: ApiGoals
    fulltime: ApiGoals
    extratime: ApiGoals
    penalty: ApiGoals
  }
}

// ---------------------------------------------------------------------------
// Output type
// ---------------------------------------------------------------------------

export interface Fixture {
  fixture_id: number
  slug: string
  date: string         // "YYYY-MM-DD"
  kickoff_utc: string  // "HH:MM"
  status: string       // "FT" | "NS" | "1H" | "2H" | "HT" | "ET" | "PEN" | "AET" | "CANC" | "PST"
  score: { home: number | null; away: number | null }
  home_team: { id: number; name: string; slug: string; logo: string }
  away_team: { id: number; name: string; slug: string; logo: string }
  venue_id: number | null
  matchday: number | null
  stage: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseRound(round: string): { matchday: number | null; stage: string } {
  // "Regular Season - 5"  →  { matchday: 5, stage: "Regular Season" }
  // "Group Stage - 1"     →  { matchday: 1, stage: "Group Stage" }
  // "Round of 16"         →  { matchday: null, stage: "Round of 16" }
  const match = round.match(/^(.+?)\s*-\s*(\d+)$/)
  if (match) {
    return { stage: match[1].trim(), matchday: parseInt(match[2], 10) }
  }
  return { stage: round, matchday: null }
}

function toFixture(f: ApiFixture): Fixture {
  const dt = new Date(f.fixture.date)
  const date = dt.toISOString().slice(0, 10)
  const kickoff_utc = dt.toISOString().slice(11, 16)
  const { stage, matchday } = parseRound(f.league.round)

  const homeSlug = generateSlug(f.teams.home.name)
  const awaySlug = generateSlug(f.teams.away.name)
  const slug = `${homeSlug}-vs-${awaySlug}-${date}`

  return {
    fixture_id: f.fixture.id,
    slug,
    date,
    kickoff_utc,
    status: f.fixture.status.short,
    score: {
      home: f.score.fulltime.home,
      away: f.score.fulltime.away,
    },
    home_team: {
      id: f.teams.home.id,
      name: f.teams.home.name,
      slug: homeSlug,
      logo: f.teams.home.logo,
    },
    away_team: {
      id: f.teams.away.id,
      name: f.teams.away.name,
      slug: awaySlug,
      logo: f.teams.away.logo,
    },
    venue_id: f.fixture.venue.id,
    matchday,
    stage,
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const apiKey = process.env.API_FOOTBALL_KEY ?? ''
  if (!apiKey) {
    console.error('ERROR: API_FOOTBALL_KEY not set in .env.local')
    process.exit(1)
  }

  const client = createApiClient(apiKey)

  // Load leagues config
  const leaguesPath = path.resolve(process.cwd(), 'data', 'leagues.json')
  const leagues: League[] = JSON.parse(fs.readFileSync(leaguesPath, 'utf-8'))

  const outDir = path.resolve(process.cwd(), 'data', 'fixtures')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  for (const league of leagues) {
    console.log(`\nFetching fixtures: ${league.name} (id=${league.id}, season=${league.season})...`)

    const raw = await client.get<ApiFixture[]>('/fixtures', {
      league: String(league.id),
      season: String(league.season),
    })

    if (!raw || raw.length === 0) {
      console.warn(`  No fixtures returned — skipping`)
      continue
    }

    const fixtures = raw.map(toFixture).sort((a, b) => a.date.localeCompare(b.date))

    const outFile = path.join(outDir, `${league.slug}-${league.season}.json`)
    fs.writeFileSync(outFile, JSON.stringify(fixtures, null, 2) + '\n')

    const results  = fixtures.filter(f => f.status === 'FT' || f.status === 'AET' || f.status === 'PEN').length
    const upcoming = fixtures.filter(f => f.status === 'NS').length
    console.log(`  ✓ ${fixtures.length} fixtures (${results} played, ${upcoming} upcoming) → ${path.relative(process.cwd(), outFile)}`)
  }

  console.log('\nAll fixtures synced.')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
