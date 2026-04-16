import fs from 'node:fs'
import path from 'node:path'

export interface LineupPlayer {
  id: number
  name: string
  number: number
  pos: string
  grid: string | null
}

export interface TeamLineup {
  team_id: number
  team_name: string
  formation: string
  coach: string | null
  startXI: LineupPlayer[]
  substitutes: LineupPlayer[]
}

export interface MatchLineupData {
  fixture_id: number
  fetched_at: string
  home: TeamLineup
  away: TeamLineup
}

export function getLineup(fixtureId: number): MatchLineupData | null {
  const fp = path.join(process.cwd(), 'data', 'lineups', `${fixtureId}.json`)
  if (!fs.existsSync(fp)) return null
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf-8')) as MatchLineupData
  } catch {
    return null
  }
}
