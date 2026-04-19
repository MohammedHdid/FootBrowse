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
  const nextHrs    = parseInt(arg('--next') || '24')
  const force      = process.argv.includes('--force')

  const now    = new Date().toISOString().slice(0, 10)
  const future = new Date(Date.now() + nextHrs * 3_600_000).toISOString().slice(0, 10)

  const { data: teams } = await db.from('teams').select('id, api_football_id')
  const teamById = new Map((teams ?? []).map((t: any) => [t.api_football_id, t.id]))

  let query = db
    .from('matches')
    .select('id, fixture_id, home_id, away_id, status, date, kickoff_utc, home_team:teams!home_id(name), away_team:teams!away_id(name)')
    .in('status', ['NS', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'FT', 'AET', 'PEN'])
    .gte('date', now)
    .lte('date', future)

  if (fixtureFlt) query = query.eq('fixture_id', parseInt(fixtureFlt)) as any

  const { data: matches, error } = await query.order('date').limit(100)
  if (error) throw new Error(error.message)

  const targets = (matches ?? []).filter((m: any) => {
    // If not forced, we might want to skip if both teams already have lineups
    // But lineups can change last minute (warmup injuries), so we usually sync until match is deep in play.
    return true 
  })

  console.log(`Checking ${targets.length} matches for lineups (Window: ${nextHrs}h)`)

  let done = 0
  for (const match of targets as any[]) {
    const homeName = match.home_team?.name || 'Home'
    const awayName = match.away_team?.name || 'Away'
    process.stdout.write(`  [${match.status}] ${homeName} vs ${awayName} (${match.fixture_id}) ... `)

    const lineups = await api.get<ApiLineup[]>('/fixtures/lineups', { fixture: String(match.fixture_id) })
    if (!lineups?.length) { console.log('not announced'); continue }

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
