import { supabase } from '@/lib/supabase'
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
  league_id: string
  season: number
  scorers: TopPlayer[]
  assisters: TopPlayer[]
}

function calcAge(dob: string | null): number {
  if (!dob) return 0
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function mapPlayer(r: any, rank: number): TopPlayer {
  const p = r.player ?? {}
  const t = p.team ?? {}
  return {
    rank,
    player_id:   p.api_football_id ?? 0,
    name:        p.name ?? '',
    slug:        p.slug ?? '',
    photo:       p.photo ?? '',
    nationality: p.nationality ?? '',
    age:         calcAge(p.date_of_birth ?? null),
    team:        { id: t.api_football_id ?? 0, name: t.name ?? '', slug: t.slug ?? '', logo: t.logo ?? '' },
    goals:       r.goals ?? 0,
    assists:     r.assists ?? 0,
    appearances: r.appearances ?? 0,
    minutes:     r.minutes ?? 0,
    yellow_cards: r.yellow_cards ?? 0,
    red_cards:   r.red_cards ?? 0,
  }
}

export async function getTopScorers(league: League): Promise<TopScorersFile | null> {
  const { data } = await supabase
    .from('player_stats')
    .select(`
      goals, assists, appearances, minutes, yellow_cards, red_cards,
      player:players!player_id(api_football_id, slug, name, photo, nationality, date_of_birth,
        team:teams!team_id(api_football_id, name, slug, logo)
      )
    `)
    .eq('league_id', league.id)
    .eq('season', league.season)
    .order('goals', { ascending: false })
    .limit(50)

  if (!data?.length) return null

  const scorers = data.map((r, i) => mapPlayer(r, i + 1))
  const assisters = [...data]
    .sort((a, b) => (b.assists ?? 0) - (a.assists ?? 0))
    .map((r, i) => mapPlayer(r, i + 1))

  return { league_id: league.id, season: league.season, scorers, assisters }
}
