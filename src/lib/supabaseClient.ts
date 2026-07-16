import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Player = {
  id: string;
  efootball_id: string;
  name: string;
  role: 'player' | 'admin';
  created_at: string;
};

export type Tournament = {
  id: string;
  name: string;
  description: string;
  status: 'upcoming' | 'active' | 'completed';
  max_players: number;
  start_date: string | null;
  created_by: string | null;
  created_at: string;
};

export type Registration = {
  id: string;
  tournament_id: string;
  player_id: string;
  status: 'registered' | 'checked_in' | 'withdrawn';
  created_at: string;
  players?: Pick<Player, 'id' | 'name' | 'efootball_id'>;
};

export type Match = {
  id: string;
  tournament_id: string;
  round: number;
  player1_id: string | null;
  player2_id: string | null;
  score1: number | null;
  score2: number | null;
  status: 'pending' | 'completed';
  scheduled_at: string | null;
  created_at: string;
  player1?: Pick<Player, 'id' | 'name' | 'efootball_id'> | null;
  player2?: Pick<Player, 'id' | 'name' | 'efootball_id'> | null;
};
