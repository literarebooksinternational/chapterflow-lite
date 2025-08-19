import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Criamos um tipo para o nosso usuário que inclui a 'role' do perfil
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Este listener é a única fonte da verdade para o estado do usuário.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true);
        setSession(session);

        if (session?.user) {
          // LÓGICA CORRETA: Buscamos o perfil do usuário.
          // A RLS permite isso para qualquer usuário logado (ver seu próprio perfil).
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (profile) {
            // Se o perfil existe, ele é um funcionário autorizado.
            setUser({ ...session.user, ...profile });
            setIsAuthorized(true);
          } else {
            // Se não há perfil, ele não é um funcionário do painel.
            setUser(session.user);
            setIsAuthorized(false);
          }
        } else {
          // Sem sessão, sem autorização.
          setUser(null);
          setIsAuthorized(false);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // A função signIn agora é simples e correta.
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