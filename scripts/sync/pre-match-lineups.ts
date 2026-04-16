/**
 * Pre-Match Lineup Sync
 *
 * Fetches GET /fixtures/lineups?fixture={id} for all club fixtures
 * with status NS (not started) that kick off within the next 3 hours.
 * Skips fixtures where a complete lineup (11 starters per side) already exists.
 *
 * Run every 30 minutes via GitHub Actions (.github/workflows/pre-match.yml).
 *
 * Usage:
 *   npx tsx scripts/sync/pre-match-lineups.ts           # missing/incomplete only
 *   npx tsx scripts/sync/pre-match-lineups.ts --all     # force-refresh all in window
 *   npx tsx scripts/sync/pre-match-lineups.ts --dry-run # plan only
 *
 * API calls: 1 per fixture in window (typically 2–4 per run)
 */

import fs from 'node:fs'
import path from 'node:path'
import { createApiClient } from '../utils/api-client.js'

// ── Load .env.local ──────────────────────────────────────────────────────────
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

// ── Types ─────────────────────────────────────────────────────────────────────
interface ApiLineupPlayer {
  player: {
    id: number
    name: string
    number: number
    pos: string
    grid: string | null
  }
}

interface ApiTeamLineup {
  team: { id: number; name: string }
  coach: { name: string } | null
  formation: string
  startXI: ApiLineupPlayer[]
  substitutes: ApiLineupPlayer[]
}

interface StoredFixture {
  fixture_id: number
  slug: string
  date: string
  status: string
}

interface LeagueEntry {
  id: number
  slug: string
  season: number
}

interface StoredLineup {
  fixture_id: number
  fetched_at: string
  home: {
    team_id: number
    team_name: string
    formation: string
    coach: string | null
    startXI: Array<{ id: number; name: string; number: number; pos: string; grid: string | null }>
    substitutes: Array<{ id: number; name: string; number: number; pos: string; grid: string | null }>
  }
  away: {
    team_id: number
    team_name: string
    formation: string
    coach: string | null
    startXI: Array<{ id: number; name: string; number: number; pos: string; grid: string | null }>
    substitutes: Array<{ id: number; name: string; number: number; pos: string; grid: string | null }>
  }
}

// ── Config ────────────────────────────────────────────────────────────────────
const DATA_DIR    = path.join(process.cwd(), 'data')
const LINEUP_DIR  = path.join(DATA_DIR, 'lineups')
const WINDOW_MS   = 3 * 60 * 60 * 1000  // 3 hours before kickoff

function ensureDir() {
  if (!fs.existsSync(LINEUP_DIR)) fs.mkdirSync(LINEUP_DIR, { recursive: true })
}

function lineupPath(id: number) {
  return path.join(LINEUP_DIR, `${id}.json`)
}

function isComplete(id: number): boolean {
  const fp = lineupPath(id)
  if (!fs.existsSync(fp)) return false
  try {
    const d: StoredLineup = JSON.parse(fs.readFileSync(fp, 'utf-8'))
    return d.home.startXI.length === 11 && d.away.startXI.length === 11
  } catch { return false }
}

function getWindowFixtures(): Array<StoredFixture & { leagueSlug: string }> {
  const leagues: LeagueEntry[] = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'leagues.json'), 'utf-8'))
  const now     = Date.now()
  const horizon = now + WINDOW_MS
  const results: Array<StoredFixture & { leagueSlug: string }> = []

  for (const league of leagues) {
    if (league.slug === 'world-cup') continue  // WC fixtures not in API yet
    const fp = path.join(DATA_DIR, 'fixtures', `${league.slug}-${league.season}.json`)
    if (!fs.existsSync(fp)) continue
    const fixtures: StoredFixture[] = JSON.parse(fs.readFileSync(fp, 'utf-8'))
    for (const f of fixtures) {
      if (f.status !== 'NS') continue
      const kickoff = new Date(f.date).getTime()
      if (kickoff > horizon) continue   // too far in future
      if (kickoff < now)     continue   // already started (status mismatch edge case)
      results.push({ ...f, leagueSlug: league.slug })
    }
  }

  return results
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  ensureDir()

  const args     = process.argv.slice(2)
  const forceAll = args.includes('--all')
  const dryRun   = args.includes('--dry-run')

  const apiKey = process.env.API_FOOTBALL_KEY ?? ''
  if (!apiKey) { console.error('❌  API_FOOTBALL_KEY not set'); process.exit(1) }
  const api = createApiClient(apiKey)

  const window  = getWindowFixtures()
  const targets = forceAll ? window : window.filter((f) => !isComplete(f.fixture_id))

  console.log(`\nPre-match lineup sync (window: next ${WINDOW_MS / 3600000}h)`)
  console.log(`  Fixtures in window: ${window.length}`)
  console.log(`  To fetch: ${targets.length}${forceAll ? ' (force)' : ' (missing/incomplete)'}`)

  if (dryRun) {
    for (const f of targets) console.log(`    ${f.leagueSlug} — ${f.slug} (id: ${f.fixture_id})`)
    return
  }

  if (targets.length === 0) {
    console.log('  Nothing to do.')
    return
  }

  let saved = 0, tba = 0, errors = 0

  for (const fixture of targets) {
    try {
      const results = await api.get<ApiTeamLineup[]>('/fixtures/lineups', {
        fixture: String(fixture.fixture_id),
      })

      if (!results || results.length < 2) {
        console.log(`  ⏳ ${fixture.slug} — lineup not yet announced`)
        tba++
        continue
      }

      const [homeRaw, awayRaw] = results

      const mapPlayers = (raw: ApiLineupPlayer[]) =>
        raw.map((p) => ({
          id:     p.player.id,
          name:   p.player.name,
          number: p.player.number,
          pos:    p.player.pos,
          grid:   p.player.grid,
        }))

      const data: StoredLineup = {
        fixture_id: fixture.fixture_id,
        fetched_at: new Date().toISOString(),
        home: {
          team_id:     homeRaw.team.id,
          team_name:   homeRaw.team.name,
          formation:   homeRaw.formation,
          coach:       homeRaw.coach?.name ?? null,
          startXI:     mapPlayers(homeRaw.startXI),
          substitutes: mapPlayers(homeRaw.substitutes),
        },
        away: {
          team_id:     awayRaw.team.id,
          team_name:   awayRaw.team.name,
          formation:   awayRaw.formation,
          coach:       awayRaw.coach?.name ?? null,
          startXI:     mapPlayers(awayRaw.startXI),
          substitutes: mapPlayers(awayRaw.substitutes),
        },
      }

      fs.writeFileSync(lineupPath(fixture.fixture_id), JSON.stringify(data, null, 2))
      console.log(`  ✅ ${fixture.slug} — ${data.home.formation} vs ${data.away.formation} (${data.home.startXI.length + data.away.startXI.length} players)`)
      saved++
    } catch (err) {
      console.error(`  ❌ ${fixture.slug} — ${(err as Error).message}`)
      errors++
    }
  }

  console.log(`\n✅ Done — saved: ${saved}, TBA: ${tba}, errors: ${errors}`)
}

main().catch((err) => { console.error(err); process.exit(1) })
