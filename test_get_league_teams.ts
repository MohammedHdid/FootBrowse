import { getLeagueTeams } from './lib/league-teams.js'
import { getLeague } from './lib/leagues.js'

async function run() {
  try {
    const l = await getLeague('primeira-liga');
    console.log("League ID:", l.id)
    const teams = await getLeagueTeams(l);
    console.log("Teams mapped:", teams.length)
  } catch (err) {
    console.error("Error:", err)
  }
}

run();
