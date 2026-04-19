/**
 * Fetches player statistics per league/season (paginated) and upserts to Supabase.
 * Links to existing players by api_football_id; creates player records if missing.
 *
 * Usage:
 *   tsx scripts/sync/sync-player-stats.ts
 *   tsx scripts/sync/sync-player-stats.ts --league 39
 */

import { getDb } from '../utils/db.js'
import { createApiClient } from '../utils/api-client.js'
import { generateSlug } from '../utils/slug-generator.js'
import { loadEnv } from '../utils/env.js'

loadEnv()

interface ApiPlayerStat {
  player: {
    id: number
    name: string
    photo: string | null
    nationality: string | null
  }
  statistics: Array<{
    team: { id: number; name: string }
    league: { id: number; season: number }
    games: { appearances: number | null; minutes: number | null; rating: string | null }
    goals: { total: number | null; assists: number | null }
    cards: { yellow: number | null; red: number | null }
    shots: { on: number | null }
    passes: { key: number | null }
  }>
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

  const CHUNK = 100
  let totalStats = 0

  for (const league of targets) {
    console.log(`\n▶ ${league.name} (season=${league.season})`)

    let page = 1
    while (true) {
      console.log(`  page ${page} ...`)

      // API returns up to 20 players per page; empty response = done
      const items = await api.get<ApiPlayerStat[]>('/players', {
        league: String(league.api_id),
        season: String(league.season),
        page:   String(page),
      })

      if (!items?.length) break

      // Fetch UUIDs and existing slugs for this batch
      const apiIds = items.map((i) => i.player.id)
      const { data: playerData } = await db
        .from('players')
        .select('id, api_football_id, slug')
        .in('api_football_id', apiIds)
        
      const playerById = new Map((playerData ?? []).map((p: any) => [p.api_football_id, p.id]))
      const existingSlugMap = new Map((playerData ?? []).map((p: any) => [p.api_football_id, p.slug]))

      // Upsert player records
      const playerRows = items.map((item) => {
        const rawSlug = generateSlug(item.player.name)
        const existingSlug = existingSlugMap.get(item.player.id)
        return {
          slug:            existingSlug || `${rawSlug}-${item.player.id}`,
          name:            item.player.name,
          photo:           item.player.photo ?? null,
          nationality:     item.player.nationality ?? null,
          api_football_id: item.player.id,
          updated_at:      new Date().toISOString(),
        }
      })

      for (let i = 0; i < playerRows.length; i += CHUNK) {
        await db.from('players').upsert(playerRows.slice(i, i + CHUNK), { onConflict: 'api_football_id' })
      }

      // Fetch UUIDs for this batch (now including newly generated UUIDs)
      const { data: refreshedPlayerData } = await db
        .from('players')
        .select('id, api_football_id')
        .in('api_football_id', apiIds)
        
      const finalPlayerById = new Map((refreshedPlayerData ?? []).map((p: any) => [p.api_football_id, p.id]))

      // Build stat rows
      const statRows: any[] = []
      for (const item of items) {
        const playerId = finalPlayerById.get(item.player.id)
        if (!playerId) continue

        for (const stat of item.statistics) {
          statRows.push({
            player_id:    playerId,
            league_id:    league.id,
            season:       stat.league.season,
            club:         stat.team.name,
            appearances:  stat.games.appearances ?? 0,
            minutes:      stat.games.minutes ?? 0,
            goals:        stat.goals.total ?? 0,
            assists:      stat.goals.assists ?? 0,
            yellow_cards: stat.cards.yellow ?? 0,
            red_cards:    stat.cards.red ?? 0,
            rating:       stat.games.rating ? parseFloat(stat.games.rating) : null,
            shots_on:     stat.shots.on ?? null,
            key_passes:   stat.passes.key ?? null,
            synced_at:    new Date().toISOString(),
          })
        }
      }

      for (let i = 0; i < statRows.length; i += CHUNK) {
        const { error } = await db
          .from('player_stats')
          .upsert(statRows.slice(i, i + CHUNK), { onConflict: 'player_id,league_id,season' })
        if (error) console.warn(`  warn:`, error.message)
      }

      totalStats += statRows.length

      // API returns max 20 per page; if fewer returned, we're done
      if (items.length < 20) break
      page++
    }

    console.log(`  ✓ done`)
  }

  console.log(`\n✅ done — ${totalStats} player_stats rows`)
}

main().catch((err) => { console.error(err.message); process.exit(1) })
