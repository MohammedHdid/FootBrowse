/**
 * Upserts leagues from data/leagues.json into Supabase.
 * Run once after editing leagues.json to add or update leagues.
 *
 * Usage: tsx scripts/sync/sync-leagues.ts
 */

import fs from 'node:fs'
import path from 'node:path'
import { getDb } from '../utils/db.js'

interface LeagueConfig {
  id: number
  slug: string
  name: string
  country: string
  flag: string | null
  logo: string
  season: number
  seasonStart: string
  seasonEnd: string
  type: string
  priority: number
}

async function main() {
  const db = getDb()
  const leagues: LeagueConfig[] = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'data/leagues.json'), 'utf-8'),
  )

  const rows = leagues.map((l) => ({
    slug:         l.slug,
    name:         l.name,
    country:      l.country,
    logo:         l.logo,
    flag:         l.flag ?? null,
    api_id:       l.id,
    season:       l.season,
    season_start: l.seasonStart,
    season_end:   l.seasonEnd,
    type:         l.type,
    priority:     l.priority,
    updated_at:   new Date().toISOString(),
  }))

  const { error } = await db.from('leagues').upsert(rows, { onConflict: 'slug' })
  if (error) throw new Error(error.message)

  console.log(`✅ leagues — ${rows.length} upserted`)
  rows.forEach((r) => console.log(`   ${r.priority}. ${r.name} (api_id=${r.api_id}, season=${r.season})`))
}

main().catch((err) => { console.error(err.message); process.exit(1) })
