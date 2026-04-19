/**
 * Fetches confirmed lineups for matches starting in the next 48 hours.
 * Run every 1-2 hours on matchdays; lineups are typically released 1h before kickoff.
 *
 * Usage:
 *   tsx scripts/sync/sync-lineups.ts
 *   tsx scripts/sync/sync-lineups.ts --fixture 867946
 */

import { getDb } from '../utils/db.js'
import { createApiClient } from '../utils/api-client.js'
import { loadEnv } from '../utils/env.js'

loadEnv()

interface ApiLineupPlayer {
  player: { id: number; name: string; number: number; pos: string }
  grid: string | null
}

interface ApiLineup {
  team: { id: number }
  formation: string | null
  startXI: ApiLineupPlayer[]
  substitutes: ApiLineupPlayer[]
  coach: { name: string | null }
}

function arg(flag: string) {
  const i = process.argv.indexOf(flag)
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1]
  return process.argv.find((a) => a.startsWith(`${flag}=`))?.slice(flag.length + 1)
}

async function main() {
  const db  = getDb()
  const api = createApiClient(process.env.API_FOOTBALL_KEY ?? '')

  const fixtureFlt = arg('--fixture')

  const now    = new Date().toISOString().slice(0, 10)
  const in48h  = new Date(Date.now() + 48 * 3_600_000).toISOString().slice(0, 10)

  const { data: teams } = await db.from('teams').select('id, api_football_id')
  const teamById = new Map((teams ?? []).map((t: any) => [t.api_football_id, t.id]))

  let query = db
    .from('matches')
    .select('id, fixture_id')
    .in('status', ['NS', 'TBD', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'FT', 'AET', 'PEN'])
    .gte('date', now)
    .lte('date', in48h)

  if (fixtureFlt) query = query.eq('fixture_id', parseInt(fixtureFlt)) as any

  const { data: matches, error } = await query.order('date').limit(50)
  if (error) throw new Error(error.message)

  const targets = matches ?? []
  console.log(`${targets.length} upcoming matches to check for lineups`)

  let done = 0
  for (const match of targets as any[]) {
    process.stdout.write(`  fixture ${match.fixture_id} ... `)

    const lineups = await api.get<ApiLineup[]>('/fixtures/lineups', { fixture: String(match.fixture_id) })
    if (!lineups?.length) { console.log('not announced yet'); continue }

    for (const lineup of lineups) {
      const teamId = teamById.get(lineup.team.id) ?? null

      const row = {
        match_id:   match.id,
        team_id:    teamId,
        formation:  lineup.formation ?? null,
        start_xi:   lineup.startXI.map((p) => ({
          id: p.player.id, name: p.player.name, number: p.player.number, pos: p.player.pos, grid: p.grid,
        })),
        bench: lineup.substitutes.map((p) => ({
          id: p.player.id, name: p.player.name, number: p.player.number, pos: p.player.pos,
        })),
        coach_name: lineup.coach.name ?? null,
        synced_at:  new Date().toISOString(),
      }

      const { error: ue } = await db
        .from('lineups')
        .upsert(row, { onConflict: 'match_id,team_id' })
      if (ue) console.warn('\n    warn:', ue.message)
    }

    console.log(`✓ (${lineups.length} teams)`)
    done++
  }

  console.log(`\n✅ done — lineups stored for ${done} matches`)
}

main().catch((err) => { console.error(err.message); process.exit(1) })
