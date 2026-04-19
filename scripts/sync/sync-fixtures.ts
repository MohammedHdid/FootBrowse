/**
 * Fetches all fixtures for each league/season and upserts to the matches table.
 * For daily updates use --from / --to date flags.
 * For full bootstrap of a new league, omit date flags.
 *
 * Usage:
 *   tsx scripts/sync/sync-fixtures.ts                          # all leagues, full season
 *   tsx scripts/sync/sync-fixtures.ts --from 2026-04-01        # from date onwards
 *   tsx scripts/sync/sync-fixtures.ts --league 135             # single league
 *   tsx scripts/sync/sync-fixtures.ts --date 2026-04-19        # single date (daily update)
 */

import { getDb } from '../utils/db.js'
import { createApiClient } from '../utils/api-client.js'
import { generateSlug } from '../utils/slug-generator.js'
import { loadEnv } from '../utils/env.js'

loadEnv()

interface ApiFixture {
  fixture: {
    id: number
    date: string
    status: { short: string }
  }
  league: {
    id: number
    round: string
    season: number
  }
  teams: {
    home: { id: number; name: string; logo: string }
    away: { id: number; name: string; logo: string }
  }
  goals: { home: number | null; away: number | null }
  score: { fulltime: { home: number | null; away: number | null } }
  venue: { id: number | null; name: string | null; city: string | null }
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  if (i !== -1) return process.argv[i + 1]
  const kv = process.argv.find((a) => a.startsWith(`${flag}=`))
  return kv?.slice(flag.length + 1)
}

async function main() {
  const db  = getDb()
  const api = createApiClient(process.env.API_FOOTBALL_KEY ?? '')

  const leagueFilter = arg('--league')
  const fromDate     = arg('--from')
  const toDate       = arg('--to')
  const singleDate   = arg('--date')

  // Load lookup maps
  const { data: teams }  = await db.from('teams').select('id, api_football_id')
  const { data: venues } = await db.from('venues').select('id, api_football_id')
  const { data: leagues } = await db.from('leagues').select('id, api_id, slug, name, season').order('priority')

  const teamById   = new Map((teams  ?? []).map((t: any) => [t.api_football_id, t.id]))
  const venueById  = new Map((venues ?? []).filter((v: any) => v.api_football_id).map((v: any) => [v.api_football_id, v.id]))
  const leagueById = new Map((leagues ?? []).map((l: any) => [l.api_id, l]))

  const targets = leagueFilter
    ? (leagues ?? []).filter((l: any) => String(l.api_id) === leagueFilter)
    : leagues ?? []

  let total = 0

  for (const league of targets) {
    console.log(`\n▶ ${league.name} (api_id=${league.api_id}, season=${league.season})`)

    const params: Record<string, string> = {
      league: String(league.api_id),
      season: String(league.season),
    }
    if (singleDate)      { params.date = singleDate }
    else if (fromDate)   { params.from = fromDate; if (toDate) params.to = toDate }

    const fixtures = await api.get<ApiFixture[]>('/fixtures', params)
    if (!fixtures?.length) { console.log('  no fixtures returned'); continue }

    const rows = fixtures.map((f) => {
      const dt   = new Date(f.fixture.date)
      const home = generateSlug(f.teams.home.name)
      const away = generateSlug(f.teams.away.name)
      const date = dt.toISOString().slice(0, 10)
      const lg   = leagueById.get(f.league.id)

      return {
        slug:        `${home}-vs-${away}-${date}`,
        fixture_id:  f.fixture.id,
        league_id:   lg?.id ?? null,
        home_id:     teamById.get(f.teams.home.id) ?? null,
        away_id:     teamById.get(f.teams.away.id) ?? null,
        venue_id:    f.venue?.id ? (venueById.get(f.venue.id) ?? null) : null,
        date,
        kickoff_utc: dt.toISOString().slice(11, 16),
        status:      f.fixture.status.short,
        score_home:  f.score.fulltime.home ?? f.goals.home ?? null,
        score_away:  f.score.fulltime.away ?? f.goals.away ?? null,
        matchday:    typeof f.league.round === 'string'
          ? parseInt(f.league.round.replace(/\D/g, '')) || null
          : null,
        updated_at:  new Date().toISOString(),
        synced_at:   new Date().toISOString(),
      }
    })

    const CHUNK = 200
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error } = await db
        .from('matches')
        .upsert(rows.slice(i, i + CHUNK), { onConflict: 'fixture_id' })
      if (error) console.warn(`  upsert warn (chunk ${i}):`, error.message)
    }

    total += rows.length
    console.log(`  ✓ ${rows.length} fixtures`)
  }

  console.log(`\n✅ done — ${total} matches upserted`)
}

main().catch((err) => { console.error(err.message); process.exit(1) })
