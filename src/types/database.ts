export type TipoParticipacao = 'Solo' | 'Coautoria';
export type StatusEnvio = 'Recebido' | 'Em Análise' | 'Aprovado' | 'Solicitar Ajustes';
export type UserRole = 'admin' | 'editor' | 'reviewer';

export interface EnvioCapitulo {
  id: string;
  nome: string;
  email: string;
  livro: string;
  tipo_participacao: TipoParticipacao;
  titulo_capitulo: string;
  url_arquivo: string;
  status: StatusEnvio;
  observacao_admin?: string;
  comentario_adicional?: string;
  responsible_user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface ChapterComment {
  id: string;
  chapter_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface AdminEmail {
  id: string;
  email: string;
  created_at: string;
}