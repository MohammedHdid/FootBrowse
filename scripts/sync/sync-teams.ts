/**
 * Fetches teams (+ venues) for all leagues from API-Football and upserts to Supabase.
 * Safe to re-run — uses upsert on slug.
 *
 * Usage:
 *   tsx scripts/sync/sync-teams.ts              # all leagues
 *   tsx scripts/sync/sync-teams.ts --league 135 # single league by api_id
 */

import { getDb } from '../utils/db.js'
import { createApiClient } from '../utils/api-client.js'
import { generateSlug } from '../utils/slug-generator.js'
import { loadEnv } from '../utils/env.js'

loadEnv()

interface ApiVenue {
  id: number | null
  name: string | null
  city: string | null
  capacity: number | null
  surface: string | null
  image: string | null
}

interface ApiTeam {
  id: number
  name: string
  country: string | null
  founded: number | null
  national: boolean
  logo: string
}

interface ApiTeamsItem {
  team: ApiTeam
  venue: ApiVenue
}

async function main() {
  const db  = getDb()
  const api = createApiClient(process.env.API_FOOTBALL_KEY ?? '')

  const leagueIdx = process.argv.indexOf('--league')
  const leagueFilter = process.argv.find((a) => a.startsWith('--league='))?.slice(9)
    ?? (leagueIdx !== -1 ? process.argv[leagueIdx + 1] : undefined)

  const seasonIdx = process.argv.indexOf('--season')
  const seasonOverride = process.argv.find((a) => a.startsWith('--season='))?.slice(9)
    ?? (seasonIdx !== -1 ? process.argv[seasonIdx + 1] : undefined)

  const { data: leagues, error: le } = await db
    .from('leagues')
    .select('id, api_id, slug, name, season')
    .order('priority')
  if (le) throw new Error(le.message)

  const targets = leagueFilter
    ? leagues!.filter((l: any) => String(l.api_id) === leagueFilter)
    : leagues!

  if (targets.length === 0) {
    console.error('No matching leagues found'); process.exit(1)
  }

  let totalTeams = 0
  let totalVenues = 0

  for (const league of targets) {
    const season = seasonOverride ?? String(league.season)
    console.log(`\n▶ ${league.name} (api_id=${league.api_id}, season=${season})`)

    const items = await api.get<ApiTeamsItem[]>('/teams', {
      league: String(league.api_id),
      season,
    })

    if (!items?.length) { console.log('  no teams returned'); continue }

    // Upsert venues first
    const venueRows = items
      .filter((i) => i.venue?.id)
      .map((i) => ({
        slug:            generateSlug(i.venue.name ?? String(i.venue.id)),
        name:            i.venue.name ?? null,
        city:            i.venue.city ?? null,
        capacity:        i.venue.capacity ?? null,
        surface:         i.venue.surface ?? null,
        photo:           i.venue.image ?? null,
        api_football_id: i.venue.id!,
      }))

    if (venueRows.length) {
      const { error: ve } = await db
        .from('venues')
        .upsert(venueRows, { onConflict: 'api_football_id' })
      if (ve) console.warn('  venue upsert warn:', ve.message)
      else totalVenues += venueRows.length
    }

    // Re-fetch venue UUID map
    const venueApiIds = venueRows.map((v) => v.api_football_id)
    const { data: venueData } = await db
      .from('venues')
      .select('id, api_football_id')
      .in('api_football_id', venueApiIds)
    const venueById = new Map((venueData ?? []).map((v: any) => [v.api_football_id, v.id]))

    // Upsert teams
    const teamRows = items.map((i) => ({
      slug:            generateSlug(i.team.name),
      name:            i.team.name,
      logo:            i.team.logo,
      country:         i.team.country ?? null,
      founded:         i.team.founded ?? null,
      api_football_id: i.team.id,
      league_id:       league.id,
      venue_id:        i.venue?.id ? (venueById.get(i.venue.id) ?? null) : null,
      is_national:     i.team.national,
      updated_at:      new Date().toISOString(),
    }))

    const CHUNK = 100
    for (let i = 0; i < teamRows.length; i += CHUNK) {
      const { error: te } = await db
        .from('teams')
        .upsert(teamRows.slice(i, i + CHUNK), { onConflict: 'api_football_id' })
      if (te) console.warn(`  team upsert warn (chunk ${i}):`, te.message)
    }

    totalTeams += teamRows.length
    console.log(`  ✓ ${teamRows.length} teams, ${venueRows.length} venues`)
  }

  console.log(`\n✅ done — ${totalTeams} teams, ${totalVenues} venues`)
}

main().catch((err) => { console.error(err.message); process.exit(1) })
