/**
 * scripts/sync/patch-results.ts
 *
 * Patches scores and statuses for recently completed fixtures into the
 * season fixture files (data/fixtures/{league-slug}-{season}.json).
 *
 * Run daily AFTER matches finish — fetches results for yesterday (and
 * optionally a custom date) and updates any fixture whose score was null.
 *
 * Cost: 1 API call per date (GET /fixtures?date=YYYY-MM-DD)
 *
 * Usage:
 *   npx tsx scripts/sync/patch-results.ts
 *   npx tsx scripts/sync/patch-results.ts --date 2026-04-15
 *   npx tsx scripts/sync/patch-results.ts --days 3   # patch last 3 days
 */

import fs from 'node:fs'
import path from 'node:path'
import { createApiClient } from '../utils/api-client.js'
import type { League } from '../sync/bootstrap-leagues.js'
import type { Fixture } from '../sync/weekly-fixtures.js'

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
// API types
// ---------------------------------------------------------------------------

interface ApiFixtureInfo {
  id: number
  date: string
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
// Helpers
// ---------------------------------------------------------------------------

const FINISHED = new Set(['FT', 'AET', 'PEN'])

function parseArg(args: string[], name: string): string | null {
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith(`--${name}=`)) return args[i].slice(name.length + 3)
    if (args[i] === `--${name}` && args[i + 1]) return args[i + 1]
  }
  return null
}

function dateString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function subtractDays(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
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

  const args = process.argv.slice(2)

  // Determine which dates to patch
  let datesToPatch: string[]
  const dateArg = parseArg(args, 'date')
  const daysArg  = parseArg(args, 'days')

  if (dateArg) {
    datesToPatch = [dateArg]
  } else if (daysArg) {
    const n = parseInt(daysArg, 10)
    datesToPatch = Array.from({ length: n }, (_, i) => dateString(subtractDays(i + 1)))
  } else {
    // Default: yesterday only
    datesToPatch = [dateString(subtractDays(1))]
  }

  // Load league map
  const leaguesPath = path.resolve(process.cwd(), 'data', 'leagues.json')
  const leagues: League[] = JSON.parse(fs.readFileSync(leaguesPath, 'utf-8'))
  const priorityIds  = new Set(leagues.map((l) => l.id))
  const leagueByID   = new Map(leagues.map((l) => [l.id, l]))

  // Load season fixture files into memory (keyed by fixture_id)
  const fixtureDir = path.resolve(process.cwd(), 'data', 'fixtures')
  // Map: league slug → array (mutable)
  const seasonFiles = new Map<string, Fixture[]>()
  // Map: fixture_id → { leagueSlug, idx }
  const fixtureIndex = new Map<number, { leagueSlug: string; idx: number }>()

  for (const league of leagues) {
    const fp = path.join(fixtureDir, `${league.slug}-${league.season}.json`)
    if (!fs.existsSync(fp)) continue
    const fixtures: Fixture[] = JSON.parse(fs.readFileSync(fp, 'utf-8'))
    seasonFiles.set(league.slug, fixtures)
    fixtures.forEach((f, i) => fixtureIndex.set(f.fixture_id, { leagueSlug: league.slug, idx: i }))
  }

  const client = createApiClient(apiKey)
  let totalPatched = 0
  const dirtyLeagues = new Set<string>()

  for (const date of datesToPatch) {
    console.log(`\nFetching results for ${date}...`)
    const allFixtures: ApiFixture[] = await client.get('/fixtures', { date })

    if (!allFixtures || allFixtures.length === 0) {
      console.log('  No fixtures found.')
      continue
    }

    const priorityFinished = allFixtures.filter(
      (f) => priorityIds.has(f.league.id) && FINISHED.has(f.fixture.status.short),
    )
    console.log(`  ${priorityFinished.length} finished fixture(s) in our leagues.`)

    let patchedThisDate = 0
    for (const f of priorityFinished) {
      const entry = fixtureIndex.get(f.fixture.id)
      if (!entry) continue // not in our season files (different season, etc.)

      const fixtures = seasonFiles.get(entry.leagueSlug)!
      const existing = fixtures[entry.idx]
      const newScore = { home: f.score.fulltime.home, away: f.score.fulltime.away }
      const newStatus = f.fixture.status.short

      // Skip if nothing changed
      if (
        existing.score.home === newScore.home &&
        existing.score.away === newScore.away &&
        existing.status === newStatus
      ) {
        continue
      }

      fixtures[entry.idx] = { ...existing, score: newScore, status: newStatus }
      dirtyLeagues.add(entry.leagueSlug)
      patchedThisDate++

      const league = leagueByID.get(f.league.id)!
      console.log(
        `  ✓ [${league.slug}] ${f.teams.home.name} ${newScore.home}-${newScore.away} ${f.teams.away.name} (${newStatus})`,
      )
    }

    console.log(`  Patched ${patchedThisDate} fixture(s) for ${date}.`)
    totalPatched += patchedThisDate
  }

  // Write back only files that were actually modified
  if (dirtyLeagues.size > 0) {
    for (const leagueSlug of dirtyLeagues) {
      const league = leagues.find((l) => l.slug === leagueSlug)!
      const fp = path.join(fixtureDir, `${league.slug}-${league.season}.json`)
      fs.writeFileSync(fp, JSON.stringify(seasonFiles.get(leagueSlug), null, 2) + '\n')
      console.log(`  Saved ${league.slug}-${league.season}.json`)
    }
    console.log(`\n✓ Wrote ${dirtyLeagues.size} season file(s) (${totalPatched} patches total).`)
  } else {
    console.log('\n✓ No patches needed — all scores already up to date.')
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
