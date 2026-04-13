/**
 * scripts/sync-players.ts
 *
 * Syncs World Cup 2026 squad data from football-data.org and enriches each
 * player with a photo/bio from TheSportsDB. Writes:
 *   - data/players.json          (flat array of all players)
 *   - data/players-by-team.json  (object keyed by teamSlug)
 *
 * Run locally:
 *   npm run sync:players
 *   (requires FOOTBALL_DATA_API_KEY in .env.local)
 *
 * Run in CI via GitHub Actions (uses secrets.FOOTBALL_DATA_API_KEY).
 */

import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Load .env.local for local development (zero-dependency parser)
// ---------------------------------------------------------------------------
try {
  const envPath = path.join(process.cwd(), ".env.local");
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // .env.local not found — rely on env vars already set (e.g. in CI)
}

// ---------------------------------------------------------------------------
// Safety check
// ---------------------------------------------------------------------------
const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
if (!API_KEY || API_KEY === "your_key_here") {
  throw new Error(
    "Missing FOOTBALL_DATA_API_KEY. " +
      "Add it to .env.local before running this script."
  );
}

// ---------------------------------------------------------------------------
// Slug overrides: API team name → slug used in our teams.json
// These 5 teams have different slugs in our data vs what the API name generates.
// ---------------------------------------------------------------------------
const TEAM_SLUG_OVERRIDES: Record<string, string> = {
  "United States":      "usa",
  "Czechia":            "czech-republic",
  "Bosnia-Herzegovina": "bosnia-and-herzegovina",
  "Cape Verde Islands": "cape-verde",
  "Congo DR":           "dr-congo",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface FDTeamSummary {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

interface FDCompetitionResponse {
  teams: FDTeamSummary[];
}

interface FDPlayer {
  id: number;
  name: string;
  position: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
}

interface FDTeamDetail {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  coach?: { name: string } | null;
  squad: FDPlayer[];
}

interface SportsDBPlayer {
  strPlayer: string;
  strThumb?: string | null;
  strCutout?: string | null;
  strDescriptionEN?: string | null;
}

interface SportsDBResponse {
  player: SportsDBPlayer[] | null;
}

interface SyncedPlayer {
  id: number;
  slug: string;
  name: string;
  firstName: string;
  lastName: string;
  position: string;
  dateOfBirth: string | null;
  nationality: string;
  shirtNumber: number | null;
  marketValue: number | null;
  photo_url: string | null;
  thumbnail_url: string | null;
  bio: string | null;
  teamId: number;
  teamName: string;
  teamSlug: string;
  teamCrest: string;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function toSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toTeamSlug(apiName: string): string {
  return TEAM_SLUG_OVERRIDES[apiName] ?? toSlug(apiName);
}

async function fetchJSON<T>(
  url: string,
  headers: Record<string, string> = {},
  retries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      headers: { "User-Agent": "FootBrowse/1.0", ...headers },
    });

    if (res.status === 429) {
      if (attempt === retries) break; // no more retries — throw below
      const waitMs = attempt * 60_000; // 1 min, 2 min, …
      console.warn(`  ⚠ Rate limited (429). Waiting ${waitMs / 1000}s before retry ${attempt + 1}/${retries}...`);
      await sleep(waitMs);
      continue;
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}`);
    }

    return res.json() as Promise<T>;
  }
  throw new Error(`Failed after ${retries} retries (rate limited): ${url}`);
}

// ---------------------------------------------------------------------------
// TheSportsDB photo lookup
// ---------------------------------------------------------------------------
async function lookupPhoto(
  playerName: string,
  lastName: string
): Promise<{ photo_url: string | null; thumbnail_url: string | null; bio: string | null }> {
  const trySearch = async (query: string): Promise<SportsDBPlayer[] | null> => {
    try {
      const url = `https://www.thesportsdb.com/api/v1/json/123/searchplayers.php?p=${encodeURIComponent(query)}`;
      // retries=1 → fail fast on 429; caller catches and returns null (no long wait)
      const data = await fetchJSON<SportsDBResponse>(url, {}, 1);
      return data.player ?? null;
    } catch {
      return null;
    }
  };

  let results = await trySearch(playerName);
  let matched: SportsDBPlayer | null = null;

  if (results && results.length > 0) {
    const normFull = normalize(playerName);
    matched = results.find((p) => normalize(p.strPlayer) === normFull) ?? null;
    if (!matched && lastName) {
      const normLast = normalize(lastName);
      matched = results.find((p) => normalize(p.strPlayer).includes(normLast)) ?? null;
    }
    if (!matched) matched = results[0];
  }

  // Retry with last name only if no match
  if (!matched && lastName) {
    results = await trySearch(lastName);
    if (results && results.length > 0) {
      const normLast = normalize(lastName);
      matched =
        results.find((p) => normalize(p.strPlayer).includes(normLast)) ??
        results[0];
    }
  }

  if (!matched) return { photo_url: null, thumbnail_url: null, bio: null };

  return {
    photo_url: matched.strThumb ?? null,
    thumbnail_url: matched.strCutout ?? null,
    bio: matched.strDescriptionEN ?? null,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const FD_HEADERS = { "X-Auth-Token": API_KEY! };

  // Step 1: Get all 48 WC teams (ids + names) from the competition endpoint
  console.log("Fetching WC 2026 team list from football-data.org...");
  const compResponse = await fetchJSON<FDCompetitionResponse>(
    "https://api.football-data.org/v4/competitions/WC/teams?season=2026",
    FD_HEADERS
  );

  const teamSummaries = compResponse.teams ?? [];
  console.log(`Found ${teamSummaries.length} teams.`);

  const allPlayers: SyncedPlayer[] = [];
  const playersByTeam: Record<string, SyncedPlayer[]> = {};
  const coachesBySlug: Record<string, string> = {};

  // Step 2: For each team, fetch full detail (which includes squad)
  for (let ti = 0; ti < teamSummaries.length; ti++) {
    const summary = teamSummaries[ti];
    const teamSlug = toTeamSlug(summary.name);

    console.log(`\n[${ti + 1}/${teamSummaries.length}] Fetching squad: ${summary.name} (id=${summary.id}, slug=${teamSlug})`);

    // Respect rate limit: 10 req/min on free tier → 9s between calls (safer margin)
    if (ti > 0) await sleep(9000);

    let teamDetail: FDTeamDetail;
    try {
      teamDetail = await fetchJSON<FDTeamDetail>(
        `https://api.football-data.org/v4/teams/${summary.id}`,
        FD_HEADERS
      );
    } catch (err) {
      console.warn(`  ⚠ Failed to fetch team ${summary.name}: ${err}`);
      playersByTeam[teamSlug] = [];
      continue;
    }

    const squad = teamDetail.squad ?? [];
    console.log(`  ${squad.length} players in squad`);

    const teamPlayers: SyncedPlayer[] = [];

    // Step 3: Enrich each player with TheSportsDB photo
    for (let pi = 0; pi < squad.length; pi++) {
      const fdPlayer = squad[pi];
      const playerName = fdPlayer.name;

      const nameParts = playerName.split(" ");
      const firstName = nameParts[0] ?? "";
      const lastName = nameParts.slice(1).join(" ") ?? "";

      console.log(`  Processing player ${pi + 1}/${squad.length}: ${playerName}...`);

      const { photo_url, thumbnail_url, bio } = await lookupPhoto(playerName, lastName);

      const syncedPlayer: SyncedPlayer = {
        id: fdPlayer.id,
        slug: toSlug(playerName),
        name: playerName,
        firstName,
        lastName,
        position: fdPlayer.position ?? "Unknown",
        dateOfBirth: fdPlayer.dateOfBirth ?? null,
        nationality: fdPlayer.nationality ?? "",
        shirtNumber: null,   // not provided by free-tier API
        marketValue: null,   // not provided by free-tier API
        photo_url,
        thumbnail_url,
        bio,
        teamId: summary.id,
        teamName: summary.name,
        teamSlug,
        teamCrest: summary.crest,
      };

      allPlayers.push(syncedPlayer);
      teamPlayers.push(syncedPlayer);

      // TheSportsDB public key: 1s delay (~60 req/min, safe for public key)
      await sleep(1000);
    }

    playersByTeam[teamSlug] = teamPlayers;

    // Save coach name from API into teams.json
    const coachName = teamDetail.coach?.name ?? null;
    if (coachName) {
      coachesBySlug[teamSlug] = coachName;
      console.log(`  Coach: ${coachName}`);
    }
  }

  // Step 4: Write output files
  const dataDir = path.join(process.cwd(), "data");

  fs.writeFileSync(
    path.join(dataDir, "players.json"),
    JSON.stringify(allPlayers, null, 2),
    "utf-8"
  );
  console.log(`\nWrote data/players.json (${allPlayers.length} players)`);

  fs.writeFileSync(
    path.join(dataDir, "players-by-team.json"),
    JSON.stringify(playersByTeam, null, 2),
    "utf-8"
  );
  console.log(`Wrote data/players-by-team.json (${Object.keys(playersByTeam).length} teams)`);

  // Patch teams.json with real coach names from the API
  const teamsPath = path.join(dataDir, "teams.json");
  const teamsJson = JSON.parse(fs.readFileSync(teamsPath, "utf-8")) as { slug: string; coach: string; [key: string]: unknown }[];
  let coachUpdates = 0;
  const patchedTeams = teamsJson.map((team) => {
    const apiCoach = coachesBySlug[team.slug];
    if (apiCoach && apiCoach !== team.coach) {
      console.log(`  Coach update: ${team.slug} "${team.coach}" → "${apiCoach}"`);
      coachUpdates++;
      return { ...team, coach: apiCoach };
    }
    return team;
  });
  fs.writeFileSync(teamsPath, JSON.stringify(patchedTeams, null, 2), "utf-8");
  console.log(`Patched ${coachUpdates} coach name(s) in data/teams.json`);

  console.log(`\nSync complete. ${allPlayers.length} players saved.`);
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
