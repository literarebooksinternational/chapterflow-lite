// src/components/AdminDashboard/RevisorAutomatico.tsx
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, Download, ListChecks, AlertCircle } from 'lucide-react';
import { animateIn } from '@/hooks/useGSAP';

// --- NOVAS IMPORTAÇÕES ---
import BookLoader from '@/components/AdminDashboard/BookLoader'; // Importa o novo componente de loader

interface Correction {
  original: string;
  corrigido: string;
  tipo: 'Regra' | 'Ortografia';
}

export const RevisorAutomatico = () => {
  const { toast } = useToast();
  const revisorRef = useRef<HTMLDivElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // O estado 'progress' não é mais necessário para a UI, mas podemos mantê-lo para a lógica se quisermos
  // const [progress, setProgress] = useState(0); 
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (revisorRef.current) {
      animateIn(Array.from(revisorRef.current.children), { y: 20 });
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.name.endsWith('.docx')) {
            setSelectedFile(file);
            setCorrections([]);
            setDownloadUrl(null);
            setError(null);
        } else {
            toast({
                title: "Arquivo Inválido",
                description: "Por favor, selecione um arquivo .docx",
                variant: "destructive",
            });
            event.target.value = '';
        }
    }
  };

  const handleReview = async () => {
    if (!selectedFile) {
      toast({ title: "Nenhum arquivo selecionado", description: "Escolha um arquivo .docx para revisar.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // ATENÇÃO: Lembre-se de trocar esta URL pela URL do seu backend em produção (Render.com)
      const response = await fetch('http://127.0.0.1:5000/revisar-documento', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Ocorreu um erro no servidor.');
      }

      const reportHeader = response.headers.get('X-Corrections-Report');
      if (reportHeader) { setCorrections(JSON.parse(reportHeader)); }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);

      toast({
        title: "Revisão Concluída!",
        description: "O download está pronto e o relatório de alterações foi gerado.",
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro de conexão. Verifique se o servidor Python está rodando.";
      setError(`Falha na revisão: ${errorMessage}`);
      toast({ title: "Erro na Revisão", description: errorMessage, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div ref={revisorRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader><CardTitle className="text-xl flex items-center"><ListChecks className="mr-2 h-6 w-6 text-editorial" />Revisor Automático de Documentos</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2"><Label htmlFor="doc-upload">1. Enviar arquivo Word (.docx)</Label><Input id="doc-upload" type="file" onChange={handleFileChange} accept=".docx" className="cursor-pointer"/></div>
            <Button onClick={handleReview} disabled={!selectedFile || isProcessing} className="w-full gradient-button">
              {isProcessing ? (
                <span>Revisando...</span> // Texto muda para indicar processamento
              ) : (
                <>Iniciar Revisão <Upload className="ml-2 h-4 w-4" /></>
              )}
            </Button>

            {/* --- SEÇÃO DO LOADER ATUALIZADA --- */}
            {isProcessing && (
              <div className="space-y-2">
                <Label>Andamento</Label>
                <BookLoader />
              </div>
            )}
            
            {error && (<div className="flex items-center bg-destructive/10 border border-destructive/50 text-destructive p-3 rounded-lg"><AlertCircle className="h-5 w-5 mr-3" /><p className="text-sm font-semibold">{error}</p></div>)}
            {downloadUrl && (<div className="border-t border-glass-border pt-6 space-y-4 animate-in fade-in-0 slide-in-from-bottom-5 duration-500"><h3 className="text-lg font-semibold text-foreground">2. Download do Arquivo Corrigido</h3><p className="text-sm text-muted-foreground">O arquivo foi processado. As alterações estão realçadas em amarelo para sua revisão.</p><Button asChild className="w-full"><a href={downloadUrl} download={`revisado_${selectedFile?.name}`}><Download className="mr-2 h-4 w-4" />Baixar Arquivo Revisado</a></Button></div>)}
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card className="h-full">
            <CardHeader><CardTitle className="text-lg flex items-center"><FileText className="mr-2 h-5 w-5 text-yellow-500" />Relatório de Alterações</CardTitle></CardHeader>
            <CardContent>{corrections.length > 0 ? (<div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">{corrections.map((corr, index) => (<div key={index} className="text-sm border-b border-glass-border pb-2"><p className="text-muted-foreground"><span className="line-through">{corr.original}</span> → <span className="text-green-400 font-semibold">{corr.corrigido || 'REMOVIDO'}</span></p><p className="text-xs text-editorial">{corr.tipo}</p></div>))}</div>) : (<div className="text-center text-muted-foreground py-10"><p>O relatório das alterações será exibido aqui após a revisão.</p></div>)}</CardContent>
        </Card>
      </div>
    </div>
  );
};