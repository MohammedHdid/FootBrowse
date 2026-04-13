export interface Team {
  slug: string;
  name: string;
  code: string;
  flag_url: string;
  flag_large: string;
  confederation: string;
  fifa_rank: number;
  wc_titles: number;
  wc_appearances: number;
  best_result: string;
  coach: string;
  captain: string;
  color_primary: string;
  color_secondary: string;
  group: string;
  stadium_slug: string;
  form: string[];
  top_scorer_all_time: string;
  top_scorer_all_time_goals: number;
  overview: string;
  strengths: string[];
  weaknesses: string[];
  players: string[];
  matches: string[];
  meta_title: string;
  meta_description: string;
}

export interface Stadium {
  slug: string;
  name: string;
  city: string;
  state: string;
  country: string;
  capacity: number;
  surface: string;
  roof: string;
  opened: number;
  wc_matches: number;
  is_final_venue: boolean;
  photo_url: string;
  photo_credit: string;
  lat: number;
  lng: number;
  nearest_airport: string;
  airport_distance_km: number;
  nearest_city: string;
  transport: string;
  parking_available: boolean;
  hotel_affiliate_url: string;
  flight_affiliate_url: string;
  matches: string[];
  overview: string;
  meta_title: string;
  meta_description: string;
}

/** Legacy player shape — kept for reference only, not used in pages */
export interface Player {
  slug: string;
  name: string;
  country: string;
  country_code: string;
  flag_url: string;
  position: string;
  jersey_number: number;
  club: string;
  league: string;
  age: number;
  caps: number;
  international_goals: number;
  wc_goals: number;
  wc_appearances: number;
  photo_url: string;
  avatar_color: string;
  market_value_eur: number;
  strengths: string[];
  overview: string;
  team_slug: string;
  matches: string[];
  shirt_affiliate_url: string;
  meta_title: string;
  meta_description: string;
}

/** Enriched player record produced by scripts/sync-players.ts */
export interface SyncedPlayer {
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

/** players-by-team.json shape: teamSlug → array of players */
export type PlayersByTeam = Record<string, SyncedPlayer[]>;

export interface TeamRef {
  slug: string;
  name: string;
  code: string;
  flag_url: string;
  fifa_rank: number;
  color_primary: string;
}

export interface H2H {
  played: number;
  team_a_wins: number;
  draws: number;
  team_b_wins: number;
  last_match: string;
  last_wc_meeting: string;
  team_a_goals_scored: number;
  team_b_goals_scored: number;
}

export interface Odds {
  bookmaker: string;
  bookmaker_logo: string;
  team_a_win: number;
  draw: number;
  team_b_win: number;
  affiliate_url: string;
  cta: string;
}

export interface TvChannels {
  country: string;
  channels: string[];
}

export interface MatchTravel {
  hotel_affiliate_url: string;
  flight_affiliate_url: string;
  nearest_airport: string;
  hotel_cta: string;
  flight_cta: string;
}

export interface FAQ {
  q: string;
  a: string;
}

export interface MatchContent {
  preview: string;
  prediction: string;
  prediction_confidence: string;
  key_battle: string;
  stats_to_watch: string[];
  faq: FAQ[];
}

export interface Match {
  slug: string;
  type?: string;
  match_number?: number;
  stage: string;
  group?: string;
  date: string;
  kickoff_utc: string;
  kickoff_est: string;
  kickoff_gmt: string;
  kickoff_cet: string;
  stadium_slug: string;
  city: string;
  team_a: TeamRef;
  team_b: TeamRef;
  h2h?: H2H;
  odds?: Odds[];
  tv_channels: TvChannels[];
  travel: MatchTravel;
  content: MatchContent;
  meta_title?: string;
  meta_description?: string;
  schema_type: string;
}
