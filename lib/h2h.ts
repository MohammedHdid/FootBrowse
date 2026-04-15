import fs from 'fs'
import path from 'path'

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

export interface H2HRecord {
  team1_id: number
  team2_id: number
  fetched_at: string
  played: number
  /** wins for min(id1,id2) team */
  team1_wins: number
  /** wins for max(id1,id2) team */
  team2_wins: number
  draws: number
  team1_goals: number
  team2_goals: number
  last_matches: H2HMatch[]
}

const H2H_DIR = path.join(process.cwd(), 'data', 'h2h')

function key(id1: number, id2: number): string {
  return `${Math.min(id1, id2)}-${Math.max(id1, id2)}`
}

export function getH2H(teamId1: number, teamId2: number): H2HRecord | null {
  const fp = path.join(H2H_DIR, `${key(teamId1, teamId2)}.json`)
  if (!fs.existsSync(fp)) return null
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf-8')) as H2HRecord
  } catch {
    return null
  }
}

/**
 * Returns H2H stats from the perspective of the given team (homeId).
 * wins/losses/draws are relative to homeId.
 */
export function getH2HForTeams(homeId: number, awayId: number): {
  played: number
  homeWins: number
  awayWins: number
  draws: number
  homeGoals: number
  awayGoals: number
  lastMatches: H2HMatch[]
} | null {
  const raw = getH2H(homeId, awayId)
  if (!raw) return null

  const homeIsTeam1 = Math.min(homeId, awayId) === homeId

  return {
    played:      raw.played,
    homeWins:    homeIsTeam1 ? raw.team1_wins : raw.team2_wins,
    awayWins:    homeIsTeam1 ? raw.team2_wins : raw.team1_wins,
    draws:       raw.draws,
    homeGoals:   homeIsTeam1 ? raw.team1_goals : raw.team2_goals,
    awayGoals:   homeIsTeam1 ? raw.team2_goals : raw.team1_goals,
    lastMatches: raw.last_matches,
  }
}
