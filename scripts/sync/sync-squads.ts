/**
 * Fetches current squad for every club team and upserts to the players table.
 * Sets players.team_id so getClubSquad() works correctly on match pages.
 *
 * Usage:
 *   tsx scripts/sync/sync-squads.ts                 # all club teams
 *   tsx scripts/sync/sync-squads.ts --league 135    # single league
 *   tsx scripts/sync/sync-squads.ts --team 505      # single team api_football_id
 */

import { getDb } from '../utils/db.js'
import { createApiClient } from '../utils/api-client.js'
import { generateSlug } from '../utils/slug-generator.js'
import { loadEnv } from '../utils/env.js'

loadEnv()

interface ApiSquadPlayer {
  id: number
  name: string
  age: number
  number: number | null
  position: string
  photo: string | null
}

interface ApiSquadResponse {
  team: { id: number; name: string }
  players: ApiSquadPlayer[]
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  if (i !== -1) return process.argv[i + 1]
  return process.argv.find((a) => a.startsWith(`${flag}=`))?.slice(flag.length + 1)
}

async function main() {
  const db  = getDb()
  const api = createApiClient(process.env.API_FOOTBALL_KEY ?? '')

  const leagueFilter = arg('--league')
  const teamFilter   = arg('--team')

  // Load teams
  let teamsQuery = db
    .from('teams')
    .select('id, api_football_id, name, league_id')
    .eq('is_national', false)
    .not('api_football_id', 'is', null)

  if (leagueFilter) {
    const { data: league } = await db
      .from('leagues')
      .select('id')
      .eq('api_id', leagueFilter)
      .single()
    if (league) teamsQuery = teamsQuery.eq('league_id', (league as any).id)
  }

  if (teamFilter) {
    teamsQuery = teamsQuery.eq('api_football_id', teamFilter)
  }

  const { data: teams, error: te } = await teamsQuery.order('name')
  if (te) throw new Error(te.message)
  if (!teams?.length) { console.log('No teams found'); return }

  console.log(`\nSquad sync — ${teams.length} teams`)

  let saved = 0, errors = 0

  for (const team of teams as any[]) {
    try {
      const result = await api.get<ApiSquadResponse[]>('/players/squads', {
        team: String(team.api_football_id),
      })

      const squadData = result?.[0]
      if (!squadData?.players?.length) {
        console.log(`  ⚠ ${team.name} — no squad data`)
        continue
      }

      const apiIds = squadData.players.map((p) => p.id)
      const { data: existing } = await db
        .from('players')
        .select('api_football_id, slug')
        .in('api_football_id', apiIds)
        
      const existingSlugMap = new Map((existing || []).map((p: any) => [p.api_football_id, p.slug]))

      const playerRows = squadData.players.map((p) => {
        const rawSlug = generateSlug(p.name)
        const existingSlug = existingSlugMap.get(p.id)
        return {
          slug:            existingSlug || `${rawSlug}-${p.id}`,
          name:            p.name,
          photo:           p.photo ?? null,
          position:        p.position ?? null,
          shirt_number:    p.number ?? null,
          api_football_id: p.id,
          team_id:         team.id,
          updated_at:      new Date().toISOString(),
        }
      })

      const CHUNK = 100
      for (let i = 0; i < playerRows.length; i += CHUNK) {
        const { error } = await db
          .from('players')
          .upsert(playerRows.slice(i, i + CHUNK), { onConflict: 'api_football_id' })
        if (error) console.warn(`  upsert warn (${team.name}):`, error.message)
      }

      console.log(`  ✅ ${team.name} — ${playerRows.length} players`)
      saved++
    } catch (err) {
      console.error(`  ❌ ${team.name} — ${(err as Error).message}`)
      errors++
    }
  }

  console.log(`\n✅ Done — ${saved} teams synced, ${errors} errors`)
}

main().catch((err) => { console.error(err.message); process.exit(1) })
