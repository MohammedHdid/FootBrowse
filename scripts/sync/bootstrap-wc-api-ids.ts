/**
 * Bootstrap WC API IDs
 *
 * One-time script that fetches WC 2026 fixture IDs and team IDs from
 * API-Football and writes two lookup files:
 *
 *   data/wc-fixture-ids.json  — { [wcSlug]: apiFixtureId }
 *   data/wc-team-ids.json     — { [teamSlug]: apiTeamId }
 *
 * These allow the predictions, odds, H2H, and lineup sync scripts to work
 * for World Cup fixtures exactly the same as for club leagues.
 *
 * Usage:
 *   npx tsx scripts/sync/bootstrap-wc-api-ids.ts
 *   npx tsx scripts/sync/bootstrap-wc-api-ids.ts --dry-run
 */

import fs from 'node:fs'
import path from 'node:path'
import { createApiClient } from '../utils/api-client.js'

// ── Load .env.local ──────────────────────────────────────────────────────────
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

// ── Types ─────────────────────────────────────────────────────────────────────
interface ApiFixture {
  fixture: { id: number; date: string; status: { short: string } }
  teams: {
    home: { id: number; name: string; logo: string }
    away: { id: number; name: string; logo: string }
  }
}

interface ApiTeam {
  team: { id: number; name: string; code: string; country: string; logo: string }
}

interface WcMatch {
  slug: string
  date: string
  team_a: { slug: string; name: string; code: string }
  team_b: { slug: string; name: string; code: string }
}

// ── Name normalisation (API name → our slug) ─────────────────────────────────
// Add entries when API name doesn't convert cleanly to our team slug
const API_NAME_TO_SLUG: Record<string, string> = {
  'Korea Republic':   'south-korea',
  'Iran':             'iran',
  'IR Iran':          'iran',
  "Côte d'Ivoire":    'ivory-coast',
  "Cote d'Ivoire":    'ivory-coast',
  'Ivory Coast':      'ivory-coast',
  'United States':    'usa',
  'USA':              'usa',
  'Korea DPR':        'north-korea',
  'Bosnia':           'bosnia-and-herzegovina',
  'Congo DR':         'dr-congo',
  'Congo':            'republic-of-congo',
}

