import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TipoParticipacao } from '@/types/database';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { animateIn } from '@/hooks/useGSAP';
import { gsap } from 'gsap';

interface FormData {
  nome: string;
  email: string;
  livro: string;
  tipo_participacao: TipoParticipacao;
  titulo_capitulo: string;
  comentario_adicional: string;
  arquivo: File | null;
}

export function ChapterSubmissionForm() {
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    livro: '',
    tipo_participacao: 'Solo',
    titulo_capitulo: '',
    comentario_adicional: '',
    arquivo: null,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (formRef.current) {
      animateIn(Array.from(formRef.current.children), { delay: 0.2 });
    }
  }, []);

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Erro no arquivo',
        description: 'Apenas arquivos .doc, .docx e .pdf são aceitos.',
        variant: 'destructive',
      });
      return;
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setFormData(prev => ({ ...prev, arquivo: file }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const sanitizedNome = formData.nome.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedLivro = formData.livro.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${sanitizedNome}_${Date.now()}.${fileExt}`;
    const filePath = `${sanitizedLivro}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('capitulos')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error('Erro ao fazer upload do arquivo');
    }

    return filePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.arquivo) {
      toast({
        title: 'Arquivo obrigatório',
        description: 'Por favor, anexe um arquivo.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Upload do arquivo
      const filePath = await uploadFile(formData.arquivo);

      // Inserir dados no banco
      const { error } = await supabase
        .from('envios_capitulos')
        .insert({
          nome: formData.nome,
          email: formData.email,
          livro: formData.livro,
          tipo_participacao: formData.tipo_participacao,
          titulo_capitulo: formData.titulo_capitulo,
          comentario_adicional: formData.comentario_adicional,
          url_arquivo: filePath,
        });

      if (error) throw error;

      // Animação de sucesso
      gsap.to(formRef.current, {
        scale: 0.95,
        opacity: 0.7,
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      });

      toast({
        title: 'Capítulo enviado com sucesso!',
        description: 'Você receberá uma confirmação por e-mail em breve.',
      });

      // Reset do formulário
      setFormData({
        nome: '',
        email: '',
        livro: '',
        tipo_participacao: 'Solo',
        titulo_capitulo: '',
        comentario_adicional: '',
        arquivo: null,
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      toast({
        title: 'Erro ao enviar capítulo',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto editorial-shadow smooth-transition">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center text-editorial">
          Envio de Capítulo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={formRef}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  required
                  className="smooth-transition focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="smooth-transition focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="livro">Nome do livro *</Label>
              <Input
                id="livro"
                value={formData.livro}
                onChange={(e) => setFormData(prev => ({ ...prev, livro: e.target.value }))}
                required
                className="smooth-transition focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_participacao">Tipo de participação *</Label>
                <Select 
                  value={formData.tipo_participacao} 
                  onValueChange={(value: TipoParticipacao) => 
                    setFormData(prev => ({ ...prev, tipo_participacao: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Solo">Solo</SelectItem>
                    <SelectItem value="Coautoria">Coautoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="titulo_capitulo">Título do capítulo *</Label>
                <Input
                  id="titulo_capitulo"
                  value={formData.titulo_capitulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo_capitulo: e.target.value }))}
                  required
                  className="smooth-transition focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="arquivo">Anexo do capítulo *</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center smooth-transition cursor-pointer hover:border-primary ${
                  dragOver ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".doc,.docx,.pdf"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  className="hidden"
                />
                
                {formData.arquivo ? (
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="h-8 w-8 text-primary" />
                    <span className="text-sm font-medium">{formData.arquivo.name}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Clique ou arraste seu arquivo aqui
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Aceita .doc, .docx, .pdf (máx. 10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comentario_adicional">Comentário adicional (opcional)</Label>
              <Textarea
                id="comentario_adicional"
                value={formData.comentario_adicional}
                onChange={(e) => setFormData(prev => ({ ...prev, comentario_adicional: e.target.value }))}
                rows={3}
                className="smooth-transition focus:ring-2 focus:ring-primary"
                placeholder="Alguma observação sobre o capítulo..."
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-editorial hover:bg-editorial/90 text-white font-semibold py-3 smooth-transition hover-lift"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Capítulo'
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}