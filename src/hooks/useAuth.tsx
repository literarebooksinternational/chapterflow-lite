// hooks/useAuth.tsx (VERSÃO CORRIGIDA E FINAL)

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile extends User {
  role?: string;
  display_name?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthorized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Começa como true
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Função para buscar o perfil e atualizar o estado
    const fetchProfileAndSetUser = async (session: Session | null) => {
      if (!session?.user) {
        // Se não há sessão, limpa tudo e para o loading
        setUser(null);
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      // Se há sessão, busca o perfil
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, display_name')
        .eq('user_id', session.user.id)
        .single();
      
      if (error) {
        console.error("Erro ao buscar perfil:", error.message);
        // Mesmo com erro, o usuário está logado, mas sem perfil. Paramos o loading.
        setUser(session.user);
        setIsAuthorized(false);
      } else if (profile) {
        // Perfil encontrado, unimos os dados
        const userWithProfile = { ...session.user, ...profile };
        setUser(userWithProfile);
        setIsAuthorized(profile.role === 'admin');
      } else {
        // Usuário logado mas perfil não encontrado (caso raro com o trigger)
        setUser(session.user);
        setIsAuthorized(false);
      }
      
      // Independentemente do resultado, o processo acabou. Paramos o loading.
      setIsLoading(false);
    };

    // 1. Tenta pegar a sessão inicial assim que o app carrega
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      fetchProfileAndSetUser(session);
    });

    // 2. Ouve por MUDANÇAS no estado de autenticação (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        fetchProfileAndSetUser(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
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
    <AuthContext.Provider value={{ session, user, isLoading, isAuthorized, signIn, signOut }}>
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