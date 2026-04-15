/**
 * scripts/sync/weekly-squads.ts
 *
 * Replaces sync-players.ts — fetches WC 2026 squad data from API-Football v3.
 * Preserves exact output format of data/players.json and data/players-by-team.json.
 *
 * Strategy:
 *   1. Load team ID mappings from data/teams-by-league/world-cup-2022.json (26 teams)
 *   2. For unmapped teams: search by name (GET /teams?search=&national=true) — 1 call each
 *   3. For each team: GET /players/squads?team={id} — 1 call each
 *   4. Merge with existing players.json to preserve DOB, nationality, bio
 *   5. Write data/players.json and data/players-by-team.json
 *
 * API calls: ~70 total (Pro tier required: 7,500/day)
 *
 * Usage:
 *   npx tsx scripts/sync/weekly-squads.ts
 *   npx tsx scripts/sync/weekly-squads.ts --dry-run   (show plan, no writes)
 */

import fs from 'node:fs'
import path from 'node:path'
import { createApiClient } from '../utils/api-client.js'

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
// Types
// ---------------------------------------------------------------------------

interface WcTeamRef {
  id: number
  name: string
  slug: string
  existing_slug: string | null
  logo: string
  country: string
  national: boolean
}

interface OurTeam {
  slug: string
  name: string
  code: string
  badge_url: string | null
  logo_url: string | null
  [key: string]: unknown
}

interface ExistingPlayer {
  id: number
  slug: string
  name: string
  firstName: string
  lastName: string
  position: string
  dateOfBirth: string | null
  nationality: string
  shirtNumber: number | null
  marketValue: number | null
  photo_url: string | null
  thumbnail_url: string | null
  bio: string | null
  teamId: number
  teamName: string
  teamSlug: string
  teamCrest: string
}

interface ApiSquadPlayer {
  id: number
  name: string
  age: number
  number: number | null
  position: string
  photo: string
}

