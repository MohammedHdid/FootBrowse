/**
 * Live match polling — designed to run every minute via GitHub Actions or a cron.
 *
 * Single call to /fixtures?live=all returns every live match across all leagues.
 * Then for each live match in our DB: fetch events + stats, update scores, feed live_events.
 *
 * Usage:
 *   tsx scripts/sync/sync-live.ts
 */

import { getDb } from '../utils/db.js'
import { createApiClient } from '../utils/api-client.js'
import { loadEnv } from '../utils/env.js'

loadEnv()

interface ApiLiveFixture {
  fixture: {
    id: number
    status: { short: string; elapsed: number | null }
  }
  goals: { home: number | null; away: number | null }
  score: {
    halftime: { home: number | null; away: number | null }
    fulltime: { home: number | null; away: number | null }
  }
  league: { id: number }
  teams: { home: { id: number }; away: { id: number } }
}

interface ApiEvent {
  time: { elapsed: number; extra: number | null }
  team: { id: number }
  player: { id: number | null; name: string | null }
  assist: { id: number | null; name: string | null }
  type: string
  detail: string
}

async function main() {
  const db  = getDb()
  const api = createApiClient(process.env.API_FOOTBALL_KEY ?? '')

  // Load our league API IDs to filter only our leagues
  const { data: leagues } = await db.from('leagues').select('api_id')
  const ourLeagueIds = new Set((leagues ?? []).map((l: any) => l.api_id))

  const { data: teams }   = await db.from('teams').select('id, api_football_id')
  const teamById  = new Map((teams ?? []).map((t: any) => [t.api_football_id, t.id]))

  // 1 API call — all live matches across all leagues
  const liveFixtures = await api.get<ApiLiveFixture[]>('/fixtures', { live: 'all' })

  if (!liveFixtures?.length) {
    console.log('No live matches right now')
    return
  }

  const ours = liveFixtures.filter((f) => ourLeagueIds.has(f.league.id))
  console.log(`${liveFixtures.length} total live matches, ${ours.length} in our leagues`)

  if (!ours.length) return

  const { data: dbMatches } = await db.from('matches').select('id, fixture_id').in('fixture_id', ours.map(f => f.fixture.id))
  const matchById = new Map((dbMatches ?? []).map((m: any) => [m.fixture_id, m.id]))

  // Update scores and status for all our live matches in one batch
  for (const f of ours) {
    const matchId = matchById.get(f.fixture.id)

    const scoreHome = f.goals.home ?? null
    const scoreAway = f.goals.away ?? null

    if (matchId) {
      await db.from('matches').update({
        status:     f.fixture.status.short,
        score_home: scoreHome,
        score_away: scoreAway,
        updated_at: new Date().toISOString(),
      }).eq('id', matchId)
    } else {
      // Match not in DB yet — upsert minimal record
      const { data: lg } = await db.from('leagues').select('id').eq('api_id', f.league.id).single()
      if (lg) {
        await db.from('matches').upsert({
          fixture_id:  f.fixture.id,
          slug:        `live-${f.fixture.id}`,
          league_id:   (lg as any).id,
          home_id:     teamById.get(f.teams.home.id) ?? null,
          away_id:     teamById.get(f.teams.away.id) ?? null,
          date:        new Date().toISOString().slice(0, 10),
          status:      f.fixture.status.short,
          score_home:  scoreHome,
          score_away:  scoreAway,
          updated_at:  new Date().toISOString(),
        }, { onConflict: 'fixture_id' })
      }
    }
  }

  // Fetch events for each live match and update live_events table
  for (const f of ours) {
    const matchId = matchById.get(f.fixture.id)
    if (!matchId) continue

    const events = await api.get<ApiEvent[]>('/fixtures/events', { fixture: String(f.fixture.id) })
    if (!events?.length) continue

    // Replace live_events for this match with latest snapshot
    await db.from('live_events').delete().eq('match_id', matchId)

    const eventRows = events.map((e) => ({
      match_id:    matchId,
      type:        e.type,
      detail:      e.detail,
      minute:      e.time.elapsed,
      extra_minute: e.time.extra ?? null,
      player_name: e.player.name ?? null,
      team_id:     e.team?.id ? (teamById.get(e.team.id) ?? null) : null,
    }))

    const CHUNK = 100
    for (let i = 0; i < eventRows.length; i += CHUNK) {
      const { error } = await db.from('live_events').insert(eventRows.slice(i, i + CHUNK))
      if (error) console.warn(`  live_events warn (fixture ${f.fixture.id}):`, error.message)
    }

    console.log(`  ✓ fixture ${f.fixture.id} — score ${f.goals.home}:${f.goals.away}, ${events.length} events`)
  }

  console.log(`\n✅ live sync complete`)
}

main().catch((err) => { console.error(err.message); process.exit(1) })
