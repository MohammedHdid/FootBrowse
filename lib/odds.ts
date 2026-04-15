import fs from 'node:fs'
import path from 'node:path'

export interface MatchOdds {
  fixture_id: number
  fetched_at: string
  bookmaker_id: number
  bookmaker_name: string
  home_win: number
  draw: number
  away_win: number
}

export function getMatchOdds(fixtureId: number): MatchOdds | null {
  const fp = path.join(process.cwd(), 'data', 'odds', `${fixtureId}.json`)
  if (!fs.existsSync(fp)) return null
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf-8')) as MatchOdds
  } catch {
    return null
  }
}
