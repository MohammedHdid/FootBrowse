/**
 * scripts/sync/weekly-player-stats.ts
 *
 * Builds per-player stats files by aggregating existing topscorers data.
 * Costs 0 API calls — reads from data/topscorers/*.json which is already synced.
 *
 * For each player who appears in any league's top scorers or top assists list,
 * a file is written to data/player-stats/{slug}.json with their season stats
 * and the high-quality API-Football photo URL.
 *
 * Usage:
 *   npx tsx scripts/sync/weekly-player-stats.ts
 *
 * API calls: 0
 *
 * Future extension: add --fetch-api flag to also call GET /players?id={id}&season=2024
 * for historical seasons and rating data (requires Pro tier for volume).
 */

import fs from 'node:fs'
import path from 'node:path'
import type { TopScorersFile, TopPlayer } from './weekly-topscorers.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SeasonEntry {
  season: number
  club: string
  club_logo: string
  league: string
  league_id: number
  appearances: number
  goals: number
  assists: number
  minutes: number
  yellow_cards: number
  red_cards: number
}

interface PlayerOut {
  player_id: number
  slug: string
  name: string
  api_photo: string
  seasons: SeasonEntry[]
}

// Key: `${player_id}-${league_id}`
type EntryMap = Map<string, SeasonEntry>
type PlayerMap = Map<number, { slug: string; name: string; photo: string; entries: EntryMap }>

// ---------------------------------------------------------------------------
// Merge a TopPlayer into the player map
// ---------------------------------------------------------------------------

function upsert(map: PlayerMap, p: TopPlayer, leagueId: number, season: number) {
  if (!map.has(p.player_id)) {
    map.set(p.player_id, { slug: p.slug, name: p.name, photo: p.photo, entries: new Map() })
  }
  const rec = map.get(p.player_id)!
  const key = `${p.player_id}-${leagueId}`

  const existing = rec.entries.get(key)
  if (existing) {
    // Take the higher value for each stat (scorers list has accurate goals, assisters has accurate assists)
    existing.goals        = Math.max(existing.goals,        p.goals)
    existing.assists      = Math.max(existing.assists,      p.assists)
    existing.appearances  = Math.max(existing.appearances,  p.appearances)
    existing.minutes      = Math.max(existing.minutes,      p.minutes)
    existing.yellow_cards = Math.max(existing.yellow_cards, p.yellow_cards)
    existing.red_cards    = Math.max(existing.red_cards,    p.red_cards)
  } else {
    rec.entries.set(key, {
      season,
      club:         p.team.name,
      club_logo:    p.team.logo,
      league:       '',     // filled in after
      league_id:    leagueId,
      appearances:  p.appearances,
      goals:        p.goals,
      assists:      p.assists,
      minutes:      p.minutes,
      yellow_cards: p.yellow_cards,
      red_cards:    p.red_cards,
    })
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const scorersDir = path.resolve(process.cwd(), 'data', 'topscorers')
  const leaguesPath = path.resolve(process.cwd(), 'data', 'leagues.json')
  const outDir = path.resolve(process.cwd(), 'data', 'player-stats')

  fs.mkdirSync(outDir, { recursive: true })

  if (!fs.existsSync(scorersDir)) {
    console.error('data/topscorers/ not found — run sync:weekly-topscorers first')
    process.exit(1)
  }

  // Build league name lookup: id → name
  const leagueNames: Record<number, string> = {}
  if (fs.existsSync(leaguesPath)) {
    const leagues: Array<{ id: number; name: string }> = JSON.parse(
      fs.readFileSync(leaguesPath, 'utf-8'),
    )
    for (const l of leagues) leagueNames[l.id] = l.name
  }

  // Read all topscorer files and aggregate
  const files = fs.readdirSync(scorersDir).filter((f) => f.endsWith('.json'))
  const players: PlayerMap = new Map()

  for (const file of files) {
    const data: TopScorersFile = JSON.parse(
      fs.readFileSync(path.join(scorersDir, file), 'utf-8'),
    )
    const { league_id, season, scorers, assisters } = data

    for (const p of scorers ?? [])   upsert(players, p, league_id, season)
    for (const p of assisters ?? []) upsert(players, p, league_id, season)
  }

  // Write one file per player
  let written = 0
  for (const [player_id, rec] of players) {
    const seasons: SeasonEntry[] = [...rec.entries.values()].map((e) => ({
      ...e,
      league: leagueNames[e.league_id] ?? `League ${e.league_id}`,
    }))

    // Sort by season desc, then league name
    seasons.sort((a, b) => b.season - a.season || a.league.localeCompare(b.league))

    const out: PlayerOut = {
      player_id,
      slug:      rec.slug,
      name:      rec.name,
      api_photo: rec.photo,
      seasons,
    }

    const outPath = path.join(outDir, `${rec.slug}.json`)
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n')
    written++
  }

  console.log(`✓ Written ${written} player stat file(s) to data/player-stats/`)
  console.log('  API calls used: 0 (aggregated from existing topscorers data)')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
