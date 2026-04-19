/**
 * Fetches match events + statistics for finished matches and upserts to Supabase.
 *
 * Bootstrap: fetches all FT matches without events (can be many API calls).
 * Daily:     fetches matches finished in the last N days.
 *
 * Usage:
 *   tsx scripts/sync/sync-events.ts                  # last 3 days (default)
 *   tsx scripts/sync/sync-events.ts --days 7         # last 7 days
 *   tsx scripts/sync/sync-events.ts --all            # all FT matches without events (bootstrap)
 *   tsx scripts/sync/sync-events.ts --fixture 867946 # single fixture
 */

import { getDb } from '../utils/db.js'
import { createApiClient } from '../utils/api-client.js'
import { loadEnv } from '../utils/env.js'

loadEnv()

interface ApiEvent {
  time: { elapsed: number; extra: number | null }
  team: { id: number }
  player: { id: number | null; name: string | null }
  assist: { id: number | null; name: string | null }
  type: string
  detail: string
}

interface ApiStat {
  team: { id: number }
  statistics: Array<{ type: string; value: string | number | null }>
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1]
  return process.argv.find((a) => a.startsWith(`${flag}=`))?.slice(flag.length + 1)
}

async function main() {
  const db  = getDb()
  const api = createApiClient(process.env.API_FOOTBALL_KEY ?? '')

  const isAll      = process.argv.includes('--all')
  const daysBack   = parseInt(arg('--days') ?? '3')
  const fixtureFlt = arg('--fixture')

  const { data: teams } = await db.from('teams').select('id, api_football_id')
  const teamById = new Map((teams ?? []).map((t: any) => [t.api_football_id, t.id]))

  // Determine which matches to process
  let query = db.from('matches').select('id, fixture_id, date').eq('status', 'FT')

  if (fixtureFlt) {
    query = query.eq('fixture_id', parseInt(fixtureFlt)) as any
  } else if (!isAll) {
    const since = new Date(Date.now() - daysBack * 86_400_000).toISOString().slice(0, 10)
    query = query.gte('date', since) as any
  }

  const { data: matches, error: me } = await query.order('date', { ascending: false }).limit(500)
  if (me) throw new Error(me.message)
  if (!matches?.length) { console.log('No matches to process'); return }

  const isForce = process.argv.includes('--force')

  // Skip matches that already have events unless --force
  let toProcess = matches as any[]
  if (!isForce && !fixtureFlt) {
    const { data: syncedRows } = await db.from('match_events').select('match_id')
    const synced = new Set((syncedRows ?? []).map((r: any) => r.match_id))
    toProcess = (matches as any[]).filter((m) => !synced.has(m.id))
  }

  if (!toProcess.length) { console.log('All matches already synced — use --force to re-sync'); return }
  console.log(`Processing ${toProcess.length} matches (${(matches as any[]).length - toProcess.length} skipped, use --force to re-sync all)...`)
  let processed = 0

  for (const match of toProcess) {
    process.stdout.write(`  fixture ${match.fixture_id} ... `)

    // Events
    const events = await api.get<ApiEvent[]>('/fixtures/events', { fixture: String(match.fixture_id) })

    if (events?.length) {
      await db.from('match_events').delete().eq('match_id', match.id)
      const eventRows = events.map((e) => ({
        match_id:      match.id,
        type:          e.type ?? null,
        detail:        e.detail ?? null,
        minute:        e.time.elapsed ?? null,
        extra_minute:  e.time.extra ?? null,
        player_name:   e.player.name ?? null,
        player_api_id: e.player.id ?? null,
        assist_name:   e.assist.name ?? null,
        assist_api_id: e.assist.id ?? null,
        team_id:       e.team?.id ? (teamById.get(e.team.id) ?? null) : null,
      }))
      const CHUNK = 100
      for (let i = 0; i < eventRows.length; i += CHUNK) {
        const { error } = await db.from('match_events').insert(eventRows.slice(i, i + CHUNK))
        if (error) console.warn(`\n    events warn:`, error.message)
      }
    }

    // Statistics
    const stats = await api.get<ApiStat[]>('/fixtures/statistics', { fixture: String(match.fixture_id) })

    if (stats?.length) {
      const statRows = stats.map((s) => {
        const m = new Map(s.statistics.map((st) => [st.type, st.value]))
        const pct = (v: any) => typeof v === 'string' ? parseInt(v) || null : (v ?? null)
        return {
          match_id:     match.id,
          team_id:      teamById.get(s.team.id) ?? null,
          possession:   pct(m.get('Ball Possession')),
          shots_on:     m.get('Shots on Goal') ?? null,
          shots_total:  m.get('Total Shots') ?? null,
          corners:      m.get('Corner Kicks') ?? null,
          fouls:        m.get('Fouls') ?? null,
          yellow_cards: m.get('Yellow Cards') ?? null,
          red_cards:    m.get('Red Cards') ?? null,
          xg:           m.get('expected_goals') ?? null,
          pass_accuracy: pct(m.get('Passes %')),
          offsides:     m.get('Offsides') ?? null,
          saves:        m.get('Goalkeeper Saves') ?? null,
          synced_at:    new Date().toISOString(),
        }
      })
      const { error } = await db
        .from('match_stats')
        .upsert(statRows, { onConflict: 'match_id,team_id' })
      if (error) console.warn(`\n    stats warn:`, error.message)
    }

    console.log(`✓ (${events?.length ?? 0} events, ${stats?.length ?? 0} stat rows)`)
    processed++
  }

  console.log(`\n✅ done — ${processed} matches processed`)
}

main().catch((err) => { console.error(err.message); process.exit(1) })
