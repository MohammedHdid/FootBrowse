import fs from 'node:fs'
import path from 'node:path'

export interface MatchPrediction {
  fixture_id: number
  fetched_at: string
  advice: string
  winner_id: number | null
  winner_name: string | null
  winner_comment: string | null
  percent: { home: string; draw: string; away: string }
  under_over: string | null
  goals_home: string | null
  goals_away: string | null
  comparison: {
    form:  { home: string; away: string }
    att:   { home: string; away: string }
    def:   { home: string; away: string }
    total: { home: string; away: string }
  } | null
}

export function getPrediction(fixtureId: number): MatchPrediction | null {
  const fp = path.join(process.cwd(), 'data', 'predictions', `${fixtureId}.json`)
  if (!fs.existsSync(fp)) return null
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf-8')) as MatchPrediction
  } catch {
    return null
  }
}
