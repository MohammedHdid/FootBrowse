/**
 * Date-range fixture loader
 *
 * Reads all league fixture JSON files and returns fixtures grouped by
 * date → league for a window around today. Used by the homepage date nav.
 *
 * Server-only — uses fs directly.
 */

import fs from 'fs'
import path from 'path'
import { getAllLeagues } from './leagues'

export interface DateFixtureEntry {
  fixture_id: number
  slug: string
  kickoff_utc: string
  status: string
  score: { home: number | null; away: number | null }
  home_team: { name: string; logo: string; slug: string }
  away_team: { name: string; logo: string; slug: string }
}

export interface DateLeagueGroup {
  leagueSlug: string
  leagueName: string
  leagueLogo: string
  fixtures: DateFixtureEntry[]
}

export interface DayFixtures {
  date: string // YYYY-MM-DD
  leagues: DateLeagueGroup[]
}

// Shift a Date by N days and return YYYY-MM-DD string
function addDays(base: Date, n: number): string {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

/**
 * Returns fixture data for the range [today - backDays … today + forwardDays].
 * Each item covers one calendar date with its league groups.
 */
export function getFixturesByDateRange(backDays = 3, forwardDays = 7): DayFixtures[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Build ordered date list
  const dates: string[] = []
  for (let i = -backDays; i <= forwardDays; i++) {
    dates.push(addDays(today, i))
  }

  const dateSet = new Set(dates)
  // date → leagueSlug → group
  const byDate: Record<string, Record<string, DateLeagueGroup>> = {}
  for (const d of dates) byDate[d] = {}

  const DATA_DIR = path.join(process.cwd(), 'data')
  const leagues = getAllLeagues()

  for (const league of leagues) {
    if (league.slug === 'world-cup') continue
    const fp = path.join(DATA_DIR, 'fixtures', `${league.slug}-${league.season}.json`)
    if (!fs.existsSync(fp)) continue

    const fixtures = JSON.parse(fs.readFileSync(fp, 'utf-8')) as Array<{
      fixture_id: number
      slug: string
      date: string
      kickoff_utc: string
      status: string
      score: { home: number | null; away: number | null }
      home_team: { id: number; name: string; slug: string; logo: string }
      away_team: { id: number; name: string; slug: string; logo: string }
    }>

    for (const f of fixtures) {
      if (!dateSet.has(f.date)) continue
      if (!byDate[f.date][league.slug]) {
        byDate[f.date][league.slug] = {
          leagueSlug: league.slug,
          leagueName: league.name,
          leagueLogo: league.logo,
          fixtures: [],
        }
      }
      byDate[f.date][league.slug].fixtures.push({
        fixture_id: f.fixture_id,
        slug: f.slug,
        kickoff_utc: f.kickoff_utc,
        status: f.status,
        score: f.score,
        home_team: { name: f.home_team.name, logo: f.home_team.logo, slug: f.home_team.slug },
        away_team: { name: f.away_team.name, logo: f.away_team.logo, slug: f.away_team.slug },
      })
    }
  }

  // Sort fixtures within each league group by kickoff time
  return dates.map((date) => {
    const leagues = Object.values(byDate[date]).map((g) => ({
      ...g,
      fixtures: g.fixtures.sort((a, b) => a.kickoff_utc.localeCompare(b.kickoff_utc)),
    }))
    return { date, leagues }
  })
}