function apiNameToSlug(name: string): string {
  if (API_NAME_TO_SLUG[name]) return API_NAME_TO_SLUG[name]
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const DATA_DIR = path.join(process.cwd(), 'data')

  const apiKey = process.env.API_FOOTBALL_KEY ?? ''
  if (!apiKey) { console.error('❌  API_FOOTBALL_KEY not set'); process.exit(1) }
  const api = createApiClient(apiKey)

  const wcMatches: WcMatch[] = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'matches.json'), 'utf-8'))

  // ── 1. Fetch WC 2026 fixtures ─────────────────────────────────────────────
  console.log('\n1. Fetching WC 2026 fixtures from API Football (league=1, season=2026)…')
  let apiFixtures: ApiFixture[] = []
  try {
    apiFixtures = await api.get<ApiFixture[]>('/fixtures', { league: '1', season: '2026' }) ?? []
    console.log(`   Got ${apiFixtures.length} fixtures from API`)
  } catch (err) {
    console.error(`   ❌ Failed: ${(err as Error).message}`)
    console.log('   Trying season=2025 as fallback…')
    try {
      apiFixtures = await api.get<ApiFixture[]>('/fixtures', { league: '1', season: '2025' }) ?? []
      console.log(`   Got ${apiFixtures.length} fixtures from API (2025 season)`)
    } catch (err2) {
      console.error(`   ❌ Fallback also failed: ${(err2 as Error).message}`)
    }
  }

  // Build fixture ID lookup: match by date (YYYY-MM-DD) + home+away slug
  const fixtureIds: Record<string, number> = {}
  let fixtureMatched = 0, fixtureMissed = 0

  for (const wc of wcMatches) {
    const wcDate = wc.date  // YYYY-MM-DD

    // Try to find API fixture for this match
    const apiMatch = apiFixtures.find((f) => {
      const apiDate = f.fixture.date.split('T')[0]
      if (apiDate !== wcDate) return false

      const homeSlug = apiNameToSlug(f.teams.home.name)
      const awaySlug = apiNameToSlug(f.teams.away.name)
      const wcSlugA = slugify(wc.team_a.name)
      const wcSlugB = slugify(wc.team_b.name)

      // Check both orientations (API may have home/away flipped for neutral venues)
      return (
        (homeSlug === wcSlugA || homeSlug === wc.team_a.slug) &&
        (awaySlug === wcSlugB || awaySlug === wc.team_b.slug)
      ) || (
        (homeSlug === wcSlugB || homeSlug === wc.team_b.slug) &&
        (awaySlug === wcSlugA || awaySlug === wc.team_a.slug)
      )
    })

    if (apiMatch) {
      fixtureIds[wc.slug] = apiMatch.fixture.id
      fixtureMatched++
      if (dryRun) console.log(`   ✅ ${wc.slug} → fixture_id=${apiMatch.fixture.id}`)
    } else {
      fixtureMissed++
      if (dryRun) console.log(`   ⚠️  No match for ${wc.slug} (${wc.date} ${wc.team_a.name} vs ${wc.team_b.name})`)
    }
  }

  console.log(`   Matched: ${fixtureMatched} / ${wcMatches.length} (missed: ${fixtureMissed})`)

  // ── 2. Fetch WC 2026 teams ────────────────────────────────────────────────
  console.log('\n2. Fetching WC 2026 teams from API Football…')
  let apiTeams: ApiTeam[] = []
  try {
    apiTeams = await api.get<ApiTeam[]>('/teams', { league: '1', season: '2026' }) ?? []
    console.log(`   Got ${apiTeams.length} teams from API`)
  } catch (err) {
    console.error(`   ❌ Failed: ${(err as Error).message}`)
    try {
      apiTeams = await api.get<ApiTeam[]>('/teams', { league: '1', season: '2025' }) ?? []
      console.log(`   Got ${apiTeams.length} teams (2025 fallback)`)
    } catch {}
  }

  // Build team ID lookup by matching API name to our slug
  const teamIds: Record<string, number> = {}
  let teamMatched = 0, teamMissed = 0

  // Collect unique team slugs from all WC matches
  const wcTeamSlugs = new Map<string, string>()  // slug → name
  for (const m of wcMatches) {
    wcTeamSlugs.set(m.team_a.slug, m.team_a.name)
    wcTeamSlugs.set(m.team_b.slug, m.team_b.name)
  }

  for (const [ourSlug, ourName] of wcTeamSlugs) {
    const match = apiTeams.find((t) => {
      const apiSlug = apiNameToSlug(t.team.name)
      return apiSlug === ourSlug || apiSlug === slugify(ourName)
    })
    if (match) {
      teamIds[ourSlug] = match.team.id
      teamMatched++
      if (dryRun) console.log(`   ✅ ${ourSlug} → team_id=${match.team.id}`)
    } else {
      teamMissed++
      if (dryRun) console.log(`   ⚠️  No team match for slug=${ourSlug} name=${ourName}`)
    }
  }

  console.log(`   Matched: ${teamMatched} / ${wcTeamSlugs.size} (missed: ${teamMissed})`)

  // ── 3. Write lookup files ─────────────────────────────────────────────────
  if (dryRun) {
    console.log('\n[dry-run] Would write:')
    console.log(`  data/wc-fixture-ids.json  (${fixtureMatched} entries)`)
    console.log(`  data/wc-team-ids.json     (${teamMatched} entries)`)
    return
  }

  fs.writeFileSync(path.join(DATA_DIR, 'wc-fixture-ids.json'), JSON.stringify(fixtureIds, null, 2))
  console.log(`\n✅ data/wc-fixture-ids.json written (${fixtureMatched} entries)`)

  fs.writeFileSync(path.join(DATA_DIR, 'wc-team-ids.json'), JSON.stringify(teamIds, null, 2))
  console.log(`✅ data/wc-team-ids.json written (${teamMatched} entries)`)

  if (fixtureMissed > 0 || teamMissed > 0) {
    console.log(`\n⚠️  Some entries could not be matched. Re-run with --dry-run to see details.`)
    console.log('   Add missing entries to API_NAME_TO_SLUG map in this script if needed.')
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
