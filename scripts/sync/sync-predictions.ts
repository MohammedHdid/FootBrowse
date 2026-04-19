/**
 * Fetches predictions for upcoming matches and upserts to Supabase.
 * Targets matches in the next N days that don't yet have a prediction.
 *
 * Usage:
 *   tsx scripts/sync/sync-predictions.ts             # next 7 days
 *   tsx scripts/sync/sync-predictions.ts --days 3
 *   tsx scripts/sync/sync-predictions.ts --fixture 867946
 */

import { getDb } from '../utils/db.js'
import { createApiClient } from '../utils/api-client.js'
import { loadEnv } from '../utils/env.js'

loadEnv()

interface ApiPrediction {
  predictions: {
    winner: { id: number | null; name: string | null; comment: string | null } | null
    win_or_draw: boolean
    under_over: string | null
    goals: { home: string | null; away: string | null }
    advice: string | null
    percent: { home: string; draw: string; away: string }
  }
  comparison: Record<string, unknown> | null
}

function arg(flag: string) {
  const i = process.argv.indexOf(flag)
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1]
  return process.argv.find((a) => a.startsWith(`${flag}=`))?.slice(flag.length + 1)
}

async function main() {
  const db  = getDb()
  const api = createApiClient(process.env.API_FOOTBALL_KEY ?? '')

  const days       = parseInt(arg('--days') ?? '7')
  const fixtureFlt = arg('--fixture')

  const today  = new Date().toISOString().slice(0, 10)
  const future = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)

  // Get upcoming matches without predictions
  let query = db
    .from('matches')
    .select('id, fixture_id')
    .in('status', ['NS', 'TBD', 'PST', '1H', '2H', 'HT', 'LIVE'])
    .gte('date', today)
    .lte('date', future)

  if (fixtureFlt) query = query.eq('fixture_id', parseInt(fixtureFlt)) as any

  // Exclude matches already having a prediction
  const { data: existing } = await db.from('predictions').select('fixture_id')
  const existingIds = new Set((existing ?? []).map((p: any) => p.fixture_id))

  const { data: matches, error } = await query.order('date').limit(100)
  if (error) throw new Error(error.message)

  const pending = (matches ?? []).filter((m: any) => !existingIds.has(m.fixture_id))
  console.log(`${pending.length} matches to fetch predictions for`)

  let done = 0
  for (const match of pending as any[]) {
    process.stdout.write(`  fixture ${match.fixture_id} ... `)

    const results = await api.get<ApiPrediction[]>('/predictions', { fixture: String(match.fixture_id) })
    if (!results?.length) { console.log('no data'); continue }

    const p = results[0].predictions
    const row = {
      match_id:       match.id,
      fixture_id:     match.fixture_id,
      advice:         p.advice ?? null,
      winner_api_id:  p.winner?.id ?? null,
      winner_name:    p.winner?.name ?? null,
      winner_comment: p.winner?.comment ?? null,
      percent_home:   p.percent?.home ?? null,
      percent_draw:   p.percent?.draw ?? null,
      percent_away:   p.percent?.away ?? null,
      under_over:     p.under_over ?? null,
      goals_home:     p.goals?.home ?? null,
      goals_away:     p.goals?.away ?? null,
      comparison:     results[0].comparison ?? null,
      synced_at:      new Date().toISOString(),
      valid_until:    new Date(Date.now() + 48 * 3_600_000).toISOString(),
    }

    const { error: ue } = await db
      .from('predictions')
      .upsert(row, { onConflict: 'fixture_id' })
    if (ue) console.warn('warn:', ue.message)
    else { console.log('✓'); done++ }
  }

  console.log(`\n✅ done — ${done} predictions upserted`)
}

main().catch((err) => { console.error(err.message); process.exit(1) })
