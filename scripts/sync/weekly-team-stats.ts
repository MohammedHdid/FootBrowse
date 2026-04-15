/**
 * scripts/sync/weekly-team-stats.ts
 *
 * Fetches league performance statistics for club teams from API-Football.
 * Reads team IDs from data/teams-by-league/{league-slug}-{season}.json.
 * Writes results to data/team-stats/{team-slug}-{league-slug}.json.
 *
 * Usage:
 *   npx tsx scripts/sync/weekly-team-stats.ts
 *   npx tsx scripts/sync/weekly-team-stats.ts --league=premier-league
 *   npx tsx scripts/sync/weekly-team-stats.ts --league=premier-league --limit=5
 *
 * API calls: 1 per team. Default limit: 5 teams = 5 calls.
 * Recommended: run after upgrading to Pro (many teams = many calls).
 */

import fs from 'node:fs'
import path from 'node:path'
import { createApiClient } from '../utils/api-client.js'

// ---------------------------------------------------------------------------
// Load .env.local
// ---------------------------------------------------------------------------

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    const v = t.slice(eq + 1).trim()
    if (!process.env[k]) process.env[k] = v
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LeagueRef {
  id: number
  slug: string
  name: string
  logo: string
  season: number
}

interface TeamRef {
  id: number
  slug: string
  name: string
  logo: string
}

interface ApiTeamStats {
  league: { id: number; name: string; logo: string; season: number }
  team:   { id: number; name: string; logo: string }
  form:   string
  fixtures: {
    played: { total: number }
    wins:   { total: number }
    draws:  { total: number }
    loses:  { total: number }
  }
  goals: {
    for:     { total: { total: number } }
    against: { total: { total: number } }
  }
  clean_sheet:    { total: number }
  failed_to_score: { total: number }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseArg(args: string[], name: string): string | null {
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith(`--${name}=`)) return args[i].slice(name.length + 3)
    if (args[i] === `--${name}` && args[i + 1]) return args[i + 1]
  }
  return null
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const apiKey = process.env.API_FOOTBALL_KEY ?? ''
  if (!apiKey) {
    console.error('ERROR: API_FOOTBALL_KEY not set in .env.local')
    process.exit(1)
  }

  const args   = process.argv.slice(2)
  const LIMIT  = parseInt(parseArg(args, 'limit')  ?? '5', 10)
  const leagueFilter = parseArg(args, 'league')

  const outDir = path.resolve(process.cwd(), 'data', 'team-stats')
  fs.mkdirSync(outDir, { recursive: true })

  // Load leagues
  const leaguesPath = path.resolve(process.cwd(), 'data', 'leagues.json')
  const allLeagues: LeagueRef[] = JSON.parse(fs.readFileSync(leaguesPath, 'utf-8'))
  const leagues = leagueFilter
    ? allLeagues.filter((l) => l.slug === leagueFilter)
    : allLeagues

  if (leagues.length === 0) {
    console.error(`No league found matching slug: ${leagueFilter}`)
    process.exit(1)
  }

  // Collect team/league pairs that don't yet have a cached stats file
  const pending: Array<{ team: TeamRef; league: LeagueRef }> = []

  for (const league of leagues) {
    const teamsPath = path.resolve(
      process.cwd(), 'data', 'teams-by-league', `${league.slug}-${league.season}.json`,
    )
    if (!fs.existsSync(teamsPath)) {
      console.warn(`No teams file for ${league.slug}-${league.season}, skipping.`)
      continue
    }

    const teams: TeamRef[] = JSON.parse(fs.readFileSync(teamsPath, 'utf-8'))
    for (const team of teams) {
      const cached = path.join(outDir, `${team.slug}-${league.slug}.json`)
      if (fs.existsSync(cached)) continue
      pending.push({ team, league })
    }
  }

  if (pending.length === 0) {
    console.log('All team stats are already cached.')
    return
  }

  const toProcess = pending.slice(0, LIMIT)
  console.log(
    `Found ${pending.length} uncached team/league pair(s). Processing ${toProcess.length} (--limit=${LIMIT}).`,
  )
  console.log(`API calls budget: ${toProcess.length} (1 per team)\n`)

  const client = createApiClient(apiKey)
  let saved = 0

  for (const { team, league } of toProcess) {
    console.log(`Fetching stats: ${team.name} in ${league.name} (${league.season})`)

    const stats = await client.get<ApiTeamStats>('/teams/statistics', {
      team:   String(team.id),
      league: String(league.id),
      season: String(league.season),
    })

    if (!stats?.fixtures) {
      console.warn(`  ⚠ No stats returned for ${team.name} — skipping`)
      continue
    }

    const output = {
      team_slug:      team.slug,
      league_slug:    league.slug,
      league_name:    league.name,
      league_logo:    league.logo,
      season:         league.season,
      fetched_at:     new Date().toISOString(),
      form:           stats.form ?? '',
      played:         stats.fixtures.played.total,
      wins:           stats.fixtures.wins.total,
      draws:          stats.fixtures.draws.total,
      losses:         stats.fixtures.loses.total,
      goals_for:      stats.goals.for.total.total,
      goals_against:  stats.goals.against.total.total,
      clean_sheets:   stats.clean_sheet.total,
      failed_to_score: stats.failed_to_score.total,
    }

    const outPath = path.join(outDir, `${team.slug}-${league.slug}.json`)
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n')
    console.log(`  ✓ Saved ${team.slug}-${league.slug}.json`)
    saved++
  }

  console.log(`\n✓ Done — ${saved} team stat(s) cached. API calls used: ${saved}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
