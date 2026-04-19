/**
 * Fetches current injuries and suspensions for all leagues and upserts to Supabase.
 * Run weekly or before each matchday.
 *
 * Usage:
 *   tsx scripts/sync/sync-injuries.ts
 *   tsx scripts/sync/sync-injuries.ts --league 39
 */

import { getDb } from '../utils/db.js'
import { createApiClient } from '../utils/api-client.js'
import { loadEnv } from '../utils/env.js'

loadEnv()

interface ApiInjury {
  player: { id: number; name: string; photo: string | null; type: string | null; reason: string | null }
  team: { id: number }
  fixture: { id: number | null; date: string | null }
  league: { id: number; season: number }
}

async function main() {
  const db  = getDb()
  const api = createApiClient(process.env.API_FOOTBALL_KEY ?? '')

  const leagueIdx = process.argv.indexOf('--league')
  const leagueFilter = process.argv.find((a) => a.startsWith('--league='))?.slice(9)
    ?? (leagueIdx !== -1 ? process.argv[leagueIdx + 1] : undefined)

  const { data: leagues } = await db.from('leagues').select('id, api_id, name, season').order('priority')
  const { data: teams }   = await db.from('teams').select('id, api_football_id')
  const { data: matches } = await db.from('matches').select('id, fixture_id')

  const teamById    = new Map((teams   ?? []).map((t: any) => [t.api_football_id, t.id]))
  const matchById   = new Map((matches ?? []).map((m: any) => [m.fixture_id, m.id]))
  const leagueDbMap = new Map((leagues ?? []).map((l: any) => [l.api_id, l.id]))

  const targets = leagueFilter
    ? (leagues ?? []).filter((l: any) => String(l.api_id) === leagueFilter)
    : leagues ?? []

  let total = 0

  for (const league of targets) {
    console.log(`\n▶ ${league.name}`)

    const items = await api.get<ApiInjury[]>('/injuries', {
      league: String(league.api_id),
      season: String(league.season),
    })

    if (!items?.length) { console.log('  no injuries returned'); continue }

    // Clear old entries for this league before reinserting
    await db.from('injuries').delete().eq('league_id', league.id)

    const rows = items
      .filter((i) => i.player)
      .map((i) => ({
        player_api_id: i.player.id,
        player_name:   i.player.name,
        team_id:       teamById.get(i.team?.id) ?? null,
        league_id:     leagueDbMap.get(i.league?.id) ?? null,
        type:          i.player.type ?? null,
        reason:        i.player.reason ?? null,
        match_id:      i.fixture?.id ? (matchById.get(i.fixture.id) ?? null) : null,
        fixture_date:  i.fixture?.date ?? null,
        synced_at:     new Date().toISOString(),
      }))

    const CHUNK = 200
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error } = await db.from('injuries').insert(rows.slice(i, i + CHUNK))
      if (error) console.warn(`  warn (chunk ${i}):`, error.message)
    }

    total += rows.length
    console.log(`  ✓ ${rows.length} injuries/suspensions`)
  }

  console.log(`\n✅ done — ${total} rows`)
}

main().catch((err) => { console.error(err.message); process.exit(1) })
