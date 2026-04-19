-- FootBrowse — Initial Schema
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ulriptdnuacjdlpciifr/sql

-- ─────────────────────────────────────────────────────────────────────────────
-- CORE TABLES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leagues (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  name            text NOT NULL,
  country         text,
  logo            text,
  flag            text,
  api_id          integer,
  season          integer,
  season_start    date,
  season_end      date,
  type            text,
  priority        integer DEFAULT 99,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS venues (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  name            text,
  city            text,
  state           text,
  country         text,
  capacity        integer,
  photo           text,
  api_football_id integer,
  surface         text,
  lat             numeric(9,6),
  lng             numeric(9,6),
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teams (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  name            text NOT NULL,
  logo            text,
  country         text,
  founded         integer,
  api_football_id integer,
  league_id       uuid REFERENCES leagues(id) ON DELETE SET NULL,
  venue_id        uuid REFERENCES venues(id)  ON DELETE SET NULL,
  -- WC-specific
  is_national     boolean DEFAULT false,
  flag_url        text,
  flag_large      text,
  confederation   text,
  fifa_rank       integer,
  wc_titles       integer,
  wc_group        text,
  color_primary   text,
  color_secondary text,
  -- shared
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  synced_at       timestamptz
);

CREATE TABLE IF NOT EXISTS players (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  name            text NOT NULL,
  photo           text,
  position        text,
  nationality     text,
  date_of_birth   date,
  shirt_number    integer,
  api_football_id integer,
  team_id         uuid REFERENCES teams(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  synced_at       timestamptz
);

CREATE TABLE IF NOT EXISTS coaches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         uuid REFERENCES teams(id) ON DELETE CASCADE UNIQUE,
  name            text,
  photo           text,
  nationality     text,
  age             integer,
  api_football_id integer,
  career          jsonb DEFAULT '[]',
  created_at      timestamptz DEFAULT now(),
  synced_at       timestamptz
);

CREATE TABLE IF NOT EXISTS matches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  fixture_id      integer UNIQUE,
  league_id       uuid REFERENCES leagues(id) ON DELETE SET NULL,
  home_id         uuid REFERENCES teams(id)   ON DELETE SET NULL,
  away_id         uuid REFERENCES teams(id)   ON DELETE SET NULL,
  venue_id        uuid REFERENCES venues(id)  ON DELETE SET NULL,
  date            date NOT NULL,
  kickoff_utc     text,
  status          text DEFAULT 'NS',
  score_home      integer,
  score_away      integer,
  stage           text,
  matchday        integer,
  group_name      text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  synced_at       timestamptz
);

CREATE TABLE IF NOT EXISTS standings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id       uuid REFERENCES leagues(id) ON DELETE CASCADE,
  team_id         uuid REFERENCES teams(id)   ON DELETE CASCADE,
  season          integer NOT NULL,
  rank            integer,
  points          integer,
  played          integer,
  won             integer,
  drawn           integer,
  lost            integer,
  goals_for       integer,
  goals_against   integer,
  goal_diff       integer,
  form            text,
  description     text,
  created_at      timestamptz DEFAULT now(),
  synced_at       timestamptz,
  UNIQUE(league_id, team_id, season)
);

CREATE TABLE IF NOT EXISTS player_stats (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       uuid REFERENCES players(id) ON DELETE CASCADE,
  league_id       uuid REFERENCES leagues(id) ON DELETE SET NULL,
  season          integer NOT NULL,
  club            text,
  appearances     integer DEFAULT 0,
  minutes         integer DEFAULT 0,
  goals           integer DEFAULT 0,
  assists         integer DEFAULT 0,
  yellow_cards    integer DEFAULT 0,
  red_cards       integer DEFAULT 0,
  rating          numeric(4,2),
  shots_on        integer,
  key_passes      integer,
  created_at      timestamptz DEFAULT now(),
  synced_at       timestamptz,
  UNIQUE(player_id, league_id, season)
);

CREATE TABLE IF NOT EXISTS team_stats (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         uuid REFERENCES teams(id)   ON DELETE CASCADE,
  league_id       uuid REFERENCES leagues(id) ON DELETE SET NULL,
  season          integer NOT NULL,
  played          integer DEFAULT 0,
  wins            integer DEFAULT 0,
  draws           integer DEFAULT 0,
  losses          integer DEFAULT 0,
  goals_for       integer DEFAULT 0,
  goals_against   integer DEFAULT 0,
  clean_sheets    integer DEFAULT 0,
  failed_to_score integer DEFAULT 0,
  form            text,
  created_at      timestamptz DEFAULT now(),
  synced_at       timestamptz,
  UNIQUE(team_id, league_id, season)
);

CREATE TABLE IF NOT EXISTS match_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        uuid REFERENCES matches(id) ON DELETE CASCADE,
  type            text,
  detail          text,
  minute          integer,
  extra_minute    integer,
  player_name     text,
  player_api_id   integer,
  assist_name     text,
  assist_api_id   integer,
  team_id         uuid REFERENCES teams(id)   ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS match_stats (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        uuid REFERENCES matches(id) ON DELETE CASCADE,
  team_id         uuid REFERENCES teams(id)   ON DELETE SET NULL,
  possession      integer,
  shots_on        integer,
  shots_total     integer,
  corners         integer,
  fouls           integer,
  yellow_cards    integer,
  red_cards       integer,
  xg              numeric(5,2),
  pass_accuracy   integer,
  offsides        integer,
  saves           integer,
  created_at      timestamptz DEFAULT now(),
  synced_at       timestamptz,
  UNIQUE(match_id, team_id)
);

CREATE TABLE IF NOT EXISTS lineups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        uuid REFERENCES matches(id) ON DELETE CASCADE,
  team_id         uuid REFERENCES teams(id)   ON DELETE SET NULL,
  formation       text,
  start_xi        jsonb DEFAULT '[]',
  bench           jsonb DEFAULT '[]',
  coach_name      text,
  created_at      timestamptz DEFAULT now(),
  synced_at       timestamptz,
  UNIQUE(match_id, team_id)
);

CREATE TABLE IF NOT EXISTS h2h (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team1_slug      text NOT NULL,
  team2_slug      text NOT NULL,
  played          integer DEFAULT 0,
  team1_wins      integer DEFAULT 0,
  team2_wins      integer DEFAULT 0,
  draws           integer DEFAULT 0,
  last_matches    jsonb DEFAULT '[]',
  created_at      timestamptz DEFAULT now(),
  synced_at       timestamptz,
  UNIQUE(team1_slug, team2_slug)
);

CREATE TABLE IF NOT EXISTS injuries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_api_id   integer,
  player_name     text,
  team_id         uuid REFERENCES teams(id)   ON DELETE SET NULL,
  league_id       uuid REFERENCES leagues(id) ON DELETE SET NULL,
  type            text,
  reason          text,
  match_id        uuid REFERENCES matches(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now(),
  synced_at       timestamptz
);

CREATE TABLE IF NOT EXISTS predictions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        uuid REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  fixture_id      integer UNIQUE,
  advice          text,
  winner_api_id   integer,
  winner_name     text,
  winner_comment  text,
  percent_home    text,
  percent_draw    text,
  percent_away    text,
  under_over      text,
  goals_home      text,
  goals_away      text,
  comparison      jsonb,
  created_at      timestamptz DEFAULT now(),
  synced_at       timestamptz,
  valid_until     timestamptz
);

CREATE TABLE IF NOT EXISTS odds (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        uuid REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  fixture_id      integer UNIQUE,
  bookmaker_id    integer,
  bookmaker_name  text,
  home_win        numeric(6,2),
  draw            numeric(6,2),
  away_win        numeric(6,2),
  created_at      timestamptz DEFAULT now(),
  synced_at       timestamptz,
  valid_until     timestamptz
);

CREATE TABLE IF NOT EXISTS ai_content (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     text NOT NULL,
  entity_slug     text NOT NULL,
  content_type    text NOT NULL,
  text            text NOT NULL,
  model           text,
  generated_at    timestamptz DEFAULT now(),
  valid_until     timestamptz,
  UNIQUE(entity_type, entity_slug, content_type)
);

-- Ephemeral — live matches only. Enable Realtime on this table.
CREATE TABLE IF NOT EXISTS live_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        uuid REFERENCES matches(id) ON DELETE CASCADE,
  type            text,
  detail          text,
  minute          integer,
  extra_minute    integer,
  player_name     text,
  team_id         uuid REFERENCES teams(id)   ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_matches_date        ON matches(date);
CREATE INDEX IF NOT EXISTS idx_matches_status      ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_league      ON matches(league_id);
CREATE INDEX IF NOT EXISTS idx_matches_fixture_id  ON matches(fixture_id);
CREATE INDEX IF NOT EXISTS idx_standings_league    ON standings(league_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_player ON player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_match_events_match  ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_live_events_match   ON live_events(match_id);
CREATE INDEX IF NOT EXISTS idx_teams_api_id        ON teams(api_football_id);
CREATE INDEX IF NOT EXISTS idx_players_api_id      ON players(api_football_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_entity   ON ai_content(entity_type, entity_slug);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW-LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE leagues       ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues        ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams         ENABLE ROW LEVEL SECURITY;
ALTER TABLE players       ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats  ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_stats    ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_stats   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE h2h           ENABLE ROW LEVEL SECURITY;
ALTER TABLE injuries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE odds          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_content    ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_events   ENABLE ROW LEVEL SECURITY;

-- Public read-only access for all tables
CREATE POLICY "Public read leagues"      ON leagues      FOR SELECT USING (true);
CREATE POLICY "Public read venues"       ON venues       FOR SELECT USING (true);
CREATE POLICY "Public read teams"        ON teams        FOR SELECT USING (true);
CREATE POLICY "Public read players"      ON players      FOR SELECT USING (true);
CREATE POLICY "Public read coaches"      ON coaches      FOR SELECT USING (true);
CREATE POLICY "Public read matches"      ON matches      FOR SELECT USING (true);
CREATE POLICY "Public read standings"    ON standings    FOR SELECT USING (true);
CREATE POLICY "Public read player_stats" ON player_stats FOR SELECT USING (true);
CREATE POLICY "Public read team_stats"   ON team_stats   FOR SELECT USING (true);
CREATE POLICY "Public read match_events" ON match_events FOR SELECT USING (true);
CREATE POLICY "Public read match_stats"  ON match_stats  FOR SELECT USING (true);
CREATE POLICY "Public read lineups"      ON lineups      FOR SELECT USING (true);
CREATE POLICY "Public read h2h"          ON h2h          FOR SELECT USING (true);
CREATE POLICY "Public read injuries"     ON injuries     FOR SELECT USING (true);
CREATE POLICY "Public read predictions"  ON predictions  FOR SELECT USING (true);
CREATE POLICY "Public read odds"         ON odds         FOR SELECT USING (true);
CREATE POLICY "Public read ai_content"   ON ai_content   FOR SELECT USING (true);
CREATE POLICY "Public read live_events"  ON live_events  FOR SELECT USING (true);
