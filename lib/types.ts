export interface Team {
  slug: string;
  name: string;
  shortName: string;
  confederation: string;
  fifaRanking: number;
  worldCupTitles: number;
  coach: string;
  founded: number;
  homeStadium: string;
  homeStadiumSlug: string;
  keyPlayers: string[];
  description: string;
  group: string;
  matches: string[];
}

export interface Stadium {
  slug: string;
  name: string;
  city: string;
  state: string;
  country: string;
  capacity: number;
  surface: string;
  opened: number;
  hostingFinal: boolean;
  worldCup2026Matches: number;
  description: string;
  teams: string[];
  matches: string[];
}

export interface Player {
  slug: string;
  name: string;
  nationality: string;
  teamSlug: string;
  teamName: string;
  position: string;
  dateOfBirth: string;
  age: number;
  height: string;
  club: string;
  clubLeague: string;
  kitNumber: number;
  caps: number;
  internationalGoals: number;
  worldCupGoals: number;
  marketValue: string;
  description: string;
  strengths: string[];
  preferredFoot: string;
  stadiumSlug: string;
}

export interface HeadToHead {
  played: number;
  franceWins?: number;
  brazilWins?: number;
  moroccoWins?: number;
  usaWins?: number;
  spainWins?: number;
  draws: number;
  lastMeeting: string;
  lastResult: string;
}

export interface Match {
  slug: string;
  homeTeamSlug: string;
  awayTeamSlug: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamShort: string;
  awayTeamShort: string;
  date: string;
  kickoffTime: string;
  timezone: string;
  stadiumSlug: string;
  stadiumName: string;
  city: string;
  stage: string;
  group: string;
  matchday: number;
  status: 'upcoming' | 'live' | 'finished';
  homeScore: number | null;
  awayScore: number | null;
  description: string;
  keyMatchups: string[];
  headToHead: HeadToHead;
  featuredPlayers: string[];
}
