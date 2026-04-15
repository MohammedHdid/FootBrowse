/**
 * TASK 18 — Injuries Sync
 *
 * Fetches current injury/suspension data for all priority leagues and caches
 * to data/injuries/{league-slug}.json
 *
 * Usage:
 *   npx tsx scripts/sync/weekly-injuries.ts           # all leagues
 *   npx tsx scripts/sync/weekly-injuries.ts --dry-run # show plan, no writes
 *
 * API calls: 1 per league (GET /injuries?league={id}&season={year})
 * Rate limit: 10 req/min (handled by api-client)
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

// ── Types ────────────────────────────────────────────────────────────────────

interface ApiInjury {
  player: {
    id: number
    name: string
    photo: string | null
    type: string   // "Injured" | "Suspended" | "Missing Fixture"
    reason: string | null
  }
  team: {
    id: number
    name: string
    logo: string
  }
  fixture: {
    id: number
    date: string
    timezone: string
    timestamp: number
  }
  league: {
    id: number
    season: number
    name: string
    country: string
    logo: string
    flag: string | null
  }
}

interface InjuryRecord {
  player_id: number
  player_name: string
  player_photo: string | null
  type: string
  reason: string | null
  team_id: number
  team_name: string
  team_logo: string
  team_slug: string
  fixture_id: number
  fixture_date: string
}

interface InjuriesFile {
  league_id: number
  league_slug: string
  season: number
  fetched_at: string
  injuries: InjuryRecord[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const DATA_DIR      = path.join(process.cwd(), 'data')
const INJURIES_DIR  = path.join(DATA_DIR, 'injuries')

function ensureDir(): void {
  if (!fs.existsSync(INJURIES_DIR)) fs.mkdirSync(INJURIES_DIR, { recursive: true })
}

// Build a map of team_id → team_slug from club-teams.json
function buildTeamSlugMap(): Map<number, string> {
  const map = new Map<number, string>()
  try {
    const clubs: Array<{ id: number; slug: string }> =
      JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'club-teams.json'), 'utf-8'))
    for (const c of clubs) map.set(c.id, c.slug)
  } catch {
    // non-fatal — team_slug will fall back to team name
  }
  // Also add WC national teams
  try {
    const wc: Array<{ id: number; slug: string }> =
      JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'teams.json'), 'utf-8'))
    for (const t of wc) map.set(t.id, t.slug)
  } catch { /* ignore */ }
  return map
}

function teamSlugFallback(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ── Priority leagues ─────────────────────────────────────────────────────────

interface LeagueEntry {
  id: number
  slug: string
  season: number
}

function getPriorityLeagues(): LeagueEntry[] {
  const leagues: Array<{ id: number; slug: string; season: number }> =
    JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'leagues.json'), 'utf-8'))
  // Skip World Cup — no injury data until tournament starts
  return leagues.filter((l) => l.slug !== 'world-cup')
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  ensureDir()

  const args    = process.argv.slice(2)
  const dryRun  = args.includes('--dry-run')

  const apiKey = process.env.API_FOOTBALL_KEY ?? ''
  if (!apiKey) {
    console.error('❌  API_FOOTBALL_KEY not set in .env.local')
    process.exit(1)
  }
  const api = createApiClient(apiKey)

  const leagues = getPriorityLeagues()
  const teamSlugs = buildTeamSlugMap()

  console.log(`\nInjuries sync`)
  console.log(`  Leagues: ${leagues.map((l) => l.slug).join(', ')}`)
  if (dryRun) {
    console.log('\n  [DRY RUN] Would fetch injuries for:')
    for (const l of leagues) console.log(`    ${l.slug} (id=${l.id}, season=${l.season})`)
    return
  }
  console.log()

  let saved  = 0
  let empty  = 0
  let errors = 0

  for (const league of leagues) {
    try {
      const result = await api.get<ApiInjury[]>('/injuries', {
        league: String(league.id),
        season: String(league.season),
      })

      const injuries: InjuryRecord[] = (result ?? []).map((item) => ({
        player_id:    item.player.id,
        player_name:  item.player.name ?? 'Unknown',
        player_photo: item.player.photo ?? null,
        type:         item.player.type,
        reason:       item.player.reason ?? null,
        team_id:      item.team.id,
        team_name:    item.team.name,
        team_logo:    item.team.logo,
        team_slug:    teamSlugs.get(item.team.id) ?? teamSlugFallback(item.team.name),
        fixture_id:   item.fixture.id,
        fixture_date: item.fixture.date,
      }))

      const file: InjuriesFile = {
        league_id:   league.id,
        league_slug: league.slug,
        season:      league.season,
        fetched_at:  new Date().toISOString(),
        injuries,
      }

      const outPath = path.join(INJURIES_DIR, `${league.slug}.json`)
      fs.writeFileSync(outPath, JSON.stringify(file, null, 2))

      if (injuries.length === 0) {
        console.log(`  ⚠ ${league.slug} — 0 injuries (off-season or no data)`)
        empty++
      } else {
        const byType = injuries.reduce<Record<string, number>>((acc, r) => {
          acc[r.type] = (acc[r.type] ?? 0) + 1
          return acc
        }, {})
        const summary = Object.entries(byType).map(([t, n]) => `${n} ${t}`).join(', ')
        console.log(`  ✅ ${league.slug} — ${injuries.length} records (${summary})`)
        saved++
      }
    } catch (err) {
      console.error(`  ❌ ${league.slug} — ${(err as Error).message}`)
      errors++
    }
  }

  console.log(`\n✅ Done`)
  console.log(`   Saved:  ${saved} leagues with injury data`)
  console.log(`   Empty:  ${empty} leagues (no data)`)
  console.log(`   Errors: ${errors}`)
}

main().catch((err) => { console.error(err); process.exit(1) })
