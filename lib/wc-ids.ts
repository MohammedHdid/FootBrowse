/**
 * WC 2026 API ID lookups
 *
 * Reads the bootstrap files produced by:
 *   npx tsx scripts/sync/bootstrap-wc-api-ids.ts
 *
 * Files:
 *   data/wc-fixture-ids.json  — { [matchSlug]: apiFixtureId }
 *   data/wc-team-ids.json     — { [teamSlug]: apiTeamId }
 *
 * Returns null when the file doesn't exist or the slug isn't found.
 */

import fs from 'fs'
import path from 'path'

let _fixtureIds: Record<string, number> | null = null
let _teamIds: Record<string, number> | null = null

function loadFixtureIds(): Record<string, number> {
  if (!_fixtureIds) {
    const fp = path.join(process.cwd(), 'data', 'wc-fixture-ids.json')
    _fixtureIds = fs.existsSync(fp)
      ? (JSON.parse(fs.readFileSync(fp, 'utf-8')) as Record<string, number>)
      : {}
  }
  return _fixtureIds
}

function loadTeamIds(): Record<string, number> {
  if (!_teamIds) {
    const fp = path.join(process.cwd(), 'data', 'wc-team-ids.json')
    _teamIds = fs.existsSync(fp)
      ? (JSON.parse(fs.readFileSync(fp, 'utf-8')) as Record<string, number>)
      : {}
  }
  return _teamIds
}

/** Returns the API-Football fixture ID for a WC match slug, or null if not yet bootstrapped. */
export function getWcFixtureId(matchSlug: string): number | null {
  return loadFixtureIds()[matchSlug] ?? null
}

/** Returns the API-Football team ID for a WC team slug, or null if not yet bootstrapped. */
export function getWcTeamId(teamSlug: string): number | null {
  return loadTeamIds()[teamSlug] ?? null
}
