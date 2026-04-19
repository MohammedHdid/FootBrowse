// @ts-nocheck
/**
 * scripts/sync-sportsdb.ts
 *
 * Enriches FootBrowse data from TheSportsDB free tier (API key "123").
 * Patches:
 *   - data/teams.json    → nickname, badge, kit, coach, bio, last_match, form, sportsdb_id
 *   - data/stadiums.json → sportsdb_photos, sportsdb_description
 *   - data/matches.json  → real H2H stats (played, wins, goals, last/WC meeting)
 */

import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json/123";
const DATA_DIR = path.join(process.cwd(), "data");

const TEAM_NAME_OVERRIDES: Record<string, string> = {
  "United States": "USA",
  "South Korea": "South Korea",
  "Ivory Coast": "Ivory Coast",
  "DR Congo": "DR Congo",
  "Bosnia and Herzegovina": "Bosnia-Herzegovina",
  "Curaçao": "Curacao",
  "Czech Republic": "Czech Republic",
};

// Known Stadium IDs (from manual search)
const STADIUM_ID_MAP: Record<string, string> = {
  "estadio-azteca": "16559",
  "bc-place": "25843",
  "estadio-akron": "17548",
  "estadio-bbva": "21191",
  "at-stadium": "16182", // Dallas Cowboys home
  "levis-stadium": "16170", // Levi's Stadium
};

const API_DELAY_MS = 2000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SportsDBTeam {
  idTeam: string;
  strTeam: string;
  strSport: string;
  strBadge: string | null;
  strEquipment: string | null;
  strKeywords: string | null;
  strFacebook: string | null;
  strTwitter: string | null;
  strInstagram: string | null;
  strYoutube: string | null;
  intFormedYear: string | null;
  strDescriptionEN: string | null;
  strColour1: string | null;
  strColour2: string | null;
}

interface SportsDBEvent {
  idEvent: string;
  strEvent: string;
  dateEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strLeague: string;
}

/** H2H Result accumulator */
interface H2HStats {
  played: number;
  aWins: number;
  bWins: number;
  draws: number;
  aGoals: number;
  bGoals: number;
  lastMatch: string;
  lastWCMatch: string;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJSON<T>(url: string, retries = 2): Promise<T | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "FootBrowse/1.0" } });
      if (res.status === 429) {
        await sleep(attempt * 15000);
        continue;
      }
      if (!res.ok) return null;
      return await res.json() as T;
    } catch (e) {
      if (attempt < retries) await sleep(5000);
    }
  }
  return null;
}

function cleanUrl(u: string | null): string | undefined {
  if (!u || u.trim() === "") return undefined;
  let url = u.trim().replace(/\\/g, "");
  if (!url.startsWith("http")) url = "https://" + url;
  return url;
}

function extractNickname(kw: string | null): string | undefined {
  if (!kw) return undefined;
  const cleaned = kw.replace(/\t/g, "").trim();
  return cleaned.split(",")[0].trim() || undefined;
}

// ---------------------------------------------------------------------------
// Main Logic
// ---------------------------------------------------------------------------

