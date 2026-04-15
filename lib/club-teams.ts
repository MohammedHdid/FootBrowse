import fs from 'node:fs'
import path from 'node:path'

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

const dataDir = path.join(process.cwd(), 'data')

// ── Club teams ───────────────────────────────────────────────────────────────

let _clubTeams: ClubTeam[] | null = null

export function getAllClubTeams(): ClubTeam[] {
  if (_clubTeams) return _clubTeams
  const filePath = path.join(dataDir, 'club-teams.json')
  if (!fs.existsSync(filePath)) return []
  _clubTeams = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ClubTeam[]
  return _clubTeams
}

export function getClubTeam(slug: string): ClubTeam | null {
  return getAllClubTeams().find((t) => t.slug === slug) ?? null
}

export function getLeagueClubTeams(leagueSlug: string): ClubTeam[] {
  return getAllClubTeams().filter((t) => t.leagues.includes(leagueSlug))
}

// ── Squads ───────────────────────────────────────────────────────────────────

export function getClubSquad(teamSlug: string): ClubSquad | null {
  const filePath = path.join(dataDir, 'club-squads', `${teamSlug}.json`)
  if (!fs.existsSync(filePath)) return null
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ClubSquad
}

// ── Coaches ──────────────────────────────────────────────────────────────────

export function getCoach(teamSlug: string): Coach | null {
  const filePath = path.join(dataDir, 'coaches', `${teamSlug}.json`)
  if (!fs.existsSync(filePath)) return null
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Coach
}

// ── Position grouping ────────────────────────────────────────────────────────

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
  return POSITION_ORDER.filter((pos) => groups.has(pos)).map((pos) => ({
    position: pos,
    players: groups.get(pos)!.sort((a, b) => (a.number ?? 99) - (b.number ?? 99)),
  }))
}
