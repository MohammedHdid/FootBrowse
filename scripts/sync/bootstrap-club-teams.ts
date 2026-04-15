/**
 * scripts/sync/bootstrap-club-teams.ts
 *
 * One-time bootstrap script (safe to re-run — skips already-cached files).
 *
 * For each unique club team across all priority leagues:
 *   1. GET /players/squads?team={id}   → data/club-squads/{slug}.json
 *   2. GET /coachs?team={id}           → data/coaches/{slug}.json
 *
 * Also writes data/club-teams.json — the master list of all unique club teams
 * with their league affiliations and primary league slug.
 *
 * Unique teams: 127 (deduped across PL/La Liga/Bundesliga/UCL)
 * API calls: up to 254 total (2 per unique team), skipped if cache exists.
 *
 * Usage:
 *   npx tsx scripts/sync/bootstrap-club-teams.ts
 *   npx tsx scripts/sync/bootstrap-club-teams.ts --dry-run
 *   npx tsx scripts/sync/bootstrap-club-teams.ts --skip-existing   (default: true)
 *   npx tsx scripts/sync/bootstrap-club-teams.ts --force           (re-fetch all)
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

interface LeagueTeamEntry {
  id: number
  name: string
  slug: string
  existing_slug: string | null
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

export interface ClubTeam {
  id: number
  name: string
  slug: string
  logo: string
  country: string
  founded: number | null
  venue: {
    id: number | null
    name: string | null
    city: string | null
    capacity: number | null
    image: string | null
  }
  primary_league_slug: string
  leagues: string[]  // all leagues this team appears in
}

export interface ClubPlayer {
  id: number
  name: string
  age: number
  number: number | null
  position: string
  photo: string
}

export interface ClubSquad {
  team_id: number
  team_slug: string
  team_name: string
  fetched_at: string
  players: ClubPlayer[]
}

export interface Coach {
  id: number | null
  name: string
  photo: string | null
  nationality: string | null
  age: number | null
  team_id: number
  team_slug: string
  fetched_at: string
  career: Array<{
    team_id: number
    team_name: string
    team_logo: string
    start: string | null
    end: string | null
  }>
}

interface ApiSquadResponse {
  team: { id: number; name: string; logo: string }
  players: Array<{
    id: number
    name: string
    age: number
    number: number | null
    position: string
    photo: string
  }>
}

interface ApiCoachResponse {
  id: number
  name: string
  firstname: string | null
  lastname: string | null
  age: number | null
  nationality: string | null
  photo: string | null
  career: Array<{
    team: { id: number; name: string; logo: string }
    start: string | null
    end: string | null
  }>
}

// ---------------------------------------------------------------------------
// Priority order for primary league assignment
// Domestic leagues take priority over cup competitions
// ---------------------------------------------------------------------------

const LEAGUE_PRIORITY: Record<string, number> = {
  'premier-league':         1,
  'la-liga':                2,
  'bundesliga':             3,
  'serie-a':                4,
  'ligue-1':                5,
  'uefa-champions-league':  10,
  'uefa-europa-league':     11,
}

const LEAGUE_FILES: Array<{ slug: string; season: number }> = [
  { slug: 'premier-league',        season: 2025 },
  { slug: 'la-liga',               season: 2025 },
  { slug: 'bundesliga',            season: 2025 },
  { slug: 'uefa-champions-league', season: 2025 },
]

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const apiKey = process.env.API_FOOTBALL_KEY ?? ''
  if (!apiKey) {
    console.error('ERROR: API_FOOTBALL_KEY not set in .env.local')
    process.exit(1)
  }

  const dryRun  = process.argv.includes('--dry-run')
  const force   = process.argv.includes('--force')
  if (dryRun) console.log('DRY RUN — no files will be written\n')
  if (force)  console.log('FORCE mode — re-fetching all teams\n')

  const dataDir      = path.resolve(process.cwd(), 'data')
  const squadsDir    = path.join(dataDir, 'club-squads')
  const coachesDir   = path.join(dataDir, 'coaches')

  if (!dryRun) {
    fs.mkdirSync(squadsDir,  { recursive: true })
    fs.mkdirSync(coachesDir, { recursive: true })
  }

  const client = createApiClient(apiKey)

  // ── Build deduplicated team list ──────────────────────────────────────────

  const teamMap = new Map<number, ClubTeam>()

  for (const { slug: leagueSlug, season } of LEAGUE_FILES) {
    const filePath = path.join(dataDir, 'teams-by-league', `${leagueSlug}-${season}.json`)
    if (!fs.existsSync(filePath)) {
      console.warn(`WARNING: ${filePath} not found — skipping`)
      continue
    }
    const teams: LeagueTeamEntry[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    for (const t of teams) {
      if (t.national) continue  // skip national teams (WC, etc.)
      if (teamMap.has(t.id)) {
        teamMap.get(t.id)!.leagues.push(leagueSlug)
      } else {
        teamMap.set(t.id, {
          id:                t.id,
          name:              t.name,
          slug:              t.slug,
          logo:              t.logo,
          country:           t.country,
          founded:           t.founded,
          venue:             t.venue,
          primary_league_slug: leagueSlug,
          leagues:           [leagueSlug],
        })
      }
    }
  }

  // Assign primary_league_slug based on priority order
  for (const team of Array.from(teamMap.values())) {
    let bestPriority = Infinity
    let bestLeague = team.leagues[0]
    for (const lg of team.leagues) {
      const p = LEAGUE_PRIORITY[lg] ?? 99
      if (p < bestPriority) {
        bestPriority = p
        bestLeague = lg
      }
    }
    team.primary_league_slug = bestLeague
  }

  const allTeams = Array.from(teamMap.values()).sort((a, b) =>
    a.primary_league_slug.localeCompare(b.primary_league_slug) || a.name.localeCompare(b.name)
  )

  console.log(`\nFound ${allTeams.length} unique club teams across ${LEAGUE_FILES.length} leagues`)

  // ── Write club-teams.json ─────────────────────────────────────────────────

  if (!dryRun) {
    fs.writeFileSync(
      path.join(dataDir, 'club-teams.json'),
      JSON.stringify(allTeams, null, 2) + '\n',
    )
    console.log(`✓ Wrote data/club-teams.json (${allTeams.length} teams)`)
  }

  if (dryRun) {
    console.log('\nDRY RUN — showing plan:')
    for (const t of allTeams) {
      const squadExists  = fs.existsSync(path.join(squadsDir,  `${t.slug}.json`))
      const coachExists  = fs.existsSync(path.join(coachesDir, `${t.slug}.json`))
      const squadAction  = (force || !squadExists)  ? 'FETCH' : 'SKIP (cached)'
      const coachAction  = (force || !coachExists)  ? 'FETCH' : 'SKIP (cached)'
      console.log(`  ${t.name.padEnd(30)} squad=${squadAction}  coach=${coachAction}`)
    }
    return
  }

  // ── Fetch squads + coaches ────────────────────────────────────────────────

  let squadFetched = 0, squadSkipped = 0
  let coachFetched = 0, coachSkipped = 0

  for (let i = 0; i < allTeams.length; i++) {
    const team = allTeams[i]
    const prefix = `[${i + 1}/${allTeams.length}] ${team.name} (id=${team.id})`

    // ── Squad ────────────────────────────────────────────────────────────────
    const squadFile = path.join(squadsDir, `${team.slug}.json`)
    if (!force && fs.existsSync(squadFile)) {
      console.log(`${prefix} — squad: CACHED`)
      squadSkipped++
    } else {
      console.log(`${prefix} — fetching squad...`)
      try {
        const raw = await client.get<ApiSquadResponse[]>('/players/squads', { team: String(team.id) })
        const players: ClubPlayer[] = (raw?.[0]?.players ?? []).map((p) => ({
          id:       p.id,
          name:     p.name,
          age:      p.age,
          number:   p.number && p.number > 0 ? p.number : null,
          position: p.position,
          photo:    p.photo,
        }))
        const squad: ClubSquad = {
          team_id:    team.id,
          team_slug:  team.slug,
          team_name:  team.name,
          fetched_at: new Date().toISOString(),
          players,
        }
        fs.writeFileSync(squadFile, JSON.stringify(squad, null, 2) + '\n')
        console.log(`  ✓ Squad: ${players.length} players`)
        squadFetched++
      } catch (err) {
        console.warn(`  ⚠ Squad fetch failed: ${err}`)
      }
    }

    // ── Coach ────────────────────────────────────────────────────────────────
    const coachFile = path.join(coachesDir, `${team.slug}.json`)
    if (!force && fs.existsSync(coachFile)) {
      console.log(`${prefix} — coach: CACHED`)
      coachSkipped++
    } else {
      console.log(`${prefix} — fetching coach...`)
      try {
        const raw = await client.get<ApiCoachResponse[]>('/coachs', { team: String(team.id) })
        const c = raw?.[0]
        const coach: Coach = {
          id:          c?.id ?? null,
          name:        c?.name ?? 'Unknown',
          photo:       c?.photo ?? null,
          nationality: c?.nationality ?? null,
          age:         c?.age ?? null,
          team_id:     team.id,
          team_slug:   team.slug,
          fetched_at:  new Date().toISOString(),
          career:      (c?.career ?? []).map((entry) => ({
            team_id:   entry.team.id,
            team_name: entry.team.name,
            team_logo: entry.team.logo,
            start:     entry.start,
            end:       entry.end,
          })),
        }
        fs.writeFileSync(coachFile, JSON.stringify(coach, null, 2) + '\n')
        console.log(`  ✓ Coach: ${coach.name}`)
        coachFetched++
      } catch (err) {
        console.warn(`  ⚠ Coach fetch failed: ${err}`)
      }
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log(`\n──────────────────────────────────────────`)
  console.log(`Total unique clubs: ${allTeams.length}`)
  console.log(`Squads  — fetched: ${squadFetched}, skipped: ${squadSkipped}`)
  console.log(`Coaches — fetched: ${coachFetched}, skipped: ${coachSkipped}`)
  console.log(`API calls used: ~${(squadFetched + coachFetched)}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
