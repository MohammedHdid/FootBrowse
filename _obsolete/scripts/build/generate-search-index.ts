/**
 * scripts/build/generate-search-index.ts
 *
 * Generates public/search-index.json — flat array of all searchable entities.
 * Run as prebuild step: "prebuild": "tsx scripts/build/generate-search-index.ts"
 *
 * Usage:
 *   npx tsx scripts/build/generate-search-index.ts
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public", "search-index.json");

type SearchEntry =
  | { type: "team";   name: string; slug: string; league: string; leagueName: string; logo: string }
  | { type: "player"; name: string; slug: string; team: string; teamSlug: string; photo: string; league: string }
  | { type: "match";  name: string; slug: string; league: string; leagueName: string; date: string; leagueSeason: string };

function readJson<T>(relPath: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), "utf-8")) as T;
}

const leagues = readJson<Array<{ slug: string; name: string; season: number; logo: string }>>("data/leagues.json");

// Only index current-season leagues (skip world-cup-2022)
const CURRENT_LEAGUE_FILES: Record<string, string> = {
  "world-cup":                "world-cup-2026.json",
  "premier-league":           "premier-league-2025.json",
  "la-liga":                  "la-liga-2025.json",
  "bundesliga":               "bundesliga-2025.json",
  "uefa-champions-league":    "uefa-champions-league-2025.json",
};

interface RawFixture {
  fixture_id: number;
  slug: string;
  date: string;
  home_team: { name: string; slug: string };
  away_team: { name: string; slug: string };
}

interface RawClubTeam {
  slug: string;
  name: string;
  logo: string;
  primary_league_slug: string;
}

interface RawPlayer {
  slug: string;
  name: string;
  photo_url: string | null;
  teamName: string;
  teamSlug: string;
  primaryLeagueSlug?: string;
}

interface RawWCTeam {
  slug: string;
  name: string;
  badge_url: string;
}

const entries: SearchEntry[] = [];

// ── WC teams ─────────────────────────────────────────────────────────────────
const wcTeams = readJson<RawWCTeam[]>("data/teams.json");
for (const t of wcTeams) {
  entries.push({
    type: "team",
    name: t.name,
    slug: t.slug,
    league: "world-cup",
    leagueName: "World Cup 2026",
    logo: t.badge_url,
  });
}

// ── Club teams ────────────────────────────────────────────────────────────────
const clubTeams = readJson<RawClubTeam[]>("data/club-teams.json");
for (const t of clubTeams) {
  const league = leagues.find((l) => l.slug === t.primary_league_slug);
  entries.push({
    type: "team",
    name: t.name,
    slug: t.slug,
    league: t.primary_league_slug,
    leagueName: league?.name ?? t.primary_league_slug,
    logo: t.logo,
  });
}

// ── WC players ────────────────────────────────────────────────────────────────
const wcPlayers = readJson<RawPlayer[]>("data/players.json");
for (const p of wcPlayers) {
  entries.push({
    type: "player",
    name: p.name,
    slug: p.slug,
    team: p.teamName,
    teamSlug: p.teamSlug,
    photo: p.photo_url ?? "",
    league: "world-cup",
  });
}

// ── Club players ──────────────────────────────────────────────────────────────
const clubPlayers = readJson<RawPlayer[]>("data/club-players.json");
for (const p of clubPlayers) {
  entries.push({
    type: "player",
    name: p.name,
    slug: p.slug,
    team: p.teamName,
    teamSlug: p.teamSlug,
    photo: p.photo_url ?? "",
    league: p.primaryLeagueSlug ?? "",
  });
}

// ── Fixtures ──────────────────────────────────────────────────────────────────
for (const [leagueSlug, file] of Object.entries(CURRENT_LEAGUE_FILES)) {
  const filePath = path.join(ROOT, "data/fixtures", file);
  if (!fs.existsSync(filePath)) continue;
  const fixtures = readJson<RawFixture[]>(`data/fixtures/${file}`);
  const league = leagues.find((l) => l.slug === leagueSlug);
  const leagueName = league?.name ?? leagueSlug;
  const seasonYear = league?.season ?? 2025;
  const leagueSeason = `${leagueSlug}-${seasonYear}`;

  for (const f of fixtures) {
    entries.push({
      type: "match",
      name: `${f.home_team.name} vs ${f.away_team.name}`,
      slug: f.slug,
      league: leagueSlug,
      leagueName,
      date: f.date,
      leagueSeason,
    });
  }
}

fs.writeFileSync(OUT, JSON.stringify(entries), "utf-8");
console.log(`✓ Search index: ${entries.length} entries → public/search-index.json`);
