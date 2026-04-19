import { supabase } from '@/lib/supabase'

export interface InjuryRecord {
  player_id: number
  player_name: string
  player_photo: string | null
  type: string
  reason: string | null
  team_id: number
  team_name: string
  team_logo: string
  team_slug: string
  fixture_id: number
  fixture_date: string
}

export async function getLeagueInjuries(leagueSlug: string): Promise<InjuryRecord[]> {
  const { data: league } = await supabase
    .from('leagues')
    .select('id')
    .eq('slug', leagueSlug)
    .single()

  if (!league) return []

  const { data } = await supabase
    .from('injuries')
    .select(`
      player_api_id, player_name, type, reason, fixture_date,
      team:teams!team_id(api_football_id, name, logo, slug),
      match:matches!match_id(fixture_id, date)
    `)
    .eq('league_id', (league as any).id)

  return (data ?? []).map((r: any) => ({
    player_id:    r.player_api_id ?? 0,
    player_name:  r.player_name ?? '',
    player_photo: null,
    type:         r.type ?? '',
    reason:       r.reason ?? null,
    team_id:      r.team?.api_football_id ?? 0,
    team_name:    r.team?.name ?? '',
    team_logo:    r.team?.logo ?? '',
    team_slug:    r.team?.slug ?? '',
    fixture_id:   r.match?.fixture_id ?? 0,
    fixture_date: r.fixture_date ?? r.match?.date ?? '',
  }))
}

export async function getUniqueTeamInjuries(leagueSlug: string, teamSlug: string): Promise<InjuryRecord[]> {
  const { data: league } = await supabase.from('leagues').select('id').eq('slug', leagueSlug).single()
  const { data: team }   = await supabase.from('teams').select('id').eq('slug', teamSlug).single()

  if (!league || !team) return []

  const { data } = await supabase
    .from('injuries')
    .select(`
      player_api_id, player_name, type, reason, fixture_date,
      team:teams!team_id(api_football_id, name, logo, slug),
      match:matches!match_id(fixture_id, date)
    `)
    .eq('league_id', (league as any).id)
    .eq('team_id', (team as any).id)

  const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000
  const records: InjuryRecord[] = (data ?? []).map((r: any) => ({
    player_id:    r.player_api_id ?? 0,
    player_name:  r.player_name ?? '',
    player_photo: null,
    type:         r.type ?? '',
    reason:       r.reason ?? null,
    team_id:      r.team?.api_football_id ?? 0,
    team_name:    r.team?.name ?? '',
    team_logo:    r.team?.logo ?? '',
    team_slug:    r.team?.slug ?? '',
    fixture_id:   r.match?.fixture_id ?? 0,
    fixture_date: r.fixture_date ?? r.match?.date ?? '',
  }))

  const recent = records.filter((r) => !r.fixture_date || new Date(r.fixture_date).getTime() >= cutoff)

  const seen = new Map<number, InjuryRecord>()
  for (const r of recent) {
    const existing = seen.get(r.player_id)
    if (!existing || r.fixture_date < existing.fixture_date) seen.set(r.player_id, r)
  }

  const uniqueRecords = Array.from(seen.values()).sort((a, b) => a.player_name.localeCompare(b.player_name))

  if (uniqueRecords.length > 0) {
    const playerApiIds = uniqueRecords.map(r => r.player_id)
    const { data: players } = await supabase.from('players').select('api_football_id, photo').in('api_football_id', playerApiIds)
    const photoMap = new Map((players || []).map((p: any) => [p.api_football_id, p.photo]))
    for (const r of uniqueRecords) {
      r.player_photo = photoMap.get(r.player_id) || null
    }
  }

  return uniqueRecords
}
