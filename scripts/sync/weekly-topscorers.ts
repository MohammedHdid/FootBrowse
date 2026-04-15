/**
 * scripts/sync/weekly-topscorers.ts
 *
 * Fetches top scorers and top assists for each priority league.
 * Run weekly — costs ~10 API calls (2 per league).
 *
 * Usage:
 *   npx tsx scripts/sync/weekly-topscorers.ts
 *
 * Output:
 *   data/topscorers/{league-slug}-{season}.json  (one file per league)
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
// API response types
// ---------------------------------------------------------------------------

interface ApiPlayerInfo {
  id: number
  name: string
  firstname: string
  lastname: string
  age: number
  nationality: string
  photo: string
}

interface ApiTeamRef {
  id: number
  name: string
  logo: string
}

interface ApiGoalsStats {
  total: number | null
  assists: number | null
  saves: number | null
  conceded: number | null
}

interface ApiCardsStats {
  yellow: number
  yellowred: number
  red: number
}

interface ApiPlayerStats {
  team: ApiTeamRef
  games: { appearences: number | null; minutes: number | null }
  goals: ApiGoalsStats
  cards: ApiCardsStats
}

interface ApiPlayerEntry {
  player: ApiPlayerInfo
  statistics: ApiPlayerStats[]
}

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface TopPlayer {
  rank: number
  player_id: number
  name: string
  slug: string
  photo: string
  nationality: string
  age: number
  team: { id: number; name: string; slug: string; logo: string }
  goals: number
  assists: number
  appearances: number
  minutes: number
  yellow_cards: number
  red_cards: number
}

export interface TopScorersFile {
  league_id: number
  season: number
  scorers: TopPlayer[]
  assisters: TopPlayer[]
}

// ---------------------------------------------------------------------------
// Transform
// ---------------------------------------------------------------------------

function toPlayer(entry: ApiPlayerEntry, rank: number): TopPlayer {
  const stats = entry.statistics[0]
  return {
    rank,
    player_id: entry.player.id,
    name: entry.player.name,
    slug: generateSlug(entry.player.name),
    photo: entry.player.photo,
    nationality: entry.player.nationality,
    age: entry.player.age,
    team: {
      id: stats.team.id,
      name: stats.team.name,
      slug: generateSlug(stats.team.name),
      logo: stats.team.logo,
    },
    goals: stats.goals.total ?? 0,
    assists: stats.goals.assists ?? 0,
    appearances: stats.games.appearences ?? 0,
    minutes: stats.games.minutes ?? 0,
    yellow_cards: stats.cards.yellow,
    red_cards: stats.cards.red,
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

  const outDir = path.resolve(process.cwd(), 'data', 'topscorers')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  for (const league of leagues) {
    // Skip World Cup: league=1 mixes qualification rounds with tournament goals,
    // producing incorrect top scorers (e.g. Algeria qualifiers mixed with WC 2022 tournament).
    // WC 2026 tournament data is not available on the free tier yet.
    if (league.id === 1) {
      console.log(`\nSkipping ${league.name} — qualification data would corrupt top scorers list`)
      continue
    }

    console.log(`\nFetching top scorers + assists: ${league.name} (id=${league.id}, season=${league.season})...`)

    const [scorersRaw, assistsRaw] = await Promise.all([
      client.get<ApiPlayerEntry[]>('/players/topscorers', {
        league: String(league.id),
        season: String(league.season),
      }),
      client.get<ApiPlayerEntry[]>('/players/topassists', {
        league: String(league.id),
        season: String(league.season),
      }),
    ])

    const scorers = (scorersRaw ?? []).map((e, i) => toPlayer(e, i + 1))
    const assisters = (assistsRaw ?? []).map((e, i) => toPlayer(e, i + 1))

    const output: TopScorersFile = {
      league_id: league.id,
      season: league.season,
      scorers,
      assisters,
    }

    const outFile = path.join(outDir, `${league.slug}-${league.season}.json`)
    fs.writeFileSync(outFile, JSON.stringify(output, null, 2) + '\n')

    console.log(`  ✓ ${scorers.length} scorers, ${assisters.length} assisters → ${path.relative(process.cwd(), outFile)}`)
    if (scorers[0]) console.log(`    Top scorer: ${scorers[0].name} (${scorers[0].goals} goals)`)
    if (assisters[0]) console.log(`    Top assister: ${assisters[0].name} (${assisters[0].assists} assists)`)
  }

  console.log('\nAll top scorers synced.')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
