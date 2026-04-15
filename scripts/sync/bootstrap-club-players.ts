/**
 * TASK 16 — Bootstrap Club Players
 *
 * Reads all data/club-squads/*.json files, deduplicates by player ID,
 * skips players already in data/players.json (WC national team players),
 * and writes data/club-players.json with SyncedPlayer-compatible records.
 *
 * Usage: npx tsx scripts/sync/bootstrap-club-players.ts
 */

import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.join(process.cwd(), 'data')

interface SquadPlayer {
  id: number
  name: string
  age: number
  number: number | null
  position: string
  photo: string
}

interface ClubSquad {
  team_id: number
  team_slug: string
  team_name: string
  fetched_at: string
  players: SquadPlayer[]
}

interface ClubTeam {
  id: number
  name: string
  slug: string
  logo: string
  country: string
  founded: number | null
  venue: { id: number | null; name: string | null; city: string | null; capacity: number | null; image: string | null }
  primary_league_slug: string
  leagues: string[]
}

/** ClubPlayerRecord extends the SyncedPlayer shape with primaryLeagueSlug */
interface ClubPlayerRecord {
  id: number
  slug: string
  name: string
  firstName: string
  lastName: string
  position: string
  dateOfBirth: null
  nationality: string
  shirtNumber: number | null
  marketValue: null
  photo_url: string
  thumbnail_url: null
  bio: null
  teamId: number
  teamName: string
  teamSlug: string
  teamCrest: string
  primaryLeagueSlug: string
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9\s]/g, '')     // strip non-alphanumeric
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  const firstName = parts.slice(0, -1).join(' ')
  const lastName = parts[parts.length - 1]
  return { firstName, lastName }
}

async function main() {
  // Load existing WC players to skip duplicates by ID
  const wcPlayersPath = path.join(DATA_DIR, 'players.json')
  const wcPlayers: Array<{ id: number; slug: string }> = JSON.parse(
    fs.readFileSync(wcPlayersPath, 'utf-8')
  )
  const existingIds = new Set(wcPlayers.map((p) => p.id))
  const existingSlugs = new Set(wcPlayers.map((p) => p.slug))
  console.log(`Loaded ${wcPlayers.length} existing WC players`)

  // Load club teams for logo + primaryLeagueSlug lookup
  const clubTeamsPath = path.join(DATA_DIR, 'club-teams.json')
  const clubTeams: ClubTeam[] = JSON.parse(fs.readFileSync(clubTeamsPath, 'utf-8'))
  const clubTeamMap = new Map<string, ClubTeam>()
  for (const t of clubTeams) clubTeamMap.set(t.slug, t)
  console.log(`Loaded ${clubTeams.length} club teams`)

  // Read all squad files
  const squadDir = path.join(DATA_DIR, 'club-squads')
  const squadFiles = fs.readdirSync(squadDir).filter((f) => f.endsWith('.json'))
  console.log(`Reading ${squadFiles.length} squad files…`)

  const seenIds = new Set<number>()
  const usedSlugs = new Set<string>(existingSlugs)
  const clubPlayers: ClubPlayerRecord[] = []
  let skippedWc = 0
  let skippedDupe = 0

  for (const file of squadFiles) {
    const squad: ClubSquad = JSON.parse(
      fs.readFileSync(path.join(squadDir, file), 'utf-8')
    )
    const clubTeam = clubTeamMap.get(squad.team_slug)
    if (!clubTeam) {
      console.warn(`  ⚠ No club-team entry for squad: ${squad.team_slug}`)
      continue
    }

    for (const p of squad.players) {
      // Skip players already in WC players.json
      if (existingIds.has(p.id)) {
        skippedWc++
        continue
      }
      // Skip duplicates (player appears in UCL + domestic squad for same club)
      if (seenIds.has(p.id)) {
        skippedDupe++
        continue
      }
      seenIds.add(p.id)

      // Generate unique slug
      let slug = toSlug(p.name)
      if (!slug) slug = `player-${p.id}`
      if (usedSlugs.has(slug)) {
        // Disambiguate with team slug
        const candidate = `${slug}-${squad.team_slug}`
        slug = usedSlugs.has(candidate) ? `${slug}-${p.id}` : candidate
      }
      usedSlugs.add(slug)

      const { firstName, lastName } = splitName(p.name)

      clubPlayers.push({
        id: p.id,
        slug,
        name: p.name,
        firstName,
        lastName,
        position: p.position,
        dateOfBirth: null,
        nationality: '',
        shirtNumber: p.number ?? null,
        marketValue: null,
        photo_url: p.photo,
        thumbnail_url: null,
        bio: null,
        teamId: clubTeam.id,
        teamName: clubTeam.name,
        teamSlug: clubTeam.slug,
        teamCrest: clubTeam.logo,
        primaryLeagueSlug: clubTeam.primary_league_slug,
      })
    }
  }

  // Sort by name for deterministic output
  clubPlayers.sort((a, b) => a.name.localeCompare(b.name))

  const outPath = path.join(DATA_DIR, 'club-players.json')
  fs.writeFileSync(outPath, JSON.stringify(clubPlayers, null, 2))

  console.log(`\n✅ Done`)
  console.log(`   Skipped (WC overlap): ${skippedWc}`)
  console.log(`   Skipped (duplicates): ${skippedDupe}`)
  console.log(`   New club players:     ${clubPlayers.length}`)
  console.log(`   Output: data/club-players.json`)
  console.log(`\n   Total player pages: ${wcPlayers.length + clubPlayers.length}`)
}

main().catch((err) => { console.error(err); process.exit(1) })
