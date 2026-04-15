import fs from 'node:fs'
import path from 'node:path'
import type { League } from '@/lib/leagues'

export interface LeagueTeam {
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

export function getLeagueTeams(league: League): LeagueTeam[] {
  const filePath = path.join(
    process.cwd(), 'data', 'teams-by-league', `${league.slug}-${league.season}.json`
  )
  if (!fs.existsSync(filePath)) return []
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as LeagueTeam[]
}
