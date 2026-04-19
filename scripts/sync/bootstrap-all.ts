/**
 * Full database bootstrap — run once per new league or after a fresh Supabase setup.
 * Runs all sync scripts in dependency order.
 *
 * Usage:
 *   tsx scripts/sync/bootstrap-all.ts
 *   tsx scripts/sync/bootstrap-all.ts --league 135   # bootstrap single new league
 *
 * Estimated API calls: ~1,500–2,000 for all 10 leagues from scratch.
 * Each step logs its own progress.
 */

import { execSync } from 'node:child_process'

const leagueFlag = (() => {
  const i = process.argv.indexOf('--league')
  return i !== -1 ? `--league ${process.argv[i + 1]}` : ''
})()

function run(script: string, args = '') {
  const cmd = `tsx ${script} ${args}`.trim()
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`▶  ${cmd}`)
  console.log('─'.repeat(60))
  execSync(cmd, { stdio: 'inherit' })
}

async function main() {
  // 1. Seed/update leagues in Supabase
  run('scripts/sync/sync-leagues.ts')

  // 2. Fetch teams + venues for all (or target) leagues
  run('scripts/sync/sync-teams.ts', leagueFlag)

  // 3. Fetch all fixtures for the season
  run('scripts/sync/sync-fixtures.ts', leagueFlag)

  // 4. Fetch standings
  run('scripts/sync/sync-standings.ts', leagueFlag)

  // 5. Fetch match events + stats for recent finished matches (last 90 days)
  //    Use --all to fetch ALL finished matches (expensive, split across days if needed)
  run('scripts/sync/sync-events.ts', `${leagueFlag} --days 90`.trim())

  // 6. Fetch predictions for upcoming matches
  run('scripts/sync/sync-predictions.ts', `${leagueFlag} --days 14`.trim())

  // 7. Fetch odds for upcoming matches
  run('scripts/sync/sync-odds.ts', `${leagueFlag} --days 14`.trim())

  // 8. Fetch injuries
  run('scripts/sync/sync-injuries.ts', leagueFlag)

  // 9. Fetch coaches
  run('scripts/sync/sync-coaches.ts', leagueFlag)

  // 10. Fetch player stats (paginated — slowest step)
  run('scripts/sync/sync-player-stats.ts', leagueFlag)

  // 11. Fetch squads — sets players.team_id so Squad tab works
  run('scripts/sync/sync-squads.ts', leagueFlag)

  // 12. Fetch lineups for upcoming matches
  run('scripts/sync/sync-lineups.ts')

  console.log('\n✅  Bootstrap complete. All tables populated.')
}

main().catch((err) => { console.error(err.message); process.exit(1) })
