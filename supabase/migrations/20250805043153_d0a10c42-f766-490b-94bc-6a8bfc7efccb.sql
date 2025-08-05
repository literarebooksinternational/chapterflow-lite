-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'editor', 'reviewer');

-- Create profiles table for users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'editor',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add responsible_user_id to envios_capitulos
ALTER TABLE public.envios_capitulos 
ADD COLUMN responsible_user_id UUID REFERENCES public.profiles(user_id);

-- Create internal chat table
CREATE TABLE public.chapter_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID NOT NULL REFERENCES public.envios_capitulos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on chapter_comments
ALTER TABLE public.chapter_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for chapter_comments
CREATE POLICY "Authenticated users can view chapter comments" 
ON public.chapter_comments 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert comments" 
ON public.chapter_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chapter_comments_updated_at
BEFORE UPDATE ON public.chapter_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin profiles for authorized emails
INSERT INTO public.profiles (user_id, display_name, email, role)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', u.email),
  u.email,
  'admin'::user_role
FROM auth.users u
WHERE u.email IN ('comunicacao@literarebooks.com.br', 'julyana@literarebooks.com.br')
ON CONFLICT (user_id) DO NOTHING;