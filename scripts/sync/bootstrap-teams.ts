/**
 * scripts/sync/bootstrap-teams.ts
 *
 * ONE-TIME SCRIPT — fetches teams for each priority league.
 * Writes one JSON file per league to data/teams-by-league/.
 * Costs ~5 API calls.
 *
 * Usage:
 *   npx tsx scripts/sync/bootstrap-teams.ts
 *
 * Output:
 *   data/teams-by-league/{league-slug}-{season}.json
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

interface ApiTeam {
  id: number
  name: string
  code: string | null
  country: string
  founded: number | null
  national: boolean
  logo: string
}

interface ApiVenue {
  id: number | null
  name: string | null
  address: string | null
  city: string | null
  capacity: number | null
  surface: string | null
  image: string | null
}

interface ApiTeamEntry {
  team: ApiTeam
  venue: ApiVenue
}

// ---------------------------------------------------------------------------
// Output type
// ---------------------------------------------------------------------------

export interface LeagueTeam {
  id: number
  name: string
  slug: string           // generated from name
  existing_slug: string | null  // slug in our data/teams.json if matched (national teams)
  logo: string
  country: string
  founded: number | null
  national: boolean
  venue: {
    id: number | null
    name: string | null
    city: string | null
    capacity: number | null
    image: string | null
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

  // Build a lookup of existing national team slugs by name
  const existingTeamsPath = path.resolve(process.cwd(), 'data', 'teams.json')
  const existingTeams: Array<{ slug: string; name: string }> = JSON.parse(
    fs.readFileSync(existingTeamsPath, 'utf-8')
  )
  const existingBySlug = new Map(existingTeams.map((t) => [generateSlug(t.name), t.slug]))
  const existingByName = new Map(existingTeams.map((t) => [t.name.toLowerCase(), t.slug]))

  const outDir = path.resolve(process.cwd(), 'data', 'teams-by-league')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  for (const league of leagues) {
    console.log(`\nFetching teams: ${league.name} (id=${league.id}, season=${league.season})...`)

    const entries = await client.get<ApiTeamEntry[]>('/teams', {
      league: String(league.id),
      season: String(league.season),
    })

    if (!entries || entries.length === 0) {
      console.warn(`  No teams returned — skipping`)
      continue
    }

    const teams: LeagueTeam[] = entries.map(({ team, venue }) => {
      const slug = generateSlug(team.name)
      // Try to match against our existing national team data
      const existing_slug =
        existingByName.get(team.name.toLowerCase()) ??
        existingBySlug.get(slug) ??
        null

      return {
        id: team.id,
        name: team.name,
        slug,
        existing_slug,
        logo: team.logo,
        country: team.country,
        founded: team.founded,
        national: team.national,
        venue: {
          id: venue.id,
          name: venue.name,
          city: venue.city,
          capacity: venue.capacity,
          image: venue.image,
        },
      }
    })

    // Sort alphabetically (standings sort is done at page render time)
    teams.sort((a, b) => a.name.localeCompare(b.name))

    const outFile = path.join(outDir, `${league.slug}-${league.season}.json`)
    fs.writeFileSync(outFile, JSON.stringify(teams, null, 2) + '\n')

    const matched = teams.filter((t) => t.existing_slug).length
    console.log(`  ✓ ${teams.length} teams (${matched} matched to existing slugs) → ${path.relative(process.cwd(), outFile)}`)
  }

  console.log('\nAll teams synced.')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
