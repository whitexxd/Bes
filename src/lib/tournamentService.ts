import { supabase } from './supabaseClient';
import type { Player, Tournament, Registration, Match } from './supabaseClient';

const STORAGE_KEY = 'pes_player';

export function getStoredPlayer(): Player | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Player) : null;
  } catch {
    return null;
  }
}

export function storePlayer(player: Player): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
}

export function clearStoredPlayer(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export async function joinAsPlayer(name: string, efootballId: string): Promise<Player> {
  const role = efootballId.trim().toLowerCase() === 'admin' ? 'admin' : 'player';

  // Try to find existing player by efootball_id
  const { data: existing, error: findErr } = await supabase
    .from('players')
    .select('*')
    .eq('efootball_id', efootballId.trim())
    .maybeSingle();

  if (findErr) throw findErr;

  if (existing) {
    const player = existing as Player;
    if (player.name !== name) {
      const { data: updated, error: updErr } = await supabase
        .from('players')
        .update({ name })
        .eq('id', player.id)
        .select()
        .single();
      if (updErr) throw updErr;
      return updated as Player;
    }
    return player;
  }

  // Create new player
  const { data, error } = await supabase
    .from('players')
    .insert({ efootball_id: efootballId.trim(), name, role })
    .select()
    .single();

  if (error) throw error;
  return data as Player;
}

export async function fetchTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Tournament[];
}

export async function createTournament(
  payload: { name: string; description?: string; max_players?: number; start_date?: string | null },
): Promise<Tournament> {
  const { data, error } = await supabase
    .from('tournaments')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Tournament;
}

export async function updateTournament(
  id: string,
  updates: Partial<Pick<Tournament, 'name' | 'description' | 'status' | 'max_players' | 'start_date'>>,
): Promise<Tournament> {
  const { data, error } = await supabase
    .from('tournaments')
    .update(updates)
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

export async function fetchRegistrations(tournamentId: string): Promise<Registration[]> {
  const { data, error } = await supabase
    .from('registrations')
    .select('*, players:player_id(id, name, efootball_id)')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as Registration[];
}

export async function fetchMyRegistrations(playerId: string): Promise<Registration[]> {
  const { data, error } = await supabase
    .from('registrations')
    .select('*, tournaments:tournament_id(name, status)')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Registration[];
}

export async function registerForTournament(tournamentId: string, playerId: string): Promise<void> {
  const { error } = await supabase
    .from('registrations')
    .insert({ tournament_id: tournamentId, player_id: playerId });
  if (error) throw error;
}

export async function withdrawFromTournament(registrationId: string): Promise<void> {
  const { error } = await supabase
    .from('registrations')
    .delete()
    .eq('id', registrationId);
  if (error) throw error;
}

export async function updateRegistration(
  id: string,
  status: Registration['status'],
): Promise<void> {
  const { error } = await supabase.from('registrations').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function fetchMatches(tournamentId: string): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*, player1:player1_id(id, name, efootball_id), player2:player2_id(id, name, efootball_id)')
    .eq('tournament_id', tournamentId)
    .order('round', { ascending: true });
  if (error) throw error;
  return data as Match[];
}

export async function createMatch(
  payload: { tournament_id: string; player1_id: string; player2_id: string; round?: number },
): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Match;
}

export async function updateMatchResult(
  id: string,
  score1: number,
  score2: number,
): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .update({ score1, score2, status: 'completed' })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteMatch(id: string): Promise<void> {
  const { error } = await supabase.from('matches').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchAllPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data as Player[];
}
