/**
 * TASK 17 — Coach Sync
 *
 * Fetches coach data for all teams (WC national + club) and caches to
 * data/coaches/{team-slug}.json
 *
 * Club coaches were bootstrapped in TASK 15 (125 files exist).
 * WC national team coaches (48) are fetched here.
 *
 * Usage:
 *   npx tsx scripts/sync/weekly-coaches.ts           # all missing teams
 *   npx tsx scripts/sync/weekly-coaches.ts --wc      # WC teams only
 *   npx tsx scripts/sync/weekly-coaches.ts --all     # force refresh all
 *   npx tsx scripts/sync/weekly-coaches.ts --dry-run # show plan, no writes
 *
 * API calls: 1 per team (GET /coachs?team={id})
 * Rate limit: 10 req/min (handled by api-client)
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

// ── Types ────────────────────────────────────────────────────────────────────

interface ApiCoachCareer {
  team: { id: number; name: string; logo: string }
  start: string | null
  end: string | null
}

interface ApiCoach {
  id: number
  name: string
  photo: string | null
  nationality: string | null
  age: number | null
  career: ApiCoachCareer[]
}

interface CoachFile {
  id: number | null
  name: string
  photo: string | null
  nationality: string | null
  age: number | null
  team_id: number
  team_slug: string
  fetched_at: string
  career: Array<{
    team_id: number
    team_name: string
    team_logo: string
    start: string | null
    end: string | null
  }>
}

interface TeamEntry {
  teamId: number
  teamSlug: string
  teamName: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const DATA_DIR    = path.join(process.cwd(), 'data')
const COACHES_DIR = path.join(DATA_DIR, 'coaches')

function loadEnv(): void {
  if (!fs.existsSync(COACHES_DIR)) fs.mkdirSync(COACHES_DIR, { recursive: true })
}

function coachFilePath(teamSlug: string): string {
  return path.join(COACHES_DIR, `${teamSlug}.json`)
}

function coachExists(teamSlug: string): boolean {
  return fs.existsSync(coachFilePath(teamSlug))
}

function writeCoach(coach: CoachFile): void {
  fs.writeFileSync(coachFilePath(coach.team_slug), JSON.stringify(coach, null, 2))
}

// ── Build team list ──────────────────────────────────────────────────────────

function getWcTeams(): TeamEntry[] {
  // Derive WC team IDs from players.json (each player has teamId + teamSlug)
  const players: Array<{ teamId: number; teamSlug: string; teamName: string }> =
    JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'players.json'), 'utf-8'))

  const seen = new Map<string, TeamEntry>()
  for (const p of players) {
    if (!seen.has(p.teamSlug)) {
      seen.set(p.teamSlug, { teamId: p.teamId, teamSlug: p.teamSlug, teamName: p.teamName })
    }
  }
  return Array.from(seen.values())
}

function getClubTeams(): TeamEntry[] {
  const clubs: Array<{ id: number; slug: string; name: string }> =
    JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'club-teams.json'), 'utf-8'))
  return clubs.map((c) => ({ teamId: c.id, teamSlug: c.slug, teamName: c.name }))
}

// ── Coach selection ──────────────────────────────────────────────────────────

/**
 * From the list of coaches the API returns for a team, pick the current one.
 *
 * The API returns every coach who ever managed the team. We need the one with
 * an active career entry (end === null) for this specific teamId. If multiple
 * exist, take the most recently started. If none are active, fall back to the
 * most recently ended one for this team.
 */
