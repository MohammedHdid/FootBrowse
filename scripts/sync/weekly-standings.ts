/**
 * scripts/sync/weekly-standings.ts
 *
 * Fetches league standings for each priority league and writes per-league JSON.
 * Run weekly — costs ~5 API calls.
 *
 * Usage:
 *   npx tsx scripts/sync/weekly-standings.ts
 *
 * Output:
 *   data/standings/{league-slug}-{season}.json  (one file per league)
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
// API-Football response types
// ---------------------------------------------------------------------------

interface ApiTeamRef {
  id: number
  name: string
  logo: string
}

interface ApiStandingEntry {
  rank: number
  team: ApiTeamRef
  points: number
  goalsDiff: number
  group: string
  form: string | null
  status: string
  description: string | null
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } }
  home: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } }
  away: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } }
}

interface ApiStandingsResponse {
  league: {
    id: number
    name: string
    season: number
    standings: ApiStandingEntry[][]
  }
}

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface StandingRow {
  rank: number
  team: { id: number; name: string; slug: string; logo: string }
  points: number
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_diff: number
  form: string
  description: string | null
}

export interface StandingsGroup {
  group: string
  table: StandingRow[]
}

export interface StandingsFile {
  league_id: number
  season: number
  groups: StandingsGroup[]
}

// ---------------------------------------------------------------------------
// Transform
// ---------------------------------------------------------------------------

function toRow(entry: ApiStandingEntry): StandingRow {
  return {
    rank: entry.rank,
    team: {
      id: entry.team.id,
      name: entry.team.name,
      slug: generateSlug(entry.team.name),
      logo: entry.team.logo,
    },
    points: entry.points,
    played: entry.all.played,
    won: entry.all.win,
    drawn: entry.all.draw,
    lost: entry.all.lose,
    goals_for: entry.all.goals.for,
    goals_against: entry.all.goals.against,
    goal_diff: entry.goalsDiff,
    form: entry.form ?? '',
    description: entry.description,
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

  const leaguesPath = path.resolve(process.cwd(), 'data', 'leagues.json')
  const leagues: League[] = JSON.parse(fs.readFileSync(leaguesPath, 'utf-8'))

  const outDir = path.resolve(process.cwd(), 'data', 'standings')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  for (const league of leagues) {
    console.log(`\nFetching standings: ${league.name} (id=${league.id}, season=${league.season})...`)

    const results = await client.get<ApiStandingsResponse[]>('/standings', {
      league: String(league.id),
      season: String(league.season),
    })

    if (!results || results.length === 0) {
      console.warn(`  No standings data returned — skipping`)
      continue
    }

    const leagueData = results[0].league
    const groups: StandingsGroup[] = leagueData.standings.map((groupRows) => ({
      group: groupRows[0]?.group ?? league.name,
      table: groupRows.map(toRow),
    }))

    const output: StandingsFile = {
      league_id: league.id,
      season: league.season,
      groups,
    }

    const outFile = path.join(outDir, `${league.slug}-${league.season}.json`)
    fs.writeFileSync(outFile, JSON.stringify(output, null, 2) + '\n')

    const totalTeams = groups.reduce((n, g) => n + g.table.length, 0)
    console.log(`  ✓ ${groups.length} group(s), ${totalTeams} teams → ${path.relative(process.cwd(), outFile)}`)
    groups.forEach(g => console.log(`    • ${g.group} (${g.table.length} teams)`))
  }

  console.log('\nAll standings synced.')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
