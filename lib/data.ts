import type { Match, Team, Stadium, SyncedPlayer, PlayersByTeam } from './types';
import { getAllClubPlayers, getClubPlayer } from './club-players';

import matchesData from '@/data/matches.json';
import teamsData from '@/data/teams.json';
import stadiumsData from '@/data/stadiums.json';
import playersData from '@/data/players.json';
import playersByTeamData from '@/data/players-by-team.json';

export const matches = matchesData as Match[];
export const teams = teamsData as Team[];
export const stadiums = stadiumsData as Stadium[];
/** WC national team players only — use allPlayers for generateStaticParams */
export const players = playersData as unknown as SyncedPlayer[];
export const playersByTeam = playersByTeamData as unknown as PlayersByTeam;

/** Combined WC + club players — use for generateStaticParams and sitemaps */
export function getAllPlayers(): SyncedPlayer[] {
  return [...players, ...getAllClubPlayers()];
}

export function getMatch(slug: string): Match | undefined {
  return matches.find((m) => m.slug === slug);
}

export function getTeam(slug: string): Team | undefined {
  return teams.find((t) => t.slug === slug);
}

export function getStadium(slug: string): Stadium | undefined {
  return stadiums.find((s) => s.slug === slug);
}

/** Look up a player by slug — checks WC players first, then club players */
export function getPlayer(slug: string): SyncedPlayer | undefined {
  return players.find((p) => p.slug === slug) ?? getClubPlayer(slug);
}

/** Returns players for a team from the flat players array (uses teamSlug field). */
export function getTeamPlayers(teamSlug: string): SyncedPlayer[] {
  return players.filter((p) => p.teamSlug === teamSlug);
}

/** Returns players for a team from the pre-grouped players-by-team.json. */
export function getTeamPlayersByGroup(teamSlug: string): SyncedPlayer[] {
  return playersByTeam[teamSlug] ?? [];
}

export function getTeamMatches(teamSlug: string): Match[] {
  return matches.filter(
    (m) => m.team_a.slug === teamSlug || m.team_b.slug === teamSlug
  );
}

export function getStadiumMatches(stadiumSlug: string): Match[] {
  return matches.filter((m) => m.stadium_slug === stadiumSlug);
}
