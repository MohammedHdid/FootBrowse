import fs from 'node:fs'
import path from 'node:path'
import type { League } from '@/lib/leagues'

export interface TopPlayer {
  rank: number
  player_id: number
  name: string
  slug: string
  photo: string
  nationality: string
  age: number
  team: { id: number; name: string; slug: string; logo: string }
  goals: number
  assists: number
  appearances: number
  minutes: number
  yellow_cards: number
  red_cards: number
}

export interface TopScorersFile {
  league_id: number
  season: number
  scorers: TopPlayer[]
  assisters: TopPlayer[]
}

export function getTopScorers(league: League): TopScorersFile | null {
  const filePath = path.join(
    process.cwd(), 'data', 'topscorers', `${league.slug}-${league.season}.json`
  )
  if (!fs.existsSync(filePath)) return null
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as TopScorersFile
}
