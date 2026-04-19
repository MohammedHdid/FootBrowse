import { supabase } from '@/lib/supabase'

export interface DateFixtureEntry {
  fixture_id: number
  slug: string
  kickoff_utc: string
  status: string
  elapsed: number | null
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
  date: string
  leagues: DateLeagueGroup[]
}

function addDays(base: Date, n: number): string {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

export async function getFixturesByDateRange(backDays = 3, forwardDays = 7): Promise<DayFixtures[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const startDate = addDays(today, -backDays)
  const endDate   = addDays(today, forwardDays)

  const { data } = await supabase
    .from('matches')
    .select(`
      fixture_id, slug, date, kickoff_utc, status, elapsed, score_home, score_away,
      home_team:teams!home_id(name, logo, slug),
      away_team:teams!away_id(name, logo, slug),
      league:leagues!league_id(slug, name, logo)
    `)
    .gte('date', startDate)
    .lte('date', endDate)
    .not('league_id', 'is', null)
    .order('date', { ascending: true })
    .order('kickoff_utc', { ascending: true })

  const dates: string[] = []
  for (let i = -backDays; i <= forwardDays; i++) dates.push(addDays(today, i))

  const byDate: Record<string, Record<string, DateLeagueGroup>> = {}
  for (const d of dates) byDate[d] = {}

  for (const r of (data ?? []) as any[]) {
    const d = r.date as string
    if (!byDate[d]) byDate[d] = {}
    const leagueSlug = r.league?.slug
    if (!leagueSlug) continue
    if (!byDate[d][leagueSlug]) {
      byDate[d][leagueSlug] = {
        leagueSlug,
        leagueName: r.league?.name ?? '',
        leagueLogo: r.league?.logo ?? '',
        fixtures: [],
      }
    }
    byDate[d][leagueSlug].fixtures.push({
      fixture_id:  r.fixture_id,
      slug:        r.slug,
      kickoff_utc: r.kickoff_utc ?? '',
      status:      r.status,
      elapsed:     r.elapsed ?? null,
      score:       { home: r.score_home ?? null, away: r.score_away ?? null },
      home_team:   { name: r.home_team?.name ?? '', logo: r.home_team?.logo ?? '', slug: r.home_team?.slug ?? '' },
      away_team:   { name: r.away_team?.name ?? '', logo: r.away_team?.logo ?? '', slug: r.away_team?.slug ?? '' },
    })
  }

  return dates.map((date) => {
    const leagues = Object.values(byDate[date]).map((g) => ({
      ...g,
      fixtures: g.fixtures.sort((a, b) => a.kickoff_utc.localeCompare(b.kickoff_utc)),
    }))
    return { date, leagues }
  })
}
