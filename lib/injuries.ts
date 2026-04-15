import fs from 'fs'
import path from 'path'

export interface InjuryRecord {
  player_id: number
  player_name: string
  player_photo: string | null
  type: string      // "Injured" | "Suspended" | "Missing Fixture"
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

const INJURIES_DIR = path.join(process.cwd(), 'data', 'injuries')

function loadInjuriesFile(leagueSlug: string): InjuriesFile | null {
  const filePath = path.join(INJURIES_DIR, `${leagueSlug}.json`)
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as InjuriesFile
  } catch {
    return null
  }
}

/** All injuries for a league */
export function getLeagueInjuries(leagueSlug: string): InjuryRecord[] {
  return loadInjuriesFile(leagueSlug)?.injuries ?? []
}

/** Injuries for a specific team within a league */
export function getTeamInjuries(leagueSlug: string, teamId: number): InjuryRecord[] {
  return getLeagueInjuries(leagueSlug).filter((r) => r.team_id === teamId)
}

/** Injuries for a specific team by slug within a league */
export function getTeamInjuriesBySlug(leagueSlug: string, teamSlug: string): InjuryRecord[] {
  return getLeagueInjuries(leagueSlug).filter((r) => r.team_slug === teamSlug)
}

/**
 * Deduped injuries for a team scoped to the current/upcoming gameweek.
 *
 * The /injuries endpoint returns every injury for every fixture in the season,
 * including historical ones. We only want players who are out for an upcoming
 * fixture (or a fixture played in the last 3 days, to cover the current round).
 *
 * Strategy:
 * 1. Keep only records where fixture_date >= (now - 3 days)
 * 2. Deduplicate by player_id, keeping the nearest-future fixture
 * 3. Sort alphabetically by name
 */
export function getUniqueTeamInjuries(leagueSlug: string, teamSlug: string): InjuryRecord[] {
  const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000 // 3 days ago

  const recent = getTeamInjuriesBySlug(leagueSlug, teamSlug).filter(
    (r) => new Date(r.fixture_date).getTime() >= cutoff,
  )

  // Keep the soonest upcoming fixture per player
  const seen = new Map<number, InjuryRecord>()
  for (const r of recent) {
    const existing = seen.get(r.player_id)
    if (!existing || r.fixture_date < existing.fixture_date) {
      seen.set(r.player_id, r)
    }
  }

  return Array.from(seen.values()).sort((a, b) =>
    (a.player_name ?? '').localeCompare(b.player_name ?? ''),
  )
}
