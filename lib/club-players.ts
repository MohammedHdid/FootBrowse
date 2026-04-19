import { supabase } from '@/lib/supabase'
import type { SyncedPlayer } from './types'

export async function getAllClubPlayers(): Promise<SyncedPlayer[]> {
  const { data } = await supabase
    .from('players')
    .select(`
      api_football_id, slug, name, photo, position, nationality, date_of_birth, shirt_number,
      team:teams!team_id(api_football_id, slug, name, logo, league:leagues!league_id(slug))
    `)

  return (data ?? []).map(mapPlayer)
}

export async function getClubPlayer(slug: string): Promise<SyncedPlayer | undefined> {
  const { data } = await supabase
    .from('players')
    .select(`
      api_football_id, slug, name, photo, position, nationality, date_of_birth, shirt_number,
      team:teams!team_id(api_football_id, slug, name, logo, league:leagues!league_id(slug))
    `)
    .eq('slug', slug)
    .single()

  return data ? mapPlayer(data) : undefined
}

export async function getClubTeamPlayers(teamSlug: string): Promise<SyncedPlayer[]> {
  const { data: team } = await supabase.from('teams').select('id').eq('slug', teamSlug).single()
  if (!team) return []

  const { data } = await supabase
    .from('players')
    .select(`
      api_football_id, slug, name, photo, position, nationality, date_of_birth, shirt_number,
      team:teams!team_id(api_football_id, slug, name, logo, league:leagues!league_id(slug))
    `)
    .eq('team_id', (team as any).id)

  return (data ?? []).map(mapPlayer)
}

function mapPlayer(r: any): SyncedPlayer {
  const t = r.team ?? {}
  return {
    id:               r.api_football_id ?? 0,
    slug:             r.slug ?? '',
    name:             r.name ?? '',
    firstName:        (r.name ?? '').split(' ')[0] ?? '',
    lastName:         (r.name ?? '').split(' ').slice(1).join(' ') ?? '',
    position:         r.position ?? '',
    dateOfBirth:      r.date_of_birth ?? null,
    nationality:      r.nationality ?? '',
    shirtNumber:      r.shirt_number ?? null,
    marketValue:      null,
    photo_url:        r.photo ?? null,
    thumbnail_url:    r.photo ?? null,
    bio:              null,
    teamId:           t.api_football_id ?? 0,
    teamName:         t.name ?? '',
    teamSlug:         t.slug ?? '',
    teamCrest:        t.logo ?? '',
    primaryLeagueSlug: t.league?.slug ?? undefined,
  }
}
