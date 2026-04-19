import { cache } from 'react'
import { supabase } from '@/lib/supabase'

export interface League {
  id: string
  slug: string
  name: string
  country: string
  flag: string | null
  logo: string
  season: number
  seasonStart: string
  seasonEnd: string
  type: string
  priority: number
}

function mapLeague(r: any): League {
  return {
    id:          r.id,
    slug:        r.slug,
    name:        r.name,
    country:     r.country,
    flag:        r.flag ?? null,
    logo:        r.logo,
    season:      r.season,
    seasonStart: r.season_start ?? '',
    seasonEnd:   r.season_end ?? '',
    type:        r.type,
    priority:    r.priority,
  }
}

export const getAllLeagues = cache(async (): Promise<League[]> => {
  const { data } = await supabase.from('leagues').select('*').order('priority')
  return (data ?? []).map(mapLeague)
})

export const getLeague = cache(async (slug: string): Promise<League | undefined> => {
  const { data } = await supabase.from('leagues').select('*').eq('slug', slug).single()
  return data ? mapLeague(data) : undefined
})

export function formatSeason(league: League): string {
  if (!league.seasonEnd) return String(league.season)
  const endYear = new Date(league.seasonEnd).getFullYear()
  if (endYear === league.season) return String(league.season)
  return `${league.season}/${String(endYear).slice(2)}`
}
