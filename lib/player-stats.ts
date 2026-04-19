import { supabase } from '@/lib/supabase'

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
  api_photo: string
  seasons: PlayerSeasonStats[]
}

export async function getPlayerStats(slug: string): Promise<PlayerStats | null> {
  const { data: player } = await supabase
    .from('players')
    .select('id, api_football_id, slug, name, photo')
    .eq('slug', slug)
    .single()

  if (!player) return null

  const { data: stats } = await supabase
    .from('player_stats')
    .select(`
      season, club, goals, assists, appearances, minutes, yellow_cards, red_cards,
      league:leagues!league_id(api_id, name)
    `)
    .eq('player_id', (player as any).id)
    .order('season', { ascending: false })

  return {
    player_id: (player as any).api_football_id ?? 0,
    slug:      (player as any).slug,
    name:      (player as any).name,
    api_photo: (player as any).photo ?? '',
    seasons: (stats ?? []).map((s: any) => ({
      season:       s.season,
      club:         s.club ?? '',
      club_logo:    '',
      league:       s.league?.name ?? '',
      league_id:    s.league?.api_id ?? 0,
      appearances:  s.appearances ?? 0,
      goals:        s.goals ?? 0,
      assists:      s.assists ?? 0,
      minutes:      s.minutes ?? 0,
      yellow_cards: s.yellow_cards ?? 0,
      red_cards:    s.red_cards ?? 0,
    })),
  }
}
