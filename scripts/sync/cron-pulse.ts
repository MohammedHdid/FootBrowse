/**
 * Cron Pulse — Orchestrates different sync frequencies for FootBrowse.
 * 
 * Usage:
 *   npx tsx scripts/sync/cron-pulse.ts --pulse live      (Run every 1-5 mins)
 *   npx tsx scripts/sync/cron-pulse.ts --pulse matchday  (Run every 15-30 mins)
 *   npx tsx scripts/sync/cron-pulse.ts --pulse daily     (Run every 24 hours at 3 AM)
 */

import { execSync } from 'node:child_process';

const pulse = process.argv.find(a => a.startsWith('--pulse='))?.slice(8) || 
              (process.argv.includes('--pulse') ? process.argv[process.argv.indexOf('--pulse') + 1] : 'live');

function run(cmd: string) {
  console.log(`\n[CRON] Executing: ${cmd}`);
  try {
    execSync(`npx tsx ${cmd}`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`[CRON ERROR] ${cmd} failed.`);
  }
}

async function main() {
  console.log(`\n⚽ FOOTBROWSE CRON PULSE: ${pulse.toUpperCase()}`);
  console.log(`Started at: ${new Date().toISOString()}`);

  switch (pulse) {
    case 'live':
      // Real-time scores and events - Pulse 1
      run('scripts/sync/sync-live.ts');

      console.log("\n[CRON] Resting 150s (2.5m) for second pulse...");
      await new Promise(resolve => setTimeout(resolve, 150000));

      // Pulse 2
      run('scripts/sync/sync-live.ts');
      break;

    case 'matchday':
      // Confirmed lineups (looking forward 2 hours)
      run('scripts/sync/sync-lineups.ts --next 2');
      // Injuries update
      run('scripts/sync/sync-injuries.ts');
      break;

    case 'daily':
      // 1. Sync today's fixtures (catch postponements)
      run(`scripts/sync/sync-fixtures.ts --date ${new Date().toISOString().slice(0, 10)}`);
      
      // 2. Nightly "True-up" (Perfecting events for yesterday's games)
      run('scripts/sync/sync-events.ts --days 1');
      
      // 3. Update League Tables
      run('scripts/sync/sync-standings.ts');
      
      // 4. Refresh betting odds for next 7 days
      run('scripts/sync/sync-odds.ts --days 7');
      break;

    default:
      console.error(`Unknown pulse type: ${pulse}`);
      process.exit(1);
  }

  console.log(`\n✅ Pulse complete: ${pulse.toUpperCase()}`);
}

main().catch(console.error);