interface ApiTeamSearchEntry {
  team: { id: number; name: string; logo: string; national: boolean }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

/** Extract last name from abbreviated "L. Messi" or full "Lionel Messi" */
function extractLastName(name: string): string {
  const parts = name.split(' ')
  return parts[parts.length - 1] ?? name
}

/** Map API-Football position labels to our format */
function mapPosition(pos: string): string {
  const map: Record<string, string> = {
    Goalkeeper: 'Goalkeeper',
    Defender:   'Defender',
    Midfielder: 'Midfielder',
    Attacker:   'Forward',
  }
  return map[pos] ?? pos
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

  const dryRun = process.argv.includes('--dry-run')
  if (dryRun) console.log('DRY RUN — no files will be written\n')

  const dataDir = path.resolve(process.cwd(), 'data')
  const client  = createApiClient(apiKey)

  // ── Load reference data ──────────────────────────────────────────────────

  const ourTeams: OurTeam[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'teams.json'), 'utf-8'),
  )

  const wc22Teams: WcTeamRef[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'teams-by-league', 'world-cup-2022.json'), 'utf-8'),
  )

  const existingPlayers: ExistingPlayer[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'players.json'), 'utf-8'),
  )

  // Build existing player lookup: normalized-last-name+team-slug → player
  const existingByLastName = new Map<string, ExistingPlayer>()
  const existingBySlug     = new Map<string, ExistingPlayer>()
  for (const p of existingPlayers) {
    existingBySlug.set(p.slug, p)
    const key = `${normalize(extractLastName(p.name))}__${p.teamSlug}`
    existingByLastName.set(key, p)
  }

  // Build our-slug → API-Football team ID from WC 2022 data
  const teamIdBySlug = new Map<string, { id: number; logo: string }>()
  for (const t of wc22Teams) {
    const ourSlug = t.existing_slug ?? t.slug
    teamIdBySlug.set(ourSlug, { id: t.id, logo: t.logo })
  }

  // Hardcoded IDs for teams that are hard to find via search
  const HARDCODED_IDS: Record<string, { id: number; logo: string }> = {
    'bosnia-and-herzegovina': { id: 1542, logo: 'https://media.api-sports.io/football/teams/1542.png' },
    'curacao':                { id: 2564, logo: 'https://media.api-sports.io/football/teams/2564.png' },
    'haiti':                  { id: 493,  logo: 'https://media.api-sports.io/football/teams/493.png'  },
    'dr-congo':               { id: 1524, logo: 'https://media.api-sports.io/football/teams/1524.png' },
  }
  for (const [slug, ref] of Object.entries(HARDCODED_IDS)) {
    if (!teamIdBySlug.has(slug)) teamIdBySlug.set(slug, ref)
  }

  // ── Resolve remaining missing team IDs via API search ────────────────────

  const unmapped = ourTeams.filter((t) => !teamIdBySlug.has(t.slug))
  if (unmapped.length > 0) {
    console.log(`\nResolving ${unmapped.length} unmapped team(s) via API search...`)
    for (const team of unmapped) {
      // Normalize: remove diacritics + non-alphanumeric (API requirement)
      const searchTerm = team.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .trim()

      console.log(`  Searching: ${team.name}`)
      try {
        const results = await client.get<ApiTeamSearchEntry[]>('/teams', {
          search: searchTerm,
        })
        // Prefer national teams with exact name match; fall back gracefully
        const nationals = (results ?? []).filter((r) => r.team.national)
        const match =
          nationals.find((r) => normalize(r.team.name) === normalize(team.name)) ??
          nationals[0] ??
          (results ?? [])[0]

        if (match) {
          teamIdBySlug.set(team.slug, { id: match.team.id, logo: match.team.logo })
          console.log(`    ✓ Found: ${match.team.name} (id=${match.team.id})`)
        } else {
          console.warn(`    ⚠ No match for "${team.name}" — will skip squad fetch`)
        }
      } catch (err) {
        console.warn(`    ⚠ Search failed for "${team.name}": ${err} — skipping`)
      }
    }
  }

  // ── Fetch squads for each team ───────────────────────────────────────────

  const allPlayers: ExistingPlayer[] = []
  const playersByTeam: Record<string, ExistingPlayer[]> = {}
  let totalFetched = 0
  let totalSkipped = 0

  for (let i = 0; i < ourTeams.length; i++) {
    const team = ourTeams[i]
    const apiRef = teamIdBySlug.get(team.slug)

    if (!apiRef) {
      console.warn(`\n[${i + 1}/${ourTeams.length}] SKIP ${team.name} — no API-Football ID`)
      playersByTeam[team.slug] = []
      totalSkipped++
      continue
    }

    console.log(`\n[${i + 1}/${ourTeams.length}] Fetching squad: ${team.name} (id=${apiRef.id})`)

    const squads = await client.get<Array<{ team: unknown; players: ApiSquadPlayer[] }>>(
      '/players/squads',
      { team: String(apiRef.id) },
    )

    const rawPlayers: ApiSquadPlayer[] = squads?.[0]?.players ?? []
    console.log(`  ${rawPlayers.length} players in squad`)

    const teamPlayers: ExistingPlayer[] = []
    const teamCrest = apiRef.logo

    for (const p of rawPlayers) {
      const lastName = extractLastName(p.name)
      const lookupKey = `${normalize(lastName)}__${team.slug}`

      // Try to find the existing player to preserve DOB, nationality, bio, slug
      const existing = existingByLastName.get(lookupKey) ?? existingBySlug.get(toSlug(p.name))

      const nameParts = existing?.name.split(' ') ?? p.name.split(' ')
      const firstName = nameParts[0] ?? ''
      const lastNameFull = nameParts.slice(1).join(' ')

      const synced: ExistingPlayer = {
        id:           p.id,
        slug:         existing?.slug ?? toSlug(p.name),
        name:         existing?.name ?? p.name,
        firstName:    existing?.firstName ?? firstName,
        lastName:     existing?.lastName ?? lastNameFull,
        position:     mapPosition(p.position),
        dateOfBirth:  existing?.dateOfBirth ?? null,
        nationality:  existing?.nationality ?? team.name,  // fallback to team name
        shirtNumber:  p.number && p.number > 0 ? p.number : null,
        marketValue:  existing?.marketValue ?? null,
        photo_url:    p.photo,                             // API-Football photo (always available)
        thumbnail_url: existing?.thumbnail_url ?? null,
        bio:          existing?.bio ?? null,
        teamId:       apiRef.id,
        teamName:     team.name,
        teamSlug:     team.slug,
        teamCrest,
      }

      allPlayers.push(synced)
      teamPlayers.push(synced)
    }

    playersByTeam[team.slug] = teamPlayers
    totalFetched++
  }

  // ── Write output ─────────────────────────────────────────────────────────

  console.log(`\n──────────────────────────────────────────`)
  console.log(`Teams fetched: ${totalFetched} / ${ourTeams.length}`)
  console.log(`Teams skipped: ${totalSkipped}`)
  console.log(`Total players: ${allPlayers.length}`)

  if (dryRun) {
    console.log('\nDRY RUN — skipping file writes.')
    return
  }

  fs.writeFileSync(
    path.join(dataDir, 'players.json'),
    JSON.stringify(allPlayers, null, 2) + '\n',
  )
  console.log(`\n✓ Wrote data/players.json (${allPlayers.length} players)`)

  fs.writeFileSync(
    path.join(dataDir, 'players-by-team.json'),
    JSON.stringify(playersByTeam, null, 2) + '\n',
  )
  console.log(`✓ Wrote data/players-by-team.json (${Object.keys(playersByTeam).length} teams)`)

  // Patch teams.json with updated badge_url from API-Football
  let badgeUpdates = 0
  const patchedTeams = ourTeams.map((team) => {
    const apiRef = teamIdBySlug.get(team.slug)
    if (apiRef && apiRef.logo && team.badge_url !== apiRef.logo) {
      badgeUpdates++
      return { ...team, badge_url: apiRef.logo, logo_url: apiRef.logo }
    }
    return team
  })
  fs.writeFileSync(
    path.join(dataDir, 'teams.json'),
    JSON.stringify(patchedTeams, null, 2) + '\n',
  )
  console.log(`✓ Patched ${badgeUpdates} badge_url(s) in data/teams.json`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