async function main() {
  console.log("🚀 Starting TheSportsDB Final Enrichment...");

  const teams = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "teams.json"), "utf8"));
  const stadiums = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "stadiums.json"), "utf8"));
  const matches = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "matches.json"), "utf8"));

  // --- Phase 1: Team & Form Enrichment ---
  console.log("\n--- PHASE 1: Teams & Form ---");
  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    const searchName = TEAM_NAME_OVERRIDES[team.name] ?? team.name;
    console.log(`[${i + 1}/${teams.length}] ${team.name}`);

    // Team Search
    const searchRes = await fetchJSON<{ teams: SportsDBTeam[] | null }>(`${SPORTSDB_BASE}/searchteams.php?t=${encodeURIComponent(searchName)}`);
    await sleep(API_DELAY_MS);

    const sdb = searchRes?.teams?.find(t => t.strSport === "Soccer");

    if (sdb) {
      team.sportsdb_id = sdb.idTeam;
      if (sdb.strBadge) team.badge_url = sdb.strBadge;
      if (sdb.strEquipment) team.kit_url = sdb.strEquipment;
      const nick = extractNickname(sdb.strKeywords);
      if (nick) team.nickname = nick;
      if (sdb.strDescriptionEN) team.sportsdb_description = sdb.strDescriptionEN;

      // Last 15 Matches (to find 5 valid past ones)
      const lastRes = await fetchJSON<{ results: SportsDBEvent[] | null }>(`${SPORTSDB_BASE}/eventslast.php?id=${sdb.idTeam}`);
      await sleep(API_DELAY_MS);

      if (lastRes?.results) {
        // Collect matches that have scores (past matches)
        const pastMatches = lastRes.results.filter(evt => evt.intHomeScore !== null && evt.intAwayScore !== null);
        
        const streak = pastMatches.slice(0, 5).map(evt => {
          const isHome = evt.strEvent.toLowerCase().startsWith(searchName.toLowerCase());
          const homeS = parseInt(evt.intHomeScore || "0");
          const awayS = parseInt(evt.intAwayScore || "0");
          if (homeS === awayS) return "D";
          if (isHome) return homeS > awayS ? "W" : "L";
          return awayS > homeS ? "W" : "L";
        });
        team.form = streak.reverse(); 
        
        if (pastMatches.length > 0) {
          const top = pastMatches[0];
          team.last_match = {
            date: top.dateEvent,
            event: top.strEvent,
            score: `${top.intHomeScore}-${top.intAwayScore}`,
            competition: top.strLeague
          };
        }
      }
    }
  }

  // --- Phase 2: Stadium Enrichment ---
  console.log("\n--- PHASE 2: Stadiums ---");
  for (let i = 0; i < stadiums.length; i++) {
    const stadium = stadiums[i];
    const sdbId = STADIUM_ID_MAP[stadium.slug];
    console.log(`[${i + 1}/${stadiums.length}] ${stadium.name} (ID: ${sdbId || "Search"})`);

    let venue = null;
    if (sdbId) {
      const res = await fetchJSON<{ venues: any[] }>(`${SPORTSDB_BASE}/lookuptable.php?id=${sdbId}`); // lookuptable? No, lookupvenue.php?id=...
      const res2 = await fetchJSON<{ venues: any[] }>(`${SPORTSDB_BASE}/lookupvenue.php?id=${sdbId}`);
      venue = res2?.venues?.[0];
    } else {
      const searchRes = await fetchJSON<{ venues: any[] }>(`${SPORTSDB_BASE}/searchvenues.php?v=${encodeURIComponent(stadium.name)}`);
      venue = searchRes?.venues?.[0];
    }
    await sleep(API_DELAY_MS);

    if (venue) {
      const photos = [venue.strFanart1, venue.strFanart2, venue.strFanart3, venue.strFanart4].filter(Boolean);
      if (photos.length > 0) stadium.sportsdb_photos = photos;
      if (venue.strDescriptionEN) stadium.sportsdb_description = venue.strDescriptionEN;
    }
  }

  // --- Phase 3: Match H2H Enrichment ---
  console.log("\n--- PHASE 3: Match H2H ---");
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    console.log(`[${i + 1}/${matches.length}] ${m.team_a.name} vs ${m.team_b.name}`);

    const queries = [`${m.team_a.name}_vs_${m.team_b.name}`, `${m.team_b.name}_vs_${m.team_a.name}`];
    const allMatches = new Map<string, SportsDBEvent>();

    for (const q of queries) {
      const h2hRes = await fetchJSON<{ event: SportsDBEvent[] | null }>(`${SPORTSDB_BASE}/searchevents.php?e=${encodeURIComponent(q)}`);
      await sleep(API_DELAY_MS);
      if (h2hRes?.event) {
        h2hRes.event.forEach(e => {
          if (e.idEvent && e.intHomeScore !== null && e.intAwayScore !== null && e.dateEvent < "2026-06-01") {
            allMatches.set(e.idEvent, e);
          }
        });
      }
    }

    const validEvents = Array.from(allMatches.values()).sort((a, b) => b.dateEvent.localeCompare(a.dateEvent));

    const stats: H2HStats = {
      played: 0, aWins: 0, bWins: 0, draws: 0, aGoals: 0, bGoals: 0,
      lastMatch: "No recent meetings",
      lastWCMatch: "First meeting"
    };

    if (validEvents.length > 0) {
      stats.played = validEvents.length;
      validEvents.forEach(e => {
        const h = parseInt(e.intHomeScore || "0");
        const a = parseInt(e.intAwayScore || "0");
        const isTeamAHome = e.strHomeTeam.toLowerCase().includes(m.team_a.name.toLowerCase());
        
        let teamAScore = isTeamAHome ? h : a;
        let teamBScore = isTeamAHome ? a : h;

        stats.aGoals += teamAScore;
        stats.bGoals += teamBScore;

        if (teamAScore > teamBScore) stats.aWins++;
        else if (teamBScore > teamAScore) stats.bWins++;
        else stats.draws++;

        // Last WC Meeting
        if (e.strLeague.toLowerCase().includes("world cup") && stats.lastWCMatch === "First meeting") {
          stats.lastWCMatch = `${e.strHomeTeam} vs ${e.strAwayTeam} ${h}-${a} (${e.dateEvent.split("-")[0]})`;
        }
      });

      const last = validEvents[0];
      stats.lastMatch = `${last.strHomeTeam} vs ${last.strAwayTeam} ${last.intHomeScore}-${last.intAwayScore} · ${new Date(last.dateEvent).getFullYear()}`;
    }

    m.h2h = {
      played: stats.played,
      team_a_wins: stats.aWins,
      draws: stats.draws,
      team_b_wins: stats.bWins,
      last_match: stats.lastMatch,
      last_wc_meeting: stats.lastWCMatch,
      team_a_goals_scored: stats.aGoals,
      team_b_goals_scored: stats.bGoals
    };
  }

  // Save
  fs.writeFileSync(path.join(DATA_DIR, "teams.json"), JSON.stringify(teams, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, "stadiums.json"), JSON.stringify(stadiums, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, "matches.json"), JSON.stringify(matches, null, 2));
  console.log("\n✅ All data enriched and saved!");
}

main().catch(console.error);
