/**
 * Daily Odds Sync
 *
 * Fetches GET /odds?fixture={id}&bookmaker=8 (Bet365) for all upcoming
 * club fixtures in the next 7 days, picking the Match Winner (1X2) market.
 *
 * Usage:
 *   npx tsx scripts/sync/daily-odds.ts           # missing/stale only
 *   npx tsx scripts/sync/daily-odds.ts --all     # force-refresh all
 *   npx tsx scripts/sync/daily-odds.ts --dry-run # plan only
 *
 * API calls: 1 per fixture
 * Rate limit: handled by api-client (10 req/min)
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
interface ApiBet {
  id: number
  name: string
  values: Array<{ value: string; odd: string }>
}

interface ApiBookmaker {
  id: number
  name: string
  bets: ApiBet[]
}

interface ApiOddsResponse {
  fixture: { id: number }
  bookmakers: ApiBookmaker[]
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

// ── Config ────────────────────────────────────────────────────────────────────
const DATA_DIR     = path.join(process.cwd(), 'data')
const ODDS_DIR     = path.join(DATA_DIR, 'odds')
const BOOKMAKER_ID = 8          // Bet365
const STALE_MS     = 24 * 60 * 60 * 1000  // 24h — odds change frequently
const HORIZON_DAYS = 7

function ensureDir() {
  if (!fs.existsSync(ODDS_DIR)) fs.mkdirSync(ODDS_DIR, { recursive: true })
}

function oddsPath(id: number) {
  return path.join(ODDS_DIR, `${id}.json`)
}

function isStale(id: number): boolean {
  const fp = oddsPath(id)
  if (!fs.existsSync(fp)) return true
  try {
    const d = JSON.parse(fs.readFileSync(fp, 'utf-8'))
    return Date.now() - new Date(d.fetched_at).getTime() > STALE_MS
  } catch { return true }
}

function getUpcomingFixtures(): Array<StoredFixture & { leagueSlug: string }> {
  const leagues: LeagueEntry[] = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'leagues.json'), 'utf-8'))
  const horizon = Date.now() + HORIZON_DAYS * 24 * 60 * 60 * 1000
  const results: Array<StoredFixture & { leagueSlug: string }> = []

  for (const league of leagues) {
    if (league.slug === 'world-cup') continue
    const fp = path.join(DATA_DIR, 'fixtures', `${league.slug}-${league.season}.json`)
    if (!fs.existsSync(fp)) continue
    const fixtures: StoredFixture[] = JSON.parse(fs.readFileSync(fp, 'utf-8'))
    for (const f of fixtures) {
      if (f.status !== 'NS') continue
      if (new Date(f.date).getTime() > horizon) continue
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

  const upcoming = getUpcomingFixtures()
  const targets  = forceAll ? upcoming : upcoming.filter((f) => isStale(f.fixture_id))

  console.log(`\nOdds sync (Bet365 / bookmaker ${BOOKMAKER_ID})`)
  console.log(`  Upcoming fixtures (next ${HORIZON_DAYS}d): ${upcoming.length}`)
  console.log(`  To fetch: ${targets.length}${forceAll ? ' (force)' : ' (missing/stale)'}`)

  if (dryRun) {
    for (const f of targets) console.log(`    ${f.leagueSlug} — ${f.slug}`)
    return
  }

  let saved = 0, errors = 0

  for (const fixture of targets) {
    try {
      const results = await api.get<ApiOddsResponse[]>('/odds', {
        fixture:   String(fixture.fixture_id),
        bookmaker: String(BOOKMAKER_ID),
      })

      const bk = results?.[0]?.bookmakers?.[0]
      if (!bk) {
        console.log(`  ⚠️  ${fixture.slug} — no odds from bookmaker ${BOOKMAKER_ID}`)
        continue
      }

      const matchWinner = bk.bets.find((b) => b.id === 1 || b.name === 'Match Winner')
      if (!matchWinner) {
        console.log(`  ⚠️  ${fixture.slug} — no Match Winner market`)
        continue
      }

      const homeVal = matchWinner.values.find((v) => v.value === 'Home')
      const drawVal = matchWinner.values.find((v) => v.value === 'Draw')
      const awayVal = matchWinner.values.find((v) => v.value === 'Away')

      if (!homeVal || !drawVal || !awayVal) {
        console.log(`  ⚠️  ${fixture.slug} — incomplete odds values`)
        continue
      }

      const data = {
        fixture_id:    fixture.fixture_id,
        fetched_at:    new Date().toISOString(),
        bookmaker_id:  bk.id,
        bookmaker_name: bk.name,
        home_win:      parseFloat(homeVal.odd),
        draw:          parseFloat(drawVal.odd),
        away_win:      parseFloat(awayVal.odd),
      }

      fs.writeFileSync(oddsPath(fixture.fixture_id), JSON.stringify(data, null, 2))
      console.log(`  ✅ ${fixture.slug} — ${data.home_win} / ${data.draw} / ${data.away_win}`)
      saved++
    } catch (err) {
      console.error(`  ❌ ${fixture.slug} — ${(err as Error).message}`)
      errors++
    }
  }

  console.log(`\n✅ Done — saved: ${saved}, errors: ${errors}`)
}

main().catch((err) => { console.error(err); process.exit(1) })
