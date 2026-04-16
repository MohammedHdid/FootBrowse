import fs from 'node:fs'
import path from 'node:path'

export interface MatchEventItem {
  minute: number
  extra: number | null
  team_id: number
  player: string
  assist: string | null
  type: 'Goal' | 'Card' | 'subst' | 'Var'
  detail: string
}

export interface MatchStatGroup {
  team_id: number
  possession: number | null
  shots_on: number | null
  shots_total: number | null
  corners: number | null
  fouls: number | null
  yellow_cards: number | null
  red_cards: number | null
  offsides: number | null
  saves: number | null
  xg: number | null
}

export interface MatchEvents {
  fixture_id: number
  fetched_at: string
  status: string
  score: { home: number | null; away: number | null }
  events: MatchEventItem[]
  home_stats: MatchStatGroup | null
  away_stats: MatchStatGroup | null
}

export function getMatchEvents(fixtureId: number): MatchEvents | null {
  const filePath = path.join(process.cwd(), 'data', 'match-events', `${fixtureId}.json`)
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as MatchEvents
  } catch {
    return null
  }
}
