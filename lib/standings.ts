import fs from 'node:fs'
import path from 'node:path'
import type { League } from '@/lib/leagues'

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

export function getStandings(league: League): StandingsFile | null {
  const filePath = path.join(
    process.cwd(), 'data', 'standings', `${league.slug}-${league.season}.json`
  )
  if (!fs.existsSync(filePath)) return null
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as StandingsFile
}

/**
 * Determine the highlight zone colour for a table row based on description text.
 * Returns a CSS colour string or null.
 */
export function zoneColor(description: string | null): string | null {
  if (!description) return null
  const d = description.toLowerCase()
  if (d.includes('champions league') || d.includes('promotion') || d.includes('next round') || d.includes('qualified')) return '#00FF87'
  if (d.includes('europa league') || d.includes('conference')) return '#3B82F6'
  if (d.includes('relegation') || d.includes('relegated')) return '#EF4444'
  return null
}
