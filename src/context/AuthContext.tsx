import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Player } from '../lib/supabaseClient';
import {
  getStoredPlayer,
  storePlayer,
  clearStoredPlayer,
  joinAsPlayer,
} from '../lib/tournamentService';

type AuthContextValue = {
  player: Player | null;
  loading: boolean;
  join: (name: string, efootballId: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(() => getStoredPlayer());
  const [loading] = useState(false);

  const join = useCallback(async (name: string, efootballId: string) => {
    const p = await joinAsPlayer(name, efootballId);
    storePlayer(p);
    setPlayer(p);
  }, []);

  const signOut = useCallback(() => {
    clearStoredPlayer();
    setPlayer(null);
  }, []);

  return (
    <AuthContext.Provider value={{ player, loading, join, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
