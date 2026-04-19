import { supabase } from '@/lib/supabase'

export interface ClubTeam {
  id: number
  name: string
  slug: string
  logo: string
  country: string
  founded: number | null
  venue: {
    id: number | null
    name: string | null
    city: string | null
    capacity: number | null
    image: string | null
  }
  primary_league_slug: string
  leagues: string[]
}

export interface ClubPlayer {
  id: number
  name: string
  age: number
  number: number | null
  position: string
  photo: string
}

export interface ClubSquad {
  team_id: number
  team_slug: string
  team_name: string
  fetched_at: string
  players: ClubPlayer[]
}

export interface Coach {
  id: number | null
  name: string
  photo: string | null
  nationality: string | null
  age: number | null
  team_id: number
  team_slug: string
  fetched_at: string
  career: Array<{
    team_id: number
    team_name: string
    team_logo: string
    start: string | null
    end: string | null
  }>
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

export async function getAllClubTeams(): Promise<ClubTeam[]> {
  const { data } = await supabase
    .from('teams')
    .select(`
      api_football_id, slug, name, logo, country, founded,
      venue:venues!venue_id(api_football_id, name, city, capacity, photo),
      league:leagues!league_id(slug)
    `)
    .eq('is_national', false)
    .order('name')

  return (data ?? []).map((r: any) => ({
    id:                  r.api_football_id ?? 0,
    name:                r.name,
    slug:                r.slug,
    logo:                r.logo ?? '',
    country:             r.country ?? '',
    founded:             r.founded ?? null,
    venue: {
      id:       r.venue?.api_football_id ?? null,
      name:     r.venue?.name ?? null,
      city:     r.venue?.city ?? null,
      capacity: r.venue?.capacity ?? null,
      image:    r.venue?.photo ?? null,
    },
    primary_league_slug: r.league?.slug ?? '',
    leagues:             r.league?.slug ? [r.league.slug] : [],
  }))
}

export async function getClubTeam(slug: string): Promise<ClubTeam | null> {
  const { data } = await supabase
    .from('teams')
    .select(`
      api_football_id, slug, name, logo, country, founded,
      venue:venues!venue_id(api_football_id, name, city, capacity, photo),
      league:leagues!league_id(slug)
    `)
    .eq('slug', slug)
    .eq('is_national', false)
    .single()

  if (!data) return null

  return {
    id:                  (data as any).api_football_id ?? 0,
    name:                (data as any).name,
    slug:                (data as any).slug,
    logo:                (data as any).logo ?? '',
    country:             (data as any).country ?? '',
    founded:             (data as any).founded ?? null,
    venue: {
      id:       (data as any).venue?.api_football_id ?? null,
      name:     (data as any).venue?.name ?? null,
      city:     (data as any).venue?.city ?? null,
      capacity: (data as any).venue?.capacity ?? null,
      image:    (data as any).venue?.photo ?? null,
    },
    primary_league_slug: (data as any).league?.slug ?? '',
    leagues:             (data as any).league?.slug ? [(data as any).league.slug] : [],
  }
}

export async function getLeagueClubTeams(leagueSlug: string): Promise<ClubTeam[]> {
  const teams = await getAllClubTeams()
  return teams.filter((t) => t.leagues.includes(leagueSlug))
}

export async function getClubSquad(teamSlug: string): Promise<ClubSquad | null> {
  const { data: team } = await supabase
    .from('teams')
    .select('id, api_football_id, name')
    .eq('slug', teamSlug)
    .single()

  if (!team) return null

  const { data: players } = await supabase
    .from('players')
    .select('api_football_id, name, date_of_birth, shirt_number, position, photo')
    .eq('team_id', (team as any).id)
    .order('position')

  return {
    team_id:    (team as any).api_football_id ?? 0,
    team_slug:  teamSlug,
    team_name:  (team as any).name,
    fetched_at: new Date().toISOString(),
    players: (players ?? []).map((p: any) => ({
      id:       p.api_football_id ?? 0,
      name:     p.name,
      age:      calcAge(p.date_of_birth ?? null),
      number:   p.shirt_number ?? null,
      position: p.position ?? '',
      photo:    p.photo ?? '',
    })),
  }
}

export async function getCoach(teamSlug: string): Promise<Coach | null> {
  const { data: team } = await supabase
    .from('teams')
    .select('id, api_football_id, slug')
    .eq('slug', teamSlug)
    .single()

  if (!team) return null

  const { data } = await supabase
    .from('coaches')
    .select('*')
    .eq('team_id', (team as any).id)
    .single()

  if (!data) return null

  const rawCareer: any[] = (data as any).career ?? []
  const career = rawCareer.map((c: any) => ({
    team_id:   c.team?.id ?? 0,
    team_name: c.team?.name ?? '',
    team_logo: c.team?.logo ?? '',
    start:     c.start ?? null,
    end:       c.end ?? null,
  }))

  return {
    id:          (data as any).api_football_id ?? null,
    name:        (data as any).name,
    photo:       (data as any).photo ?? null,
    nationality: (data as any).nationality ?? null,
    age:         (data as any).age ?? null,
    team_id:     (team as any).api_football_id ?? 0,
    team_slug:   teamSlug,
    fetched_at:  (data as any).synced_at ?? new Date().toISOString(),
    career,
  }
}

const POSITION_ORDER = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Attacker']

export function groupByPosition(players: ClubPlayer[]): Array<{
  position: string
  players: ClubPlayer[]
}> {
  const groups = new Map<string, ClubPlayer[]>()
  for (const p of players) {
    const pos = p.position === 'Attacker' ? 'Forward' : p.position
    if (!groups.has(pos)) groups.set(pos, [])
    groups.get(pos)!.push(p)
  }
  return POSITION_ORDER
    .filter((pos) => groups.has(pos))
    .map((pos) => ({
      position: pos,
      players: groups.get(pos)!.sort((a, b) => (a.number ?? 99) - (b.number ?? 99)),
    }))
}
