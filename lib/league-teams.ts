import { supabase } from '@/lib/supabase'
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

export async function getLeagueTeams(league: League): Promise<LeagueTeam[]> {
  const { data } = await supabase
    .from('teams')
    .select(`
      api_football_id, slug, name, logo, country, founded, is_national,
      venue:venues!venue_id(api_football_id, name, city, capacity, photo)
    `)
    .eq('league_id', league.id)
    .order('name')

  return (data ?? []).map((r: any) => ({
    id:            r.api_football_id ?? 0,
    name:          r.name,
    slug:          r.slug,
    existing_slug: null,
    logo:          r.logo ?? '',
    country:       r.country ?? '',
    founded:       r.founded ?? null,
    national:      r.is_national ?? false,
    venue: {
      id:       r.venue?.api_football_id ?? null,
      name:     r.venue?.name ?? null,
      city:     r.venue?.city ?? null,
      capacity: r.venue?.capacity ?? null,
      image:    r.venue?.photo ?? null,
    },
  }))
}
