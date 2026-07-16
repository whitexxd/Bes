/*
# Switch from Supabase Auth to localStorage-based player identity

## Overview
Removes the dependency on Supabase Auth for user identity. Players are now
identified by a `players` table with a player-generated `efootball_id` and
`name`. The frontend stores the logged-in player in localStorage and sends
the player id with every request. RLS policies are changed from
`authenticated`-only to `anon, authenticated` so the anon-key frontend
client can read/write without a Supabase session.

## 1. New Table

### `players`
- `id` (uuid, PK) — generated client-side or by default
- `efootball_id` (text, unique, not null) — the player's eFootball ID; 'admin' grants admin role
- `name` (text, not null) — display name
- `role` (text, default 'player') — 'player' or 'admin'
- `created_at` (timestamptz)

## 2. Modified Tables

### `tournaments`
- `created_by` FK changed to reference `public.players(id)` instead of `auth.users(id)`.

### `registrations`
- `player_id` FK changed from `profiles(id)` to `players(id)`.

### `matches`
- `player1_id`, `player2_id` FKs changed from `profiles(id)` to `players(id)`.

## 3. Security (RLS)

All policies changed from `TO authenticated` to `TO anon, authenticated`
because the frontend now operates with the anon key only (no Supabase session).

- `players`: open read/insert/update — community app, identity is client-managed.
- `tournaments`: open read; insert/update/delete gated by `is_admin_id(created_by)`.
- `registrations`: fully open CRUD (app enforces ownership client-side via player_id).
- `matches`: fully open CRUD (app enforces admin-only client-side).

Admin check uses `is_admin_id(uuid)` which looks up a player by id.

## 4. Important Notes
1. The old `profiles` table and its trigger on `auth.users` are left in place
   (not dropped) to avoid data loss; they go unused.
2. `auth.uid()` is no longer used — the client passes the player id explicitly.
3. The admin player ('admin' eFootball ID) is seeded.
*/

-- New players table
CREATE TABLE IF NOT EXISTS public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  efootball_id text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'player',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "players_select_all" ON public.players;
CREATE POLICY "players_select_all"
ON public.players FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "players_insert_all" ON public.players;
CREATE POLICY "players_insert_all"
ON public.players FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "players_update_all" ON public.players;
CREATE POLICY "players_update_all"
ON public.players FOR UPDATE
TO anon, authenticated
USING (true) WITH CHECK (true);

-- Admin check by player id
CREATE OR REPLACE FUNCTION public.is_admin_id(player_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.players
    WHERE id = player_uuid AND role = 'admin'
  );
$$;

-- Drop old FKs and recreate pointing at players
ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS registrations_player_id_fkey;
ALTER TABLE public.registrations
  ADD CONSTRAINT registrations_player_id_fkey
  FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE;

ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_player1_id_fkey;
ALTER TABLE public.matches
  ADD CONSTRAINT matches_player1_id_fkey
  FOREIGN KEY (player1_id) REFERENCES public.players(id) ON DELETE SET NULL;

ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_player2_id_fkey;
ALTER TABLE public.matches
  ADD CONSTRAINT matches_player2_id_fkey
  FOREIGN KEY (player2_id) REFERENCES public.players(id) ON DELETE SET NULL;

-- tournaments.created_by: drop old FK to auth.users, add to players
ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_created_by_fkey;
ALTER TABLE public.tournaments
  ADD CONSTRAINT tournaments_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.players(id) ON DELETE SET NULL;

-- Tournaments RLS (anon-accessible)
DROP POLICY IF EXISTS "tournaments_select_all" ON public.tournaments;
CREATE POLICY "tournaments_select_all"
ON public.tournaments FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "tournaments_insert_admin" ON public.tournaments;
CREATE POLICY "tournaments_insert_admin"
ON public.tournaments FOR INSERT
TO anon, authenticated
WITH CHECK (public.is_admin_id(created_by));

DROP POLICY IF EXISTS "tournaments_update_admin" ON public.tournaments;
CREATE POLICY "tournaments_update_admin"
ON public.tournaments FOR UPDATE
TO anon, authenticated
USING (public.is_admin_id(created_by))
WITH CHECK (public.is_admin_id(created_by));

DROP POLICY IF EXISTS "tournaments_delete_admin" ON public.tournaments;
CREATE POLICY "tournaments_delete_admin"
ON public.tournaments FOR DELETE
TO anon, authenticated
USING (public.is_admin_id(created_by));

-- Registrations RLS (anon-accessible, open CRUD)
DROP POLICY IF EXISTS "registrations_select_all" ON public.registrations;
CREATE POLICY "registrations_select_all"
ON public.registrations FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "registrations_insert_own" ON public.registrations;
DROP POLICY IF EXISTS "registrations_insert_all" ON public.registrations;
CREATE POLICY "registrations_insert_all"
ON public.registrations FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "registrations_update_own_or_admin" ON public.registrations;
DROP POLICY IF EXISTS "registrations_update_all" ON public.registrations;
CREATE POLICY "registrations_update_all"
ON public.registrations FOR UPDATE
TO anon, authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "registrations_delete_own" ON public.registrations;
DROP POLICY IF EXISTS "registrations_delete_all" ON public.registrations;
CREATE POLICY "registrations_delete_all"
ON public.registrations FOR DELETE
TO anon, authenticated
USING (true);

-- Matches RLS (anon-accessible, open CRUD — app enforces admin-only)
DROP POLICY IF EXISTS "matches_select_all" ON public.matches;
CREATE POLICY "matches_select_all"
ON public.matches FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "matches_insert_admin" ON public.matches;
DROP POLICY IF EXISTS "matches_insert_all" ON public.matches;
CREATE POLICY "matches_insert_all"
ON public.matches FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "matches_update_admin" ON public.matches;
DROP POLICY IF EXISTS "matches_update_all" ON public.matches;
CREATE POLICY "matches_update_all"
ON public.matches FOR UPDATE
TO anon, authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "matches_delete_admin" ON public.matches;
DROP POLICY IF EXISTS "matches_delete_all" ON public.matches;
CREATE POLICY "matches_delete_all"
ON public.matches FOR DELETE
TO anon, authenticated
USING (true);

-- Seed the admin player
INSERT INTO public.players (efootball_id, name, role)
VALUES ('admin', 'Tournament Admin', 'admin')
ON CONFLICT (efootball_id) DO UPDATE SET role = 'admin';
