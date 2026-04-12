import type { Match, Team, Stadium, Player } from './types';

import matchesData from '@/data/matches.json';
import teamsData from '@/data/teams.json';
import stadiumsData from '@/data/stadiums.json';
import playersData from '@/data/players.json';

export const matches = matchesData as Match[];
export const teams = teamsData as Team[];
export const stadiums = stadiumsData as Stadium[];
export const players = playersData as Player[];

export function getMatch(slug: string): Match | undefined {
  return matches.find((m) => m.slug === slug);
}

export function getTeam(slug: string): Team | undefined {
  return teams.find((t) => t.slug === slug);
}

export function getStadium(slug: string): Stadium | undefined {
  return stadiums.find((s) => s.slug === slug);
}

export function getPlayer(slug: string): Player | undefined {
  return players.find((p) => p.slug === slug);
}

export function getTeamPlayers(teamSlug: string): Player[] {
  return players.filter((p) => p.team_slug === teamSlug);
}

export function getTeamMatches(teamSlug: string): Match[] {
  return matches.filter(
    (m) => m.team_a.slug === teamSlug || m.team_b.slug === teamSlug
  );
}

export function getStadiumMatches(stadiumSlug: string): Match[] {
  return matches.filter((m) => m.stadium_slug === stadiumSlug);
}