function selectCurrentCoach(coaches: ApiCoach[], teamId: number): ApiCoach | null {
  if (!coaches || coaches.length === 0) return null

  // Coaches with an active (end=null) entry for this team
  const active = coaches.filter((c) =>
    c.career.some((e) => e.team.id === teamId && e.end === null)
  )

  if (active.length > 0) {
    // Sort by most recent start for this team
    return active.sort((a, b) => {
      const aStart = a.career.find((e) => e.team.id === teamId && e.end === null)?.start ?? ''
      const bStart = b.career.find((e) => e.team.id === teamId && e.end === null)?.start ?? ''
      return bStart.localeCompare(aStart)
    })[0]
  }

  // No active entry — pick coach with the most recent start for this team
  const withTeam = coaches.filter((c) => c.career.some((e) => e.team.id === teamId))
  if (withTeam.length > 0) {
    return withTeam.sort((a, b) => {
      const latestStart = (c: ApiCoach) =>
        c.career
          .filter((e) => e.team.id === teamId)
          .map((e) => e.start ?? '')
          .sort()
          .reverse()[0] ?? ''
      return latestStart(b).localeCompare(latestStart(a))
    })[0]
  }

  return coaches[0]
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  loadEnv()

  const args = process.argv.slice(2)
  const wcOnly  = args.includes('--wc')
  const forceAll = args.includes('--all')
  const dryRun  = args.includes('--dry-run')

  const apiKey = process.env.API_FOOTBALL_KEY ?? ''
  if (!apiKey) {
    console.error('❌  API_FOOTBALL_KEY not set in .env.local')
    process.exit(1)
  }
  const api = createApiClient(apiKey)

  // Build target list
  const allTeams: TeamEntry[] = wcOnly
    ? getWcTeams()
    : [...getWcTeams(), ...getClubTeams()]

  const STALE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

  const targets = forceAll
    ? allTeams
    : allTeams.filter((t) => {
        if (!coachExists(t.teamSlug)) return true
        try {
          const file = JSON.parse(fs.readFileSync(coachFilePath(t.teamSlug), 'utf-8'))
          const age = Date.now() - new Date(file.fetched_at).getTime()
          return age > STALE_MS
        } catch {
          return true // re-fetch if file is unreadable
        }
      })

  console.log(`\nCoach sync`)
  console.log(`  Mode:    ${wcOnly ? 'WC only' : 'all teams'}${forceAll ? ' (force refresh)' : ' (missing only)'}`)
  console.log(`  Targets: ${targets.length} teams`)
  if (dryRun) {
    console.log('\n  [DRY RUN] Would fetch:')
    for (const t of targets) console.log(`    ${t.teamSlug} (id=${t.teamId})`)
    return
  }
  console.log()

  let saved = 0
  let noCoach = 0
  let errors = 0

  for (const team of targets) {
    try {
      const result = await api.get<ApiCoach[]>('/coachs', { team: String(team.teamId) })

      if (!result || result.length === 0) {
        // Write a stub so we don't keep retrying
        const stub: CoachFile = {
          id: null,
          name: 'Unknown',
          photo: null,
          nationality: null,
          age: null,
          team_id: team.teamId,
          team_slug: team.teamSlug,
          fetched_at: new Date().toISOString(),
          career: [],
        }
        writeCoach(stub)
        console.log(`  ⚠ ${team.teamSlug} — no coach found, wrote stub`)
        noCoach++
        continue
      }

      // Pick the coach with an active appointment for this team
      const c = selectCurrentCoach(result, team.teamId)
      if (!c) {
        console.log(`  ⚠ ${team.teamSlug} — could not select current coach from ${result.length} results`)
        noCoach++
        continue
      }
      const coach: CoachFile = {
        id: c.id,
        name: c.name,
        photo: c.photo ?? null,
        nationality: c.nationality ?? null,
        age: c.age ?? null,
        team_id: team.teamId,
        team_slug: team.teamSlug,
        fetched_at: new Date().toISOString(),
        career: (c.career ?? []).map((entry) => ({
          team_id:   entry.team.id,
          team_name: entry.team.name,
          team_logo: entry.team.logo,
          start:     entry.start,
          end:       entry.end,
        })),
      }
      writeCoach(coach)
      console.log(`  ✅ ${team.teamSlug} — ${c.name} (${c.nationality ?? 'unknown'})`)
      saved++
    } catch (err) {
      console.error(`  ❌ ${team.teamSlug} — ${(err as Error).message}`)
      errors++
    }
  }

  console.log(`\n✅ Done`)
  console.log(`   Saved:    ${saved}`)
  console.log(`   No coach: ${noCoach}`)
  console.log(`   Errors:   ${errors}`)
  console.log(`   Total coaches on disk: ${fs.readdirSync(COACHES_DIR).length}`)
}

main().catch((err) => { console.error(err); process.exit(1) })
