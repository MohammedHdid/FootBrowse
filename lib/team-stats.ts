import fs from 'node:fs'
import path from 'node:path'

export interface TeamStats {
  team_slug: string
  league_slug: string
  league_name: string
  league_logo: string
  season: number
  fetched_at: string
  form: string          // full form string e.g. "WWDLWWDW…"
  played: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  clean_sheets: number
  failed_to_score: number
}

export function getTeamStats(teamSlug: string): TeamStats[] {
  const dir = path.join(process.cwd(), 'data', 'team-stats')
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(`${teamSlug}-`) && f.endsWith('.json'))
    .flatMap((f) => {
      try {
        return [JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) as TeamStats]
      } catch {
        return []
      }
    })
}
