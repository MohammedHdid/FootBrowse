import { supabase } from '@/lib/supabase'
import type { League } from '@/lib/leagues'

export interface Fixture {
  fixture_id: number
  slug: string
  date: string
  kickoff_utc: string
  status: string
  score: { home: number | null; away: number | null }
  home_team: { id: number; name: string; slug: string; logo: string }
  away_team: { id: number; name: string; slug: string; logo: string }
  venue_id: number | null
  matchday: number | null
  stage: string
}

function mapFixture(r: any): Fixture {
  return {
    fixture_id:  r.fixture_id,
    slug:        r.slug,
    date:        r.date,
    kickoff_utc: r.kickoff_utc ?? '',
    status:      r.status,
    score:       { home: r.score_home ?? null, away: r.score_away ?? null },
    home_team:   { id: r.home_team?.api_football_id ?? 0, name: r.home_team?.name ?? '', slug: r.home_team?.slug ?? '', logo: r.home_team?.logo ?? '' },
    away_team:   { id: r.away_team?.api_football_id ?? 0, name: r.away_team?.name ?? '', slug: r.away_team?.slug ?? '', logo: r.away_team?.logo ?? '' },
    venue_id:    r.venue?.api_football_id ?? null,
    matchday:    r.matchday ?? null,
    stage:       r.stage ?? '',
  }
}

export async function getFixtures(league: League): Promise<Fixture[]> {
  const { data } = await supabase
    .from('matches')
    .select(`
      fixture_id, slug, date, kickoff_utc, status, score_home, score_away, matchday, stage,
      home_team:teams!home_id(api_football_id, name, slug, logo),
      away_team:teams!away_id(api_football_id, name, slug, logo),
      venue:venues!venue_id(api_football_id)
    `)
    .eq('league_id', league.id)
    .order('date', { ascending: true })
  return (data ?? []).map(mapFixture)
}

export function isFinished(status: string): boolean {
  return ['FT', 'AET', 'PEN'].includes(status)
}

export function isUpcoming(status: string): boolean {
  return status === 'NS'
}

export function isLive(status: string): boolean {
  return ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(status)
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    NS: 'Upcoming', FT: 'FT', AET: 'AET', PEN: 'Pens',
    '1H': 'Live', '2H': 'Live', HT: 'HT', ET: 'ET', BT: 'BT',
    CANC: 'Cancelled', PST: 'Postponed', ABD: 'Abandoned',
  }
  return map[status] ?? status
}
