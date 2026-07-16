import { supabase } from './supabaseClient';
import type { Tournament, Match, Standing } from './supabaseClient';

// ── Tournaments ──────────────────────────────────────────────

export async function fetchTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Tournament[];
}

export async function createTournament(payload: {
  name: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
}): Promise<Tournament> {
  // created_by is defaulted to auth.uid() by the database
  const { data, error } = await supabase
    .from('tournaments')
    .insert({
      name: payload.name,
      description: payload.description ?? null,
      start_date: payload.start_date ?? null,
      end_date: payload.end_date ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Tournament;
}

export async function updateTournament(
  id: string,
  patch: Partial<Pick<Tournament, 'name' | 'description' | 'start_date' | 'end_date' | 'status'>>,
): Promise<Tournament> {
  const { data, error } = await supabase
    .from('tournaments')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Tournament;
}

export async function deleteTournament(id: string): Promise<void> {
  const { error } = await supabase.from('tournaments').delete().eq('id', id);
  if (error) throw error;
}

// ── Matches ──────────────────────────────────────────────────

export async function fetchMatches(tournamentId: string): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Match[];
}

export async function createMatch(payload: {
  tournament_id: string;
  team1_name: string;
  team2_name: string;
  team1_score?: number;
  team2_score?: number;
  match_date?: string | null;
  stage?: Match['stage'];
  status?: Match['status'];
}): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Match;
}

export async function updateMatch(
  id: string,
  patch: Partial<Pick<Match, 'team1_score' | 'team2_score' | 'status' | 'stage' | 'match_date'>>,
): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Match;
}

export async function deleteMatch(id: string): Promise<void> {
  const { error } = await supabase.from('matches').delete().eq('id', id);
  if (error) throw error;
}

// ── Standings ─────────────────────────────────────────────────

export async function fetchStandings(tournamentId: string): Promise<Standing[]> {
  const { data, error } = await supabase
    .from('standings')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('points', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Standing[];
}

export async function upsertStanding(payload: {
  tournament_id: string;
  team_name: string;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  points?: number;
  goal_difference?: number;
}): Promise<Standing> {
  const { data, error } = await supabase
    .from('standings')
    .upsert(payload, { onConflict: 'tournament_id,team_name' })
    .select()
    .single();
  if (error) throw error;
  return data as Standing;
}

export async function deleteStanding(id: string): Promise<void> {
  const { error } = await supabase.from('standings').delete().eq('id', id);
  if (error) throw error;
}
