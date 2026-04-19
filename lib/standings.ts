import { supabase } from '@/lib/supabase'
import type { League } from '@/lib/leagues'

export interface StandingRow {
  rank: number
  team: { id: string; name: string; slug: string; logo: string }
  points: number
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_diff: number
  form: string
  description: string | null
}

export interface StandingsGroup {
  group: string
  table: StandingRow[]
}

export interface StandingsFile {
  league_id: string
  season: number
  groups: StandingsGroup[]
}

export async function getStandings(league: League): Promise<StandingsFile | null> {
  const { data } = await supabase
    .from('standings')
    .select(`
      rank, points, played, won, drawn, lost, goals_for, goals_against, goal_diff, form, description,
      team:teams!team_id(id, name, slug, logo)
    `)
    .eq('league_id', league.id)
    .eq('season', league.season)
    .order('rank', { ascending: true })

  if (!data?.length) return null

  const table: StandingRow[] = data.map((r: any) => ({
    rank:          r.rank,
    team:          { id: r.team?.id ?? '', name: r.team?.name ?? '', slug: r.team?.slug ?? '', logo: r.team?.logo ?? '' },
    points:        r.points,
    played:        r.played,
    won:           r.won,
    drawn:         r.drawn,
    lost:          r.lost,
    goals_for:     r.goals_for,
    goals_against: r.goals_against,
    goal_diff:     r.goal_diff,
    form:          r.form ?? '',
    description:   r.description ?? null,
  }))

  return {
    league_id: league.id,
    season:    league.season,
    groups:    [{ group: 'Overall', table }],
  }
}

export function zoneColor(description: string | null): string | null {
  if (!description) return null
  const d = description.toLowerCase()
  if (d.includes('champions league') || d.includes('promotion') || d.includes('next round') || d.includes('qualified')) return '#00FF87'
  if (d.includes('europa league') || d.includes('conference')) return '#3B82F6'
  if (d.includes('relegation') || d.includes('relegated')) return '#EF4444'
  return null
}
