import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// MUDANÇA 1: Criamos um tipo para o nosso usuário que inclui a 'role' do perfil
export interface UserProfile extends User {
  role?: string;
  display_name?: string;
}

interface AuthContextType {
  user: UserProfile | null; // Usamos o novo tipo aqui
  session: Session | null;
  isLoading: boolean;
  isAuthorized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // MUDANÇA 2: O estado do usuário agora usa o novo tipo
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true);
        setSession(session);

        if (session?.user) {
          // MUDANÇA 3: A lógica de autorização foi movida para cá e corrigida
          // Agora buscamos o perfil do usuário, o que é permitido pela RLS
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id) // Usando a coluna 'user_id' correta
            .single();

          if (profile) {
            // Se encontrarmos um perfil, o usuário é um funcionário válido
            setUser({ ...session.user, ...profile });
            setIsAuthorized(true);
          } else {
            // Se não houver perfil, ele não é um funcionário autorizado
            setUser(session.user);
            setIsAuthorized(false);
          }
        } else {
          // Se não há sessão, limpa tudo
          setUser(null);
          setIsAuthorized(false);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // MUDANÇA 4: A função 'checkAuthorization' foi completamente REMOVIDA
  // pois sua lógica agora está no listener acima.

  const signIn = async (email: string, password: string) => {
    // A função signIn continua simples, como deveria ser
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null); // Garante que o estado seja limpo imediatamente
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