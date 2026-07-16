/*
# PES Tournament Manager — initial schema

## Overview
Creates the core tables for a PES (Pro Evolution Soccer) tournament manager:
players, tournaments, registrations (player<->tournament), and matches.
Supports two roles: `player` (default) and `admin`. Admins manage tournaments
and matches; players register for tournaments and view standings.

## 1. New Tables

### `profiles`
- `id` (uuid, PK, references auth.users) — one row per auth user
- `full_name` (text) — display name
- `team_name` (text) — the PES club the player uses
- `role` (text, default 'player') — 'player' or 'admin'
- `created_at` (timestamptz)

### `tournaments`
- `id` (uuid, PK)
- `name` (text) — tournament title
- `description` (text)
- `status` (text, default 'upcoming') — 'upcoming', 'active', 'completed'
- `max_players` (int, default 16)
- `start_date` (date)
- `created_by` (uuid, references auth.users) — admin who created it
- `created_at` (timestamptz)

### `registrations`
- `id` (uuid, PK)
- `tournament_id` (uuid, FK -> tournaments)
- `player_id` (uuid, FK -> profiles) — the player registered
- `status` (text, default 'registered') — 'registered', 'checked_in', 'withdrawn'
- `created_at` (timestamptz)
- UNIQUE constraint on (tournament_id, player_id) — one registration per player per tournament

### `matches`
- `id` (uuid, PK)
- `tournament_id` (uuid, FK -> tournaments)
- `round` (int) — bracket round number
- `player1_id` (uuid, FK -> profiles)
- `player2_id` (uuid, FK -> profiles)
- `score1` (int, nullable) — goals scored by player1
- `score2` (int, nullable) — goals scored by player2
- `status` (text, default 'pending') — 'pending', 'completed'
- `scheduled_at` (timestamptz, nullable)
- `created_at` (timestamptz)

## 2. Security (RLS)

All tables have RLS enabled.

- `profiles`: each authenticated user can read all profiles (needed for standings/brackets);
  users can insert/update only their own profile. Admins can update any profile.
- `tournaments`: all authenticated users can read; only admins can insert/update/delete.
- `registrations`: all authenticated users can read; a player can insert/update only their
  own registration; admins can update any registration.
- `matches`: all authenticated users can read; only admins can insert/update/delete.

Admin checks use a helper that looks up the requester's profile role.

## 3. Important Notes
1. A trigger auto-creates a `profiles` row when a new auth user signs up.
2. The `is_admin()` SQL function checks whether the current auth user has role = 'admin'.
3. Owner columns default to `auth.uid()` so inserts from the client succeed without
   threading the user id explicitly.
*/

-- profiles table first
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  team_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'player',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Helper: is the current user an admin? (defined before any policy that uses it)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Now enable RLS and add policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

-- tournaments
CREATE TABLE IF NOT EXISTS public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'upcoming',
  max_players int NOT NULL DEFAULT 16,
  start_date date,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tournaments_select_all" ON public.tournaments;
CREATE POLICY "tournaments_select_all"
ON public.tournaments FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "tournaments_insert_admin" ON public.tournaments;
CREATE POLICY "tournaments_insert_admin"
ON public.tournaments FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "tournaments_update_admin" ON public.tournaments;
CREATE POLICY "tournaments_update_admin"
ON public.tournaments FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "tournaments_delete_admin" ON public.tournaments;
CREATE POLICY "tournaments_delete_admin"
ON public.tournaments FOR DELETE
TO authenticated
USING (public.is_admin());

-- registrations
CREATE TABLE IF NOT EXISTS public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'registered',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, player_id)
);

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "registrations_select_all" ON public.registrations;
CREATE POLICY "registrations_select_all"
ON public.registrations FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "registrations_insert_own" ON public.registrations;
CREATE POLICY "registrations_insert_own"
ON public.registrations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = player_id);

DROP POLICY IF EXISTS "registrations_update_own_or_admin" ON public.registrations;
CREATE POLICY "registrations_update_own_or_admin"
ON public.registrations FOR UPDATE
TO authenticated
USING (auth.uid() = player_id OR public.is_admin())
WITH CHECK (auth.uid() = player_id OR public.is_admin());

DROP POLICY IF EXISTS "registrations_delete_own" ON public.registrations;
CREATE POLICY "registrations_delete_own"
ON public.registrations FOR DELETE
TO authenticated
USING (auth.uid() = player_id);

-- matches
CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round int NOT NULL DEFAULT 1,
  player1_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  player2_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  score1 int,
  score2 int,
  status text NOT NULL DEFAULT 'pending',
  scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "matches_select_all" ON public.matches;
CREATE POLICY "matches_select_all"
ON public.matches FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "matches_insert_admin" ON public.matches;
CREATE POLICY "matches_insert_admin"
ON public.matches FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "matches_update_admin" ON public.matches;
CREATE POLICY "matches_update_admin"
ON public.matches FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "matches_delete_admin" ON public.matches;
CREATE POLICY "matches_delete_admin"
ON public.matches FOR DELETE
TO authenticated
USING (public.is_admin());

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_registrations_tournament ON public.registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_registrations_player ON public.registrations(player_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON public.matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
