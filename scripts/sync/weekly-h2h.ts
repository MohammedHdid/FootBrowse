/**
 * TASK 19b — H2H Sync
 *
 * Fetches head-to-head history for all upcoming fixtures across priority leagues.
 * Caches to data/h2h/{min_team_id}-{max_team_id}.json
 *
 * Usage:
 *   npx tsx scripts/sync/weekly-h2h.ts           # all upcoming fixtures
 *   npx tsx scripts/sync/weekly-h2h.ts --all     # force-refresh all existing
 *   npx tsx scripts/sync/weekly-h2h.ts --dry-run # show plan, no writes
 *
 * API calls: 1 per unique team pairing with upcoming fixture
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

interface StoredFixture {
  fixture_id: number
  slug: string
  date: string
  status: string
  home_team: { id: number; name: string; slug: string; logo: string }
  away_team: { id: number; name: string; slug: string; logo: string }
}

interface LeagueEntry {
  id: number
  slug: string
  season: number
}

interface WcMatchTeam {
  slug: string
  name: string
}

interface WcMatch {
  slug: string
  date: string
  team_a: WcMatchTeam
  team_b: WcMatchTeam
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), 'data')
const H2H_DIR  = path.join(DATA_DIR, 'h2h')

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

function getPriorityLeagues(): LeagueEntry[] {
  const leagues: LeagueEntry[] = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'leagues.json'), 'utf-8'),
  )
  return leagues.filter((l) => l.slug !== 'world-cup')
}

/** Adds WC 2026 team pairings if wc-team-ids.json is bootstrapped */
function addWcPairings(pairs: Map<string, { id1: number; id2: number; label: string }>) {
  const wcTeamIdsPath = path.join(DATA_DIR, 'wc-team-ids.json')
  const wcMatchesPath = path.join(DATA_DIR, 'matches.json')
  if (!fs.existsSync(wcTeamIdsPath) || !fs.existsSync(wcMatchesPath)) return

  const wcTeamIds: Record<string, number> = JSON.parse(fs.readFileSync(wcTeamIdsPath, 'utf-8'))
  const wcMatches: WcMatch[] = JSON.parse(fs.readFileSync(wcMatchesPath, 'utf-8'))

  for (const m of wcMatches) {
    const id1 = wcTeamIds[m.team_a.slug]
    const id2 = wcTeamIds[m.team_b.slug]
    if (!id1 || !id2) continue
    const key = h2hKey(id1, id2)
    if (!pairs.has(key)) {
      pairs.set(key, { id1, id2, label: `${m.team_a.name} vs ${m.team_b.name}` })
    }
  }
}

function getUpcomingFixtures(league: LeagueEntry): StoredFixture[] {
  const fp = path.join(DATA_DIR, 'fixtures', `${league.slug}-${league.season}.json`)
  if (!fs.existsSync(fp)) return []
  const all: StoredFixture[] = JSON.parse(fs.readFileSync(fp, 'utf-8'))
  return all.filter((f) => f.status === 'NS')
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  ensureDir()

  const args    = process.argv.slice(2)
  const forceAll = args.includes('--all')
  const dryRun  = args.includes('--dry-run')

  const apiKey = process.env.API_FOOTBALL_KEY ?? ''
  if (!apiKey) {
    console.error('❌  API_FOOTBALL_KEY not set in .env.local')
    process.exit(1)
  }
  const api = createApiClient(apiKey)

  const leagues = getPriorityLeagues()

  // Collect unique team pairings from upcoming fixtures
  const pairs = new Map<string, { id1: number; id2: number; label: string }>()
  for (const league of leagues) {
    for (const f of getUpcomingFixtures(league)) {
      const key = h2hKey(f.home_team.id, f.away_team.id)
      if (!pairs.has(key)) {
        pairs.set(key, {
          id1:   f.home_team.id,
          id2:   f.away_team.id,
          label: `${f.home_team.name} vs ${f.away_team.name}`,
        })
      }
    }
  }

  // Add WC 2026 pairings if bootstrapped
  addWcPairings(pairs)

  const targets = forceAll
    ? Array.from(pairs.values())
    : Array.from(pairs.values()).filter((p) => !h2hExists(p.id1, p.id2))

  console.log(`\nH2H sync`)
  console.log(`  Unique pairings in upcoming fixtures: ${pairs.size}`)
  console.log(`  To fetch: ${targets.length}${forceAll ? ' (force refresh)' : ' (missing only)'}`)

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
        const awayId    = f.teams.away.id

        // Accumulate from t1's perspective
        const t1IsHome = homeId === t1
        const t1Goals  = t1IsHome ? homeScore : awayScore
        const t2Goals  = t1IsHome ? awayScore : homeScore

        team1Goals += t1Goals
        team2Goals += t2Goals

        if (homeScore > awayScore) {
          if (homeId === t1) team1Wins++; else team2Wins++
        } else if (awayScore > homeScore) {
          if (awayId === t1) team1Wins++; else team2Wins++
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

      fs.writeFileSync(h2hPath(t1, t2), JSON.stringify(h2hFile, null, 2))
      console.log(`  ✅ ${pair.label} — ${finished.length} meetings`)
      saved++
    } catch (err) {
      console.error(`  ❌ ${pair.label} — ${(err as Error).message}`)
      errors++
    }
  }

  console.log(`\n✅ Done`)
  console.log(`   Saved:  ${saved}`)
  console.log(`   Errors: ${errors}`)
}

main().catch((err) => { console.error(err); process.exit(1) })
