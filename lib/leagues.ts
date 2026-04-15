import leaguesData from '@/data/leagues.json'

export interface League {
  id: number
  slug: string
  name: string
  country: string
  countryCode: string | null
  flag: string | null
  logo: string
  season: number
  seasonStart: string
  seasonEnd: string
  type: string
  current: boolean
  standings: boolean
  topScorers: boolean
  priority: number
}

export const leagues = leaguesData as League[]

export function getAllLeagues(): League[] {
  return leagues.sort((a, b) => a.priority - b.priority)
}

export function getLeague(slug: string): League | undefined {
  return leagues.find((l) => l.slug === slug)
}

/** Format season as "2024/25" or "2022" for cups */
export function formatSeason(league: League): string {
  if (!league.seasonEnd) return String(league.season)
  const endYear = new Date(league.seasonEnd).getFullYear()
  if (endYear === league.season) return String(league.season)
  return `${league.season}/${String(endYear).slice(2)}`
}
