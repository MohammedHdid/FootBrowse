import fs from 'node:fs'
import path from 'node:path'
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

export function getFixtures(league: League): Fixture[] {
  const filePath = path.join(process.cwd(), 'data', 'fixtures', `${league.slug}-${league.season}.json`)
  if (!fs.existsSync(filePath)) return []
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Fixture[]
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
    NS:   'Upcoming',
    FT:   'FT',
    AET:  'AET',
    PEN:  'Pens',
    '1H': 'Live',
    '2H': 'Live',
    HT:   'HT',
    ET:   'ET',
    BT:   'BT',
    CANC: 'Cancelled',
    PST:  'Postponed',
    ABD:  'Abandoned',
  }
  return map[status] ?? status
}
