// src/integrations/supabase/client.ts

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use o prefixo VITE_ para projetos com Vite (o mais comum hoje em dia)
// Se você usa Create-React-App, o prefixo seria REACT_APP_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Lança um erro se as variáveis não forem encontradas, para evitar que a app quebre silenciosamente
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and/or Anon Key are missing from environment variables.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: false, 
    multiTab: false,
  }
});