/**
 * TASK 19b — H2H Sync (Supabase edition)
 *
 * Fetches head-to-head history for all upcoming fixtures across priority leagues.
 * Reads upcoming fixtures from Supabase. Caches to data/h2h/{min}-{max}.json
 *
 * Usage:
 *   npx tsx scripts/sync/weekly-h2h.ts           # missing only
 *   npx tsx scripts/sync/weekly-h2h.ts --all     # force-refresh all
 *   npx tsx scripts/sync/weekly-h2h.ts --dry-run # show plan, no writes
 */

import fs from 'node:fs'
import path from 'node:path'
import { getDb } from '../utils/db.js'
import { createApiClient } from '../utils/api-client.js'
import { loadEnv } from '../utils/env.js'

loadEnv()

// ── Types ────────────────────────────────────────────────────────────────────

interface ApiFixture {
  fixture: { id: number; date: string; status: { short: string } }
  league: { name: string }
  teams: {
    home: { id: number; name: string; logo: string }
    away: { id: number; name: string; logo: string }
  }
  score: { fulltime: { home: number | null; away: number | null } }
  goals: { home: number | null; away: number | null }
}

export interface H2HMatch {
  fixture_id: number
  date: string
  league: string
  home_id: number
  home_name: string
  home_logo: string
  away_id: number
  away_name: string
  away_logo: string
  home_score: number | null
  away_score: number | null
}

export interface H2HFile {
  team1_id: number
  team2_id: number
  fetched_at: string
  played: number
  team1_wins: number
  team2_wins: number
  draws: number
  team1_goals: number
  team2_goals: number
  last_matches: H2HMatch[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const H2H_DIR = path.join(process.cwd(), 'data', 'h2h')

function ensureDir() {
  if (!fs.existsSync(H2H_DIR)) fs.mkdirSync(H2H_DIR, { recursive: true })
}

function h2hKey(id1: number, id2: number): string {
  return `${Math.min(id1, id2)}-${Math.max(id1, id2)}`
}

function h2hPath(id1: number, id2: number): string {
  return path.join(H2H_DIR, `${h2hKey(id1, id2)}.json`)
}

function h2hExists(id1: number, id2: number): boolean {
  return fs.existsSync(h2hPath(id1, id2))
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  ensureDir()

  const args    = process.argv.slice(2)
  const forceAll = args.includes('--all')
  const dryRun  = args.includes('--dry-run')

  const db  = getDb()
  const api = createApiClient(process.env.API_FOOTBALL_KEY ?? '')

  const today  = new Date().toISOString().slice(0, 10)
  const horizon = new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10)

  // Fetch upcoming fixtures with both team api_football_ids
  const { data: rows, error } = await db
    .from('matches')
    .select(`
      fixture_id, slug,
      home_team:teams!home_id(api_football_id, name),
      away_team:teams!away_id(api_football_id, name)
    `)
    .in('status', ['NS', 'TBD', '1H', '2H', 'HT', 'FT', 'PEN', 'AET', 'P', 'LIVE'])
    .gte('date', today)
    .lte('date', horizon)
    .not('home_id', 'is', null)
    .not('away_id', 'is', null)

  if (error) throw new Error(error.message)

  // Collect unique team pairings
  const pairs = new Map<string, { id1: number; id2: number; label: string }>()
  for (const r of (rows ?? []) as any[]) {
    const homeApiId = r.home_team?.api_football_id
    const awayApiId = r.away_team?.api_football_id
    if (!homeApiId || !awayApiId) continue
    const key = h2hKey(homeApiId, awayApiId)
    if (!pairs.has(key)) {
      pairs.set(key, {
        id1:   homeApiId,
        id2:   awayApiId,
        label: `${r.home_team.name} vs ${r.away_team.name}`,
      })
    }
  }

  const targets = forceAll
    ? Array.from(pairs.values())
    : Array.from(pairs.values()).filter((p) => !h2hExists(p.id1, p.id2))

  console.log(`\nH2H sync`)
  console.log(`  Upcoming pairings (next 14d): ${pairs.size}`)
  console.log(`  To fetch: ${targets.length}${forceAll ? ' (force)' : ' (missing only)'}`)

  if (dryRun) {
    for (const t of targets) console.log(`    ${t.label}`)
    return
  }
  console.log()

  let saved = 0, errors = 0

  for (const pair of targets) {
    try {
      const result = await api.get<ApiFixture[]>('/fixtures/headtohead', {
        h2h:  `${pair.id1}-${pair.id2}`,
        last: '10',
      })

      const finished = (result ?? []).filter(
        (f) => ['FT', 'AET', 'PEN'].includes(f.fixture.status.short),
      )

      let team1Wins = 0, team2Wins = 0, draws = 0
      let team1Goals = 0, team2Goals = 0
      const lastMatches: H2HMatch[] = []

      const t1 = Math.min(pair.id1, pair.id2)
      const t2 = Math.max(pair.id1, pair.id2)

      for (const f of finished) {
        const homeScore = f.goals.home ?? 0
        const awayScore = f.goals.away ?? 0
        const homeId    = f.teams.home.id

        const t1IsHome = homeId === t1
        const t1Goals  = t1IsHome ? homeScore : awayScore
        const t2Goals  = t1IsHome ? awayScore : homeScore

        team1Goals += t1Goals
        team2Goals += t2Goals

        if (homeScore > awayScore) {
          if (homeId === t1) team1Wins++; else team2Wins++
        } else if (awayScore > homeScore) {
          if (f.teams.away.id === t1) team1Wins++; else team2Wins++
        } else {
          draws++
        }

        lastMatches.push({
          fixture_id: f.fixture.id,
          date:       f.fixture.date.split('T')[0],
          league:     f.league.name,
          home_id:    f.teams.home.id,
          home_name:  f.teams.home.name,
          home_logo:  f.teams.home.logo,
          away_id:    f.teams.away.id,
          away_name:  f.teams.away.name,
          away_logo:  f.teams.away.logo,
          home_score: f.goals.home,
          away_score: f.goals.away,
        })
      }

      const h2hFile: H2HFile = {
        team1_id:    t1,
        team2_id:    t2,
        fetched_at:  new Date().toISOString(),
        played:      finished.length,
        team1_wins:  team1Wins,
        team2_wins:  team2Wins,
        draws,
        team1_goals: team1Goals,
        team2_goals: team2Goals,
        last_matches: lastMatches,
      }

      // Write to Supabase
      const { error: dbErr } = await db.from('h2h').upsert({
        team1_api_id:  t1,
        team2_api_id:  t2,
        played:        finished.length,
        team1_wins:    team1Wins,
        team2_wins:    team2Wins,
        draws,
        team1_goals:   team1Goals,
        team2_goals:   team2Goals,
        last_matches:  lastMatches,
        synced_at:     new Date().toISOString(),
      }, { onConflict: 'team1_api_id,team2_api_id' })
      if (dbErr) console.warn(`  db warn: ${dbErr.message}`)

      // Keep JSON file as local cache
      fs.writeFileSync(h2hPath(t1, t2), JSON.stringify(h2hFile, null, 2))
      console.log(`  ✅ ${pair.label} — ${finished.length} meetings`)
      saved++
    } catch (err) {
      console.error(`  ❌ ${pair.label} — ${(err as Error).message}`)
      errors++
    }
  }

  console.log(`\n✅ Done — saved: ${saved}, errors: ${errors}`)
}

main().catch((err) => { console.error(err); process.exit(1) })
