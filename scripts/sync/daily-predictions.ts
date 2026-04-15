/**
 * Daily Predictions Sync
 *
 * Fetches GET /predictions?fixture={id} for all upcoming club fixtures
 * in the next 14 days that are missing or have stale prediction data.
 *
 * Usage:
 *   npx tsx scripts/sync/daily-predictions.ts           # missing/stale only
 *   npx tsx scripts/sync/daily-predictions.ts --all     # force-refresh all
 *   npx tsx scripts/sync/daily-predictions.ts --dry-run # plan only
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
interface ApiPrediction {
  predictions: {
    winner: { id: number | null; name: string | null; comment: string | null } | null
    advice: string
    percent: { home: string; draw: string; away: string }
    under_over: string | null
    goals: { home: string | null; away: string | null }
  }
  comparison: {
    form:  { home: string; away: string }
    att:   { home: string; away: string }
    def:   { home: string; away: string }
    total: { home: string; away: string }
  } | null
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
const DATA_DIR       = path.join(process.cwd(), 'data')
const PRED_DIR       = path.join(DATA_DIR, 'predictions')
const STALE_MS       = 48 * 60 * 60 * 1000   // 48h — predictions change
const HORIZON_DAYS   = 14

function ensureDir() {
  if (!fs.existsSync(PRED_DIR)) fs.mkdirSync(PRED_DIR, { recursive: true })
}

function predPath(id: number) {
  return path.join(PRED_DIR, `${id}.json`)
}

function isStale(id: number): boolean {
  const fp = predPath(id)
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

  console.log(`\nPredictions sync`)
  console.log(`  Upcoming fixtures (next ${HORIZON_DAYS}d): ${upcoming.length}`)
  console.log(`  To fetch: ${targets.length}${forceAll ? ' (force)' : ' (missing/stale)'}`)

  if (dryRun) {
    for (const f of targets) console.log(`    ${f.leagueSlug} — ${f.slug}`)
    return
  }

  let saved = 0, errors = 0

  for (const fixture of targets) {
    try {
      const results = await api.get<ApiPrediction[]>('/predictions', { fixture: String(fixture.fixture_id) })
      const raw = results?.[0]
      if (!raw) {
        console.log(`  ⚠️  ${fixture.slug} — no prediction data`)
        continue
      }

      const data = {
        fixture_id:     fixture.fixture_id,
        fetched_at:     new Date().toISOString(),
        advice:         raw.predictions.advice,
        winner_id:      raw.predictions.winner?.id ?? null,
        winner_name:    raw.predictions.winner?.name ?? null,
        winner_comment: raw.predictions.winner?.comment ?? null,
        percent:        raw.predictions.percent,
        under_over:     raw.predictions.under_over,
        goals_home:     raw.predictions.goals.home,
        goals_away:     raw.predictions.goals.away,
        comparison:     raw.comparison,
      }

      fs.writeFileSync(predPath(fixture.fixture_id), JSON.stringify(data, null, 2))
      console.log(`  ✅ ${fixture.slug} — winner: ${data.winner_name ?? 'Draw'} (${data.advice})`)
      saved++
    } catch (err) {
      console.error(`  ❌ ${fixture.slug} — ${(err as Error).message}`)
      errors++
    }
  }

  console.log(`\n✅ Done — saved: ${saved}, errors: ${errors}`)
}

main().catch((err) => { console.error(err); process.exit(1) })
