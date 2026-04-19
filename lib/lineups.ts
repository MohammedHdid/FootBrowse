import { supabase } from '@/lib/supabase'

export interface LineupPlayer {
  id: number
  name: string
  number: number
  pos: string
  grid: string | null
}

export interface TeamLineup {
  team_id: number
  team_name: string
  formation: string
  coach: string | null
  startXI: LineupPlayer[]
  substitutes: LineupPlayer[]
}

export interface MatchLineupData {
  fixture_id: number
  fetched_at: string
  home: TeamLineup
  away: TeamLineup
}

export async function getLineup(fixtureId: number): Promise<MatchLineupData | null> {
  const { data: match } = await supabase
    .from('matches')
    .select(`
      id,
      home:teams!home_id(api_football_id, name),
      away:teams!away_id(api_football_id, name)
    `)
    .eq('fixture_id', fixtureId)
    .single()

  if (!match) return null

  const { data: lineups } = await supabase
    .from('lineups')
    .select(`
      formation, start_xi, bench, coach_name,
      team:teams!team_id(api_football_id, name)
    `)
    .eq('match_id', (match as any).id)

  if (!lineups?.length) return null

  const homeApiId = (match as any).home?.api_football_id ?? 0
  const awayApiId = (match as any).away?.api_football_id ?? 0

  const homeLineup = lineups.find((l: any) => l.team?.api_football_id === homeApiId)
  const awayLineup = lineups.find((l: any) => l.team?.api_football_id === awayApiId)

  if (!homeLineup || !awayLineup) return null

  function mapPlayers(arr: any[]): LineupPlayer[] {
    return (arr ?? []).map((p: any) => ({
      id:     p.id ?? 0,
      name:   p.name ?? '',
      number: p.number ?? 0,
      pos:    p.pos ?? '',
      grid:   p.grid ?? null,
    }))
  }

  return {
    fixture_id: fixtureId,
    fetched_at: new Date().toISOString(),
    home: {
      team_id:    homeApiId,
      team_name:  (match as any).home?.name ?? '',
      formation:  homeLineup.formation ?? '',
      coach:      homeLineup.coach_name ?? null,
      startXI:    mapPlayers(homeLineup.start_xi ?? []),
      substitutes: mapPlayers(homeLineup.bench ?? []),
    },
    away: {
      team_id:    awayApiId,
      team_name:  (match as any).away?.name ?? '',
      formation:  awayLineup.formation ?? '',
      coach:      awayLineup.coach_name ?? null,
      startXI:    mapPlayers(awayLineup.start_xi ?? []),
      substitutes: mapPlayers(awayLineup.bench ?? []),
    },
  }
}
