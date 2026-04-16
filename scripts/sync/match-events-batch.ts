/**
 * scripts/sync/match-events-batch.ts
 *
 * Fetches match events (goals, cards, subs) and statistics for recently
 * completed club league fixtures. Caches results in:
 *   data/match-events/{fixture_id}.json
 *
 * Usage:
 *   npx tsx scripts/sync/match-events-batch.ts
 *   npx tsx scripts/sync/match-events-batch.ts --limit=10   # max fixtures to process
 *   npx tsx scripts/sync/match-events-batch.ts --days=14    # look back N days
 *
 * API calls: 2 per fixture (events + statistics).
 * Default: max 5 fixtures = 10 calls per run (free tier safe).
 */

import fs from 'node:fs'
import path from 'node:path'
import { createApiClient } from '../utils/api-client.js'

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
// Types
// ---------------------------------------------------------------------------

interface LeagueRef { slug: string; season: number }

interface Fixture {
  fixture_id: number
  slug: string
  date: string
  status: string
  score: { home: number | null; away: number | null }
  home_team: { id: number; name: string }
  away_team: { id: number; name: string }
}

interface ApiEvent {
  time: { elapsed: number; extra: number | null }
  team: { id: number; name: string }
  player: { id: number; name: string }
  assist: { id: number | null; name: string | null }
  type: string
  detail: string
  comments: string | null
}

interface ApiStat {
  team: { id: number; name: string }
  statistics: Array<{ type: string; value: string | number | null }>
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

function getStatVal(
  stats: Array<{ type: string; value: string | number | null }>,
  key: string,
): number | null {
  const entry = stats.find((s) => s.type === key)
  if (!entry || entry.value === null) return null
  if (typeof entry.value === 'string') {
    const n = parseFloat(entry.value) // "55%" → 55
    return isNaN(n) ? null : n
  }
  return entry.value
}

function mapStats(raw: ApiStat | undefined, teamId: number) {
  if (!raw) return null
  const s = raw.statistics
  return {
    team_id:      teamId,
    possession:   getStatVal(s, 'Ball Possession'),
    shots_on:     getStatVal(s, 'Shots on Goal'),
    shots_total:  getStatVal(s, 'Total Shots'),
    corners:      getStatVal(s, 'Corner Kicks'),
    fouls:        getStatVal(s, 'Fouls'),
    yellow_cards: getStatVal(s, 'Yellow Cards'),
    red_cards:    getStatVal(s, 'Red Cards'),
    offsides:     getStatVal(s, 'Offsides'),
    saves:        getStatVal(s, 'Goalkeeper Saves'),
    xg:           getStatVal(s, 'expected_goals'),
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

  const args  = process.argv.slice(2)
  const LIMIT = parseInt(parseArg(args, 'limit') ?? '20', 10)
  const DAYS  = parseInt(parseArg(args, 'days')  ?? '7',  10)
  const STALE = args.includes('--stale') // re-sync cached files with 0 events

  const outDir = path.resolve(process.cwd(), 'data', 'match-events')
  fs.mkdirSync(outDir, { recursive: true })

  // Load leagues
  const leaguesPath = path.resolve(process.cwd(), 'data', 'leagues.json')
  const leagues: LeagueRef[] = JSON.parse(fs.readFileSync(leaguesPath, 'utf-8'))

  // Collect completed fixtures not yet cached
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - DAYS)

  const pending: Fixture[] = []
  for (const league of leagues) {
    const fixturePath = path.resolve(
      process.cwd(), 'data', 'fixtures', `${league.slug}-${league.season}.json`,
    )
    if (!fs.existsSync(fixturePath)) continue
    const fixtures: Fixture[] = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'))
    for (const f of fixtures) {
      if (!FINISHED.has(f.status)) continue
      if (new Date(f.date) < cutoff) continue
      const cachedPath = path.join(outDir, `${f.fixture_id}.json`)
      if (fs.existsSync(cachedPath)) {
        // With --stale, re-sync files that were cached with 0 events (API may have had a delay)
        if (!STALE) continue
        try {
          const cached = JSON.parse(fs.readFileSync(cachedPath, 'utf-8'))
          if ((cached.events?.length ?? 0) > 0) continue // already has data, skip
        } catch { continue }
      }
      pending.push(f)
    }
  }

  if (pending.length === 0) {
    console.log(`No new completed fixtures to cache (last ${DAYS} days).`)
    return
  }

  const toProcess = pending.slice(0, LIMIT)
  console.log(
    `Found ${pending.length} uncached fixture(s). Processing ${toProcess.length} (--limit=${LIMIT}, --days=${DAYS}).`,
  )
  console.log(`API calls budget: ${toProcess.length * 2} (2 per fixture)\n`)

  const client = createApiClient(apiKey)
  let fetched = 0

  for (const fixture of toProcess) {
    const id = fixture.fixture_id
    console.log(`Fetching ${id}: ${fixture.home_team.name} vs ${fixture.away_team.name} (${fixture.date})`)

    const events: ApiEvent[]  = await client.get('/fixtures/events',     { fixture: String(id) })
    const stats:  ApiStat[]   = await client.get('/fixtures/statistics', { fixture: String(id) })

    const homeStatRaw = stats.find((s) => s.team.id === fixture.home_team.id)
    const awayStatRaw = stats.find((s) => s.team.id === fixture.away_team.id)

    const output = {
      fixture_id:  id,
      fetched_at:  new Date().toISOString(),
      status:      fixture.status,
      score:       fixture.score,
      events: events.map((e) => ({
        minute:  e.time.elapsed,
        extra:   e.time.extra ?? null,
        team_id: e.team.id,
        player:  e.player.name,
        assist:  e.assist.name ?? null,
        type:    e.type,
        detail:  e.detail,
      })),
      home_stats: mapStats(homeStatRaw, fixture.home_team.id),
      away_stats: mapStats(awayStatRaw, fixture.away_team.id),
    }

    const outPath = path.join(outDir, `${id}.json`)
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n')
    console.log(`  ✓ Saved ${id}.json (${output.events.length} events)`)
    fetched++
  }

  console.log(`\n✓ Done — ${fetched} fixture(s) cached. API calls used: ${fetched * 2}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
