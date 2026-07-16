import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Profile } from '../lib/supabaseClient';

type AuthContextValue = {
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('Failed to load profile:', error);
      return null;
    }
    setProfile(data as Profile);
    return data as Profile | null;
  }, []);

  // Fallback: if profile doesn't exist yet (trigger hasn't fired), create it manually
  const ensureProfile = useCallback(async (userId: string, email: string, username?: string) => {
    const existing = await loadProfile(userId);
    if (existing) return existing;

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: username || email.split('@')[0],
        full_name: '',
        role: 'user',
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Failed to create profile:', error);
      return null;
    }
    setProfile(data as Profile);
    return data as Profile;
  }, [loadProfile]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) {
        ensureProfile(data.session.user.id, data.session.user.email || '', data.session.user.user_metadata?.username);
      }
      if (mounted) setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'SIGNED_IN' && session) {
          await ensureProfile(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata?.username,
          );
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      })();
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [ensureProfile]);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw error;
    if (data.user) {
      await ensureProfile(data.user.id, email, username);
    }
  }, [ensureProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      await ensureProfile(data.user.id, email, data.user.user_metadata?.username);
    }
  }, [ensureProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
