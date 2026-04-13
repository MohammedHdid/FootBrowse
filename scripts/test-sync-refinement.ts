// scripts/test-sync-refinement.ts
import fs from "node:fs";
import path from "node:path";

const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json/123";

async function fetchJSON(url) {
  const res = await fetch(url);
  return res.json();
}

async function run() {
  const teams = ["Brazil", "Morocco"];
  for (const name of teams) {
    console.log(`--- Testing ${name} ---`);
    const searchRes = await fetchJSON(`${SPORTSDB_BASE}/searchteams.php?t=${name}`);
    const sdb = searchRes.teams?.find(t => t.strSport === "Soccer");
    if (!sdb) {
      console.log(`No soccer team found for ${name}`);
      continue;
    }
    console.log(`ID: ${sdb.idTeam}, Sport: ${sdb.strSport}, Team: ${sdb.strTeam}`);
    
    const lastRes = await fetchJSON(`${SPORTSDB_BASE}/eventslast.php?id=${sdb.idTeam}`);
    if (lastRes.results) {
      const past = lastRes.results.filter(e => e.intHomeScore !== null && e.intAwayScore !== null);
      console.log(`Found ${lastRes.results.length} results, ${past.length} with scores.`);
      past.slice(0, 5).forEach(e => console.log(`  ${e.strEvent} | ${e.dateEvent} | ${e.intHomeScore}-${e.intAwayScore}`));
    } else {
      console.log("No last events found.");
    }
  }
}

run();
