/**
 * scripts/sync/bootstrap-leagues.ts
 *
 * ONE-TIME SCRIPT — run once to seed data/leagues.json.
 * Do not run repeatedly; it costs ~5 API calls from the free-tier daily budget.
 *
 * Usage:
 *   npx tsx scripts/sync/bootstrap-leagues.ts
 *
 * Output:
 *   data/leagues.json  — committed to git, used by all league pages
 */

import fs from 'node:fs'
import path from 'node:path'
import { createApiClient } from '../utils/api-client.js'
import { generateSlug } from '../utils/slug-generator.js'

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
// Priority leagues config
// ---------------------------------------------------------------------------

interface LeagueConfig {
  id: number
  season: number
  priority: number
}

const PRIORITY_LEAGUES: LeagueConfig[] = [
  { id: 1,   season: 2026, priority: 1 }, // FIFA World Cup 2026
  { id: 2,   season: 2025, priority: 2 }, // UEFA Champions League 2025/26
  { id: 39,  season: 2025, priority: 3 }, // Premier League 2025/26
  { id: 140, season: 2025, priority: 4 }, // La Liga 2025/26
  { id: 78,  season: 2025, priority: 5 }, // Bundesliga 2025/26
]

// ---------------------------------------------------------------------------
// API-Football response types
// ---------------------------------------------------------------------------

interface ApiLeague {
  id: number
  name: string
  type: string
  logo: string
}

interface ApiCountry {
  name: string
  code: string | null
  flag: string | null
}

interface ApiSeason {
  year: number
  start: string
  end: string
  current: boolean
  coverage: {
    standings: boolean
    fixtures: { events: boolean; lineups: boolean; statistics_fixtures: boolean; statistics_players: boolean }
    players: boolean
    top_scorers: boolean
    top_assists: boolean
    top_cards: boolean
    injuries: boolean
    predictions: boolean
    odds: boolean
  }
}

interface ApiLeagueEntry {
  league: ApiLeague
  country: ApiCountry
  seasons: ApiSeason[]
}

// ---------------------------------------------------------------------------
// Output type
// ---------------------------------------------------------------------------

export interface League {
  id: number
  slug: string
  name: string
  country: string
  countryCode: string | null
  flag: string | null
  logo: string
  season: number
  seasonStart: string
  seasonEnd: string
  type: string
  current: boolean
  standings: boolean
  topScorers: boolean
  priority: number
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
  const leagues: League[] = []

  for (const config of PRIORITY_LEAGUES) {
    console.log(`\nFetching league id=${config.id} season=${config.season}...`)

    let entries: ApiLeagueEntry[] | null = null
    try {
      entries = await client.get<ApiLeagueEntry[]>('/leagues', {
        id: String(config.id),
        season: String(config.season),
      })
    } catch (err) {
      // WC 2026 is not available on the free tier yet — fall back to 2022
      if (config.id === 1 && config.season === 2026) {
        console.warn(`  WC 2026 unavailable on free tier — falling back to season=2022`)
        const fallback = await client.get<ApiLeagueEntry[]>('/leagues', {
          id: '1',
          season: '2022',
        })
        if (!fallback || fallback.length === 0) {
          console.warn(`  WC 2022 also not found — skipping World Cup entry`)
          continue
        }
        const entry = fallback[0]
        const season = entry.seasons.find((s) => s.year === 2022) ?? entry.seasons[entry.seasons.length - 1]
        leagues.push(buildLeague(entry, season, config.priority, 2022))
        continue
      }
      throw err
    }

    if (!entries || entries.length === 0) {
      console.warn(`  No data returned for id=${config.id} season=${config.season} — skipping`)
      continue
    }

    const entry = entries[0]
    const season =
      entry.seasons.find((s) => s.year === config.season) ??
      entry.seasons.find((s) => s.current) ??
      entry.seasons[entry.seasons.length - 1]

    leagues.push(buildLeague(entry, season, config.priority, config.season))
  }

  // Sort by priority
  leagues.sort((a, b) => a.priority - b.priority)

  // Write output
  const outPath = path.resolve(process.cwd(), 'data', 'leagues.json')
  fs.writeFileSync(outPath, JSON.stringify(leagues, null, 2) + '\n')

  console.log(`\n✓ Wrote ${leagues.length} leagues to data/leagues.json`)
  console.log('\nLeagues saved:')
  for (const l of leagues) {
    console.log(`  [${l.priority}] ${l.name} (${l.country}) — slug: ${l.slug} — season: ${l.season}`)
  }
}

function buildLeague(
  entry: ApiLeagueEntry,
  season: ApiSeason,
  priority: number,
  seasonYear: number,
): League {
  return {
    id: entry.league.id,
    slug: generateSlug(entry.league.name),
    name: entry.league.name,
    country: entry.country.name,
    countryCode: entry.country.code,
    flag: entry.country.flag,
    logo: entry.league.logo,
    season: seasonYear,
    seasonStart: season?.start ?? '',
    seasonEnd: season?.end ?? '',
    type: entry.league.type,
    current: season?.current ?? false,
    standings: season?.coverage?.standings ?? false,
    topScorers: season?.coverage?.top_scorers ?? false,
    priority,
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
