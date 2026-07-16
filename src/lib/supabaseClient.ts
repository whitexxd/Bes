import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
};

export type Tournament = {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'upcoming' | 'ongoing' | 'completed';
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Match = {
  id: string;
  tournament_id: string;
  team1_name: string;
  team2_name: string;
  team1_score: number;
  team2_score: number;
  match_date: string | null;
  stage: 'group' | 'quarter' | 'semi' | 'final';
  status: 'scheduled' | 'ongoing' | 'finished';
  created_at: string;
  updated_at: string;
};

export type Standing = {
  id: string;
  tournament_id: string;
  team_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  goal_difference: number;
  created_at: string;
  updated_at: string;
};
