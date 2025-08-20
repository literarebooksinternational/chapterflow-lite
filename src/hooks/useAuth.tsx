// hooks/useAuth.tsx

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile extends User {
  role?: string; // Essencial para sabermos se é 'admin' ou 'member'
  display_name?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthorized: boolean; // Esta flag agora significa "tem permissão para ver o painel admin?"
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Reset a autorização antes de checar
        setIsAuthorized(false);

        if (session?.user) {
          // 1. Buscamos o perfil do usuário logado
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, display_name') // Só precisamos da role e do nome
            .eq('user_id', session.user.id)
            .single();

          if (profile) {
            // Unimos os dados de auth.user com os do profile para ter um objeto de usuário completo
            setUser({ ...session.user, ...profile });

            // 2. A VERIFICAÇÃO CRÍTICA: A role do usuário é 'admin'?
            if (profile.role === 'admin') {
              setIsAuthorized(true); // SIM! Ele está autorizado a ver o painel.
            }
            // Se a role for 'member' ou qualquer outra coisa, 'isAuthorized' permanece 'false'.
          }
        }
        
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      isAuthorized,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}