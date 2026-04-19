import { supabase } from '@/lib/supabase'

export interface H2HMatch {
  fixture_id: number
  date: string
  league: string
  home_id: number
  home_name: string
  home_logo: string
  away_id: number
  away_name: string
  away_logo: string
  home_score: number | null
  away_score: number | null
}

export interface H2HRecord {
  team1_id: number
  team2_id: number
  fetched_at: string
  played: number
  team1_wins: number
  team2_wins: number
  draws: number
  team1_goals: number
  team2_goals: number
  last_matches: H2HMatch[]
}

export async function getH2H(teamId1: number, teamId2: number): Promise<H2HRecord | null> {
  const t1 = Math.min(teamId1, teamId2)
  const t2 = Math.max(teamId1, teamId2)

  const { data } = await supabase
    .from('h2h')
    .select('*')
    .eq('team1_api_id', t1)
    .eq('team2_api_id', t2)
    .single()

  if (!data) return null

  return {
    team1_id:     (data as any).team1_api_id,
    team2_id:     (data as any).team2_api_id,
    fetched_at:   (data as any).synced_at ?? '',
    played:       (data as any).played ?? 0,
    team1_wins:   (data as any).team1_wins ?? 0,
    team2_wins:   (data as any).team2_wins ?? 0,
    draws:        (data as any).draws ?? 0,
    team1_goals:  (data as any).team1_goals ?? 0,
    team2_goals:  (data as any).team2_goals ?? 0,
    last_matches: (data as any).last_matches ?? [],
  }
}

export async function getH2HForTeams(homeId: number, awayId: number): Promise<{
  played: number
  homeWins: number
  awayWins: number
  draws: number
  homeGoals: number
  awayGoals: number
  lastMatches: H2HMatch[]
} | null> {
  const raw = await getH2H(homeId, awayId)
  if (!raw) return null

  const homeIsTeam1 = Math.min(homeId, awayId) === homeId

  return {
    played:      raw.played,
    homeWins:    homeIsTeam1 ? raw.team1_wins : raw.team2_wins,
    awayWins:    homeIsTeam1 ? raw.team2_wins : raw.team1_wins,
    draws:       raw.draws,
    homeGoals:   homeIsTeam1 ? raw.team1_goals : raw.team2_goals,
    awayGoals:   homeIsTeam1 ? raw.team2_goals : raw.team1_goals,
    lastMatches: raw.last_matches,
  }
}
