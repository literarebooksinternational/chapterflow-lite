export type TipoParticipacao = 'Solo' | 'Coautoria';
export type StatusEnvio = 'Recebido' | 'Em Análise' | 'Aprovado' | 'Solicitar Ajustes';

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
  created_at: string;
  updated_at: string;
}

export interface AdminEmail {
  id: string;
  email: string;
  created_at: string;
}