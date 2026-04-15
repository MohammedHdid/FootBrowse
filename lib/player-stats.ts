import fs from 'node:fs'
import path from 'node:path'

export interface PlayerSeasonStats {
  season: number
  club: string
  club_logo: string
  league: string
  league_id: number
  appearances: number
  goals: number
  assists: number
  minutes: number
  yellow_cards: number
  red_cards: number
}

export interface PlayerStats {
  player_id: number
  slug: string
  name: string
  api_photo: string       // API-Football CDN photo URL
  seasons: PlayerSeasonStats[]
}

export function getPlayerStats(slug: string): PlayerStats | null {
  const filePath = path.join(process.cwd(), 'data', 'player-stats', `${slug}.json`)
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as PlayerStats
  } catch {
    return null
  }
}
