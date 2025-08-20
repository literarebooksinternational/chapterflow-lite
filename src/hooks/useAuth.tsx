// hooks/useAuth.tsx (VERSÃO DE DEPURAÇÃO FINAL)

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// ... (interfaces continuam as mesmas)
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
  console.log('[Auth] Provider Montado. Estado inicial: isLoading=true');
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    console.log('[Auth] useEffect disparado. Verificando sessão inicial.');

    // 1. Verificação da sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[Auth] getSession() concluído.', session);
      if (!session) {
        console.log('[Auth] Nenhuma sessão inicial encontrada. Parando o loading.');
        setIsLoading(false);
      }
    });

    // 2. Listener para mudanças de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[Auth] onAuthStateChange disparado! Evento: ${event}`, session);

        if (!session?.user) {
          console.log('[Auth] Evento sem usuário. Limpando estado e parando loading.');
          setUser(null);
          setSession(null);
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }
        
        setSession(session);
        console.log('[Auth] Buscando perfil para o usuário:', session.user.id);
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, display_name')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          console.error('%c[Auth] ERRO ao buscar perfil:', 'color: red; font-weight: bold;', error.message);
          setUser(session.user);
          setIsAuthorized(false);
        } else if (profile) {
          console.log('%c[Auth] Perfil encontrado:', 'color: lightblue;', profile);
          const userWithProfile = { ...session.user, ...profile };
          setUser(userWithProfile);

          if (profile.role === 'admin') {
            console.log('%c[Auth] AUTORIZANDO USUÁRIO (role é admin)!', 'color: limegreen; font-weight: bold;');
            setIsAuthorized(true);
          } else {
            console.log(`[Auth] Usuário NÃO autorizado. Role encontrada: '${profile.role}'`);
            setIsAuthorized(false);
          }
        } else {
            console.warn('%c[Auth] Perfil NÃO encontrado para o usuário no banco!', 'color: orange;');
            setUser(session.user);
            setIsAuthorized(false);
        }
        
        console.log('[Auth] Parando o loading.');
        setIsLoading(false);
      }
    );

    return () => {
      console.log('[Auth] Limpando subscription do useEffect.');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log(`[Auth] Tentando signIn com o email: ${email}`);
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    console.log('[Auth] Executando signOut.');
    return supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, isLoading, isAuthorized, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  // ... (sem mudanças aqui)
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}