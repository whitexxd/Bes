/*
# Create eFootball Tournament Tables

Creates the core schema for an eFootball tournament management app.

1. New Tables
- `players`
  - `id` (uuid, primary key)
  - `name` (text, player display name)
  - `efootball_id` (text, unique eFootball ID; "admin" grants admin role)
  - `role` (text, default 'player'; 'admin' for admin users)
  - `created_at` (timestamp)
- `tournaments`
  - `id` (uuid, primary key)
  - `name` (text, tournament name)
  - `description` (text, optional)
  - `status` (text, default 'upcoming'; one of: upcoming, ongoing, completed)
  - `created_at` (timestamp)
- `matches`
  - `id` (uuid, primary key)
  - `tournament_id` (uuid, foreign key to tournaments)
  - `player1_id` (uuid, foreign key to players)
  - `player2_id` (uuid, foreign key to players)
  - `player1_score` (int, default 0)
  - `player2_score` (int, default 0)
  - `status` (text, default 'scheduled'; one of: scheduled, in_progress, completed)
  - `scheduled_at` (timestamp, optional match time)
  - `completed_at` (timestamp, set when match finishes)
  - `created_at` (timestamp)

2. Security
- RLS enabled on all tables.
- All tables allow anon + authenticated CRUD (single-tenant, no Supabase auth).
*/

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  efootball_id text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'player',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_players" ON players;
CREATE POLICY "anon_select_players" ON players FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_players" ON players;
CREATE POLICY "anon_insert_players" ON players FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_players" ON players;
CREATE POLICY "anon_update_players" ON players FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_players" ON players;
CREATE POLICY "anon_delete_players" ON players FOR DELETE
  TO anon, authenticated USING (true);

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tournaments" ON tournaments;
CREATE POLICY "anon_select_tournaments" ON tournaments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tournaments" ON tournaments;
CREATE POLICY "anon_insert_tournaments" ON tournaments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tournaments" ON tournaments;
CREATE POLICY "anon_update_tournaments" ON tournaments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tournaments" ON tournaments;
CREATE POLICY "anon_delete_tournaments" ON tournaments FOR DELETE
  TO anon, authenticated USING (true);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player1_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  player2_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  player1_score int NOT NULL DEFAULT 0,
  player2_score int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_matches" ON matches;
CREATE POLICY "anon_select_matches" ON matches FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_matches" ON matches;
CREATE POLICY "anon_insert_matches" ON matches FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_matches" ON matches;
CREATE POLICY "anon_update_matches" ON matches FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_matches" ON matches;
CREATE POLICY "anon_delete_matches" ON matches FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_player1_id ON matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_player2_id ON matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
