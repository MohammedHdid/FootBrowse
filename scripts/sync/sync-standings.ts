/**
 * Fetches standings for all leagues and upserts to Supabase.
 * Run weekly or after each matchday.
 *
 * Usage: tsx scripts/sync/sync-standings.ts
 *        tsx scripts/sync/sync-standings.ts --league 39
 */

import { getDb } from '../utils/db.js'
import { createApiClient } from '../utils/api-client.js'
import { loadEnv } from '../utils/env.js'

loadEnv()

interface ApiEntry {
  rank: number
  team: { id: number; name: string; logo: string }
  points: number
  goalsDiff: number
  form: string | null
  description: string | null
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } }
}

interface ApiStandingsResponse {
  league: { id: number; season: number; standings: ApiEntry[][] }
}

async function main() {
  const db  = getDb()
  const api = createApiClient(process.env.API_FOOTBALL_KEY ?? '')

  const leagueIdx = process.argv.indexOf('--league')
  const leagueFilter = process.argv.find((a) => a.startsWith('--league='))?.slice(9)
    ?? (leagueIdx !== -1 ? process.argv[leagueIdx + 1] : undefined)

  const { data: leagues } = await db.from('leagues').select('id, api_id, name, season').order('priority')
  const { data: teams }   = await db.from('teams').select('id, api_football_id')
  const teamById = new Map((teams ?? []).map((t: any) => [t.api_football_id, t.id]))

  const targets = leagueFilter
    ? (leagues ?? []).filter((l: any) => String(l.api_id) === leagueFilter)
    : leagues ?? []

  let total = 0

  for (const league of targets) {
    console.log(`\n▶ ${league.name} (season=${league.season})`)

    const results = await api.get<ApiStandingsResponse[]>('/standings', {
      league: String(league.api_id),
      season: String(league.season),
    })

    if (!results?.length) { console.log('  no standings returned'); continue }

    const allGroups = results[0].league.standings
    const rows: any[] = []

    for (const group of allGroups) {
      for (const entry of group) {
        const teamId = teamById.get(entry.team.id)
        if (!teamId) continue
        rows.push({
          league_id:     league.id,
          team_id:       teamId,
          season:        league.season,
          rank:          entry.rank,
          points:        entry.points,
          played:        entry.all.played,
          won:           entry.all.win,
          drawn:         entry.all.draw,
          lost:          entry.all.lose,
          goals_for:     entry.all.goals.for,
          goals_against: entry.all.goals.against,
          goal_diff:     entry.goalsDiff,
          form:          entry.form ?? null,
          description:   entry.description ?? null,
          synced_at:     new Date().toISOString(),
        })
      }
    }

    if (!rows.length) { console.log('  no rows to upsert'); continue }

    const { error } = await db
      .from('standings')
      .upsert(rows, { onConflict: 'league_id,team_id,season' })
    if (error) console.warn('  warn:', error.message)
    else total += rows.length

    console.log(`  ✓ ${rows.length} rows`)
  }

  console.log(`\n✅ done — ${total} standings rows`)
}

main().catch((err) => { console.error(err.message); process.exit(1) })
