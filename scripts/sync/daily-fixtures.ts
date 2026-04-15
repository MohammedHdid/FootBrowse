/**
 * scripts/sync/daily-fixtures.ts
 *
 * Runs daily at 06:00 UTC via GitHub Actions.
 * Costs exactly 1 API call — GET /fixtures?date=YYYY-MM-DD returns ALL leagues.
 * Filters to our priority league IDs and writes data/today.json.
 *
 * Usage:
 *   npx tsx scripts/sync/daily-fixtures.ts
 *   npx tsx scripts/sync/daily-fixtures.ts --date 2025-04-20
 *
 * Output:
 *   data/today.json
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
// API types (reuse fixture shape from weekly-fixtures)
// ---------------------------------------------------------------------------

interface ApiFixtureInfo {
  id: number
  date: string
  venue: { id: number | null; name: string | null; city: string | null }
  status: { long: string; short: string; elapsed: number | null }
}

interface ApiTeamRef { id: number; name: string; logo: string }
interface ApiGoals { home: number | null; away: number | null }
interface ApiLeagueRef { id: number; name: string; logo: string; round: string; season: number }

interface ApiFixture {
  fixture: ApiFixtureInfo
  league: ApiLeagueRef
  teams: { home: ApiTeamRef; away: ApiTeamRef }
  goals: ApiGoals
  score: { fulltime: ApiGoals }
}

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface TodayFixture {
  fixture_id: number
  slug: string
  date: string
  kickoff_utc: string
  status: string
  score: { home: number | null; away: number | null }
  home_team: { id: number; name: string; slug: string; logo: string }
  away_team: { id: number; name: string; slug: string; logo: string }
  round: string
}

export interface TodayLeagueGroup {
  league: { id: number; name: string; slug: string; logo: string }
  fixtures: TodayFixture[]
}

export interface TodayJson {
  date: string
  fetched_at: string
  fixtures_by_league: Record<string, TodayLeagueGroup>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toTodayFixture(f: ApiFixture): TodayFixture {
  const dt = new Date(f.fixture.date)
  const homeSlug = generateSlug(f.teams.home.name)
  const awaySlug = generateSlug(f.teams.away.name)
  const date = dt.toISOString().slice(0, 10)
  return {
    fixture_id: f.fixture.id,
    slug: `${homeSlug}-vs-${awaySlug}-${date}`,
    date,
    kickoff_utc: dt.toISOString().slice(11, 16),
    status: f.fixture.status.short,
    score: { home: f.score.fulltime.home, away: f.score.fulltime.away },
    home_team: { id: f.teams.home.id, name: f.teams.home.name, slug: homeSlug, logo: f.teams.home.logo },
    away_team: { id: f.teams.away.id, name: f.teams.away.name, slug: awaySlug, logo: f.teams.away.logo },
    round: f.league.round,
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

  // Allow --date YYYY-MM-DD or --date=YYYY-MM-DD override for testing
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
  const dateArg = process.argv
    .flatMap((a) => (a.startsWith('--date=') ? [a.slice(7)] : [a]))
    .find((a) => DATE_RE.test(a))
  const today = dateArg ?? new Date().toISOString().slice(0, 10)

  console.log(`Fetching fixtures for ${today}...`)

  const client = createApiClient(apiKey)

  // Load priority league IDs from leagues.json
  const leaguesPath = path.resolve(process.cwd(), 'data', 'leagues.json')
  const leagues: League[] = JSON.parse(fs.readFileSync(leaguesPath, 'utf-8'))
  const priorityIds = new Set(leagues.map((l) => l.id))
  const leagueByID = new Map(leagues.map((l) => [l.id, l]))

  // 1 API call — returns every fixture on this date across all leagues
  const allFixtures = await client.get<ApiFixture[]>('/fixtures', { date: today })

  if (!allFixtures || allFixtures.length === 0) {
    console.log('No fixtures found for today.')
  } else {
    console.log(`Received ${allFixtures.length} total fixtures across all leagues.`)
  }

  // Filter to our priority leagues only
  const priority = (allFixtures ?? []).filter((f) => priorityIds.has(f.league.id))
  console.log(`${priority.length} fixtures in our priority leagues.`)

  // Group by league slug
  const fixturesByLeague: Record<string, TodayLeagueGroup> = {}

  for (const f of priority) {
    const league = leagueByID.get(f.league.id)!
    const leagueSlug = league.slug

    if (!fixturesByLeague[leagueSlug]) {
      fixturesByLeague[leagueSlug] = {
        league: { id: f.league.id, name: f.league.name, slug: leagueSlug, logo: f.league.logo },
        fixtures: [],
      }
    }
    fixturesByLeague[leagueSlug].fixtures.push(toTodayFixture(f))
  }

  // Sort fixtures within each league by kickoff
  for (const group of Object.values(fixturesByLeague)) {
    group.fixtures.sort((a, b) => a.kickoff_utc.localeCompare(b.kickoff_utc))
  }

  const output: TodayJson = {
    date: today,
    fetched_at: new Date().toISOString(),
    fixtures_by_league: fixturesByLeague,
  }

  const outPath = path.resolve(process.cwd(), 'data', 'today.json')
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n')

  const total = Object.values(fixturesByLeague).reduce((n, g) => n + g.fixtures.length, 0)
  console.log(`\n✓ Wrote today.json — ${total} fixtures across ${Object.keys(fixturesByLeague).length} priority leagues`)

  if (total > 0) {
    for (const [slug, group] of Object.entries(fixturesByLeague)) {
      console.log(`  ${group.league.name}: ${group.fixtures.length} fixtures`)
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
