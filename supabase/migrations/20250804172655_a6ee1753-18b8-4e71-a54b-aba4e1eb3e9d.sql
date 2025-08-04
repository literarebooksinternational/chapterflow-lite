-- Create enum for participation type
CREATE TYPE public.tipo_participacao AS ENUM ('Solo', 'Coautoria');

-- Create enum for status
CREATE TYPE public.status_envio AS ENUM ('Recebido', 'Em Análise', 'Aprovado', 'Solicitar Ajustes');

-- Create table for chapter submissions
CREATE TABLE public.envios_capitulos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    livro TEXT NOT NULL,
    tipo_participacao tipo_participacao NOT NULL,
    titulo_capitulo TEXT NOT NULL,
    url_arquivo TEXT NOT NULL,
    status status_envio NOT NULL DEFAULT 'Recebido',
    observacao_admin TEXT,
    comentario_adicional TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.envios_capitulos ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (anyone can insert)
CREATE POLICY "Anyone can insert chapter submissions" 
ON public.envios_capitulos 
FOR INSERT 
WITH CHECK (true);

-- Create policy for authenticated users to view all (for admin panel)
CREATE POLICY "Authenticated users can view all submissions" 
ON public.envios_capitulos 
FOR SELECT 
TO authenticated 
USING (true);

-- Create policy for authenticated users to update all (for admin panel)
CREATE POLICY "Authenticated users can update all submissions" 
ON public.envios_capitulos 
FOR UPDATE 
TO authenticated 
USING (true);

-- Create table for authorized admin emails
CREATE TABLE public.admin_emails (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert authorized emails
INSERT INTO public.admin_emails (email) VALUES 
('comunicacao@literarebooks.com.br'),
('julyana@literarebooks.com.br');

-- Enable RLS for admin emails
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Create policy for admin emails (only authenticated users can view)
CREATE POLICY "Authenticated users can view admin emails" 
ON public.admin_emails 
FOR SELECT 
TO authenticated 
USING (true);

-- Create policy for admin emails insert (only authenticated users can add)
CREATE POLICY "Authenticated users can insert admin emails" 
ON public.admin_emails 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_envios_capitulos_updated_at
    BEFORE UPDATE ON public.envios_capitulos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for chapter files
INSERT INTO storage.buckets (id, name, public) VALUES ('capitulos', 'capitulos', false);

-- Create storage policies
CREATE POLICY "Anyone can upload chapter files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'capitulos');

CREATE POLICY "Anyone can view chapter files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'capitulos');

CREATE POLICY "Authenticated users can update chapter files" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'capitulos');

CREATE POLICY "Authenticated users can delete chapter files" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'capitulos');