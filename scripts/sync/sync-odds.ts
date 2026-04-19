/**
 * Fetches odds (1X2 match winner) for upcoming matches and upserts to Supabase.
 * Prefers bookmaker id 8 (Bet365) as proxy for best odds data; displayed as 1xBet.
 *
 * Usage:
 *   tsx scripts/sync/sync-odds.ts           # next 7 days
 *   tsx scripts/sync/sync-odds.ts --days 3
 *   tsx scripts/sync/sync-odds.ts --fixture 867946
 */

import { getDb } from '../utils/db.js'
import { createApiClient } from '../utils/api-client.js'
import { loadEnv } from '../utils/env.js'

loadEnv()

interface ApiOddsValue {
  value: string
  odd: string
}

interface ApiOddsBet {
  id: number
  name: string
  values: ApiOddsValue[]
}

interface ApiOddsBookmaker {
  id: number
  name: string
  bets: ApiOddsBet[]
}

interface ApiOddsItem {
  fixture: { id: number }
  bookmakers: ApiOddsBookmaker[]
}

function arg(flag: string) {
  const i = process.argv.indexOf(flag)
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1]
  return process.argv.find((a) => a.startsWith(`${flag}=`))?.slice(flag.length + 1)
}

function pickBookmaker(bookmakers: ApiOddsBookmaker[]): ApiOddsBookmaker | null {
  // Prefer id 8 (Bet365), then 6 (Bwin), then any with 1X2 data
  const preferred = [8, 6, 1]
  for (const id of preferred) {
    const bm = bookmakers.find((b) => b.id === id)
    if (bm) return bm
  }
  return bookmakers[0] ?? null
}

async function main() {
  const db  = getDb()
  const api = createApiClient(process.env.API_FOOTBALL_KEY ?? '')

  const days       = parseInt(arg('--days') ?? '7')
  const fixtureFlt = arg('--fixture')

  const today  = new Date().toISOString().slice(0, 10)
  const future = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)

  let query = db
    .from('matches')
    .select('id, fixture_id')
    .in('status', ['NS', 'TBD', 'PST'])
    .gte('date', today)
    .lte('date', future)

  if (fixtureFlt) query = query.eq('fixture_id', parseInt(fixtureFlt)) as any

  const { data: existing } = await db.from('odds').select('fixture_id')
  const existingIds = new Set((existing ?? []).map((o: any) => o.fixture_id))

  const { data: matches, error } = await query.order('date').limit(100)
  if (error) throw new Error(error.message)

  const pending = (matches ?? []).filter((m: any) => !existingIds.has(m.fixture_id))
  console.log(`${pending.length} matches to fetch odds for`)

  let done = 0
  for (const match of pending as any[]) {
    process.stdout.write(`  fixture ${match.fixture_id} ... `)

    const results = await api.get<ApiOddsItem[]>('/odds', {
      fixture: String(match.fixture_id),
      bet: '1',  // bet id 1 = "Match Winner" (1X2)
    })

    if (!results?.length) { console.log('no data'); continue }

    const bm = pickBookmaker(results[0].bookmakers)
    if (!bm) { console.log('no bookmaker'); continue }

    const bet1x2 = bm.bets.find((b) => b.id === 1 || b.name === 'Match Winner')
    if (!bet1x2) { console.log('no 1X2 bet'); continue }

    const home = parseFloat(bet1x2.values.find((v) => v.value === 'Home')?.odd ?? '0') || null
    const draw = parseFloat(bet1x2.values.find((v) => v.value === 'Draw')?.odd ?? '0') || null
    const away = parseFloat(bet1x2.values.find((v) => v.value === 'Away')?.odd ?? '0') || null

    const row = {
      match_id:      match.id,
      fixture_id:    match.fixture_id,
      bookmaker_id:  bm.id,
      bookmaker_name: bm.name,
      home_win:      home,
      draw,
      away_win:      away,
      synced_at:     new Date().toISOString(),
      valid_until:   new Date(Date.now() + 24 * 3_600_000).toISOString(),
    }

    const { error: ue } = await db.from('odds').upsert(row, { onConflict: 'fixture_id' })
    if (ue) console.warn('warn:', ue.message)
    else { console.log(`✓ (${home} / ${draw} / ${away})`); done++ }
  }

  console.log(`\n✅ done — ${done} odds rows upserted`)
}

main().catch((err) => { console.error(err.message); process.exit(1) })
