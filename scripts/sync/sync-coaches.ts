/**
 * Fetches coach data for all teams and upserts to Supabase.
 * Run weekly — coaches rarely change.
 *
 * Usage:
 *   tsx scripts/sync/sync-coaches.ts
 *   tsx scripts/sync/sync-coaches.ts --league 39   # only teams in this league
 */

import { getDb } from '../utils/db.js'
import { createApiClient } from '../utils/api-client.js'
import { loadEnv } from '../utils/env.js'

loadEnv()

interface ApiCoach {
  id: number
  name: string
  nationality: string | null
  photo: string | null
  age: number | null
  career: Array<{ team: { id: number; name: string; logo: string }; start: string; end: string | null }>
}

async function main() {
  const db  = getDb()
  const api = createApiClient(process.env.API_FOOTBALL_KEY ?? '')

  const leagueIdx = process.argv.indexOf('--league')
  const leagueFilter = process.argv.find((a) => a.startsWith('--league='))?.slice(9)
    ?? (leagueIdx !== -1 ? process.argv[leagueIdx + 1] : undefined)

  let teamQuery = db.from('teams').select('id, api_football_id, league_id, name')
  if (leagueFilter) {
    const { data: lg } = await db.from('leagues').select('id').eq('api_id', parseInt(leagueFilter)).single()
    if (lg) teamQuery = teamQuery.eq('league_id', (lg as any).id) as any
  }

  const { data: teams, error } = await teamQuery
  if (error) throw new Error(error.message)
  if (!teams?.length) { console.log('No teams found'); return }

  console.log(`Fetching coaches for ${teams.length} teams...`)
  let done = 0

  for (const team of teams as any[]) {
    if (!team.api_football_id) { console.log(`  ${team.name} — skip (no api_id)`); continue }
    process.stdout.write(`  ${team.name} (api_id=${team.api_football_id}) ... `)

    const results = await api.get<ApiCoach[]>('/coachs', { team: String(team.api_football_id) })
    if (!results?.length) { console.log('no data'); continue }

    const c = results[0]
    const row = {
      team_id:        team.id,
      name:           c.name,
      photo:          c.photo ?? null,
      nationality:    c.nationality ?? null,
      age:            c.age ?? null,
      api_football_id: c.id,
      career:         c.career ?? [],
      synced_at:      new Date().toISOString(),
    }

    const { error: ue } = await db
      .from('coaches')
      .upsert(row, { onConflict: 'team_id' })
    if (ue) console.warn('warn:', ue.message)
    else { console.log(`✓ ${c.name}`); done++ }
  }

  console.log(`\n✅ done — ${done}/${teams.length} coaches upserted`)
}

main().catch((err) => { console.error(err.message); process.exit(1) })
