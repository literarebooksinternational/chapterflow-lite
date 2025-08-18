import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { EnvioCapitulo, StatusEnvio, Profile } from '@/types/database';
import { Navigate } from 'react-router-dom';
import ChapterChat from '@/components/AdminDashboard/ChapterChat';
import LogisticsBoard from "@/pages/LogisticsBoard";
import { RevisorAutomatico } from "@/components/AdminDashboard/RevisorAutomatico";
import { FileText, Download, Filter, Search, LogOut, Settings, FileDown, RefreshCw, Calendar, User, Book, Edit2, MessageCircle, Calculator as CalculatorIcon, Copy, Image as ImageIcon, BookOpen, Hash, AlertTriangle, ListChecks, Truck } from 'lucide-react';
import Papa from 'papaparse';
import { animateIn } from '@/hooks/useGSAP';

// --- Calculator Component (unchanged) ---
const Calculator = () => {
  const { toast } = useToast();

  const [caracteres, setCaracteres] = useState('');
  const [subtitulos, setSubtitulos] = useState('');
  const [capitulos, setCapitulos] = useState('');
  const [imgPequena, setImgPequena] = useState('');
  const [imgMedia, setImgMedia] = useState('');
  const [imgGrande, setImgGrande] = useState('');
  const [tipoLivro, setTipoLivro] = useState('solo');
  const [tamanhoLivro, setTamanhoLivro] = useState('16x23');
  const [resultadoFinal, setResultadoFinal] = useState<{ paginas: number; texto: string } | null>(null);
  const [dashValues, setDashValues] = useState({
    paginas: 0,
    caracteres: '0',
    capitulos: '0',
    imagens: '0',
  });
  const calculatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (calculatorRef.current) {
      animateIn(Array.from(calculatorRef.current.children), { y: 20 });
    }
  }, []);

  const formatarNumero = (valor: string): string => valor.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const desformatarNumero = (valor: string): number => parseInt(valor.replace(/\./g, '').replace(/\D/g, '')) || 0;
  const arredondarParaMultiploDe8 = (num: number): number => Math.ceil(num / 8) * 8;

  const handleNumericInput = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const valorFormatado = formatarNumero(value);
    setter(valorFormatado);
  };

  const handleCalcular = () => {
    const numCaracteres = desformatarNumero(caracteres);
    const numSubtitulos = desformatarNumero(subtitulos);
    const numCapitulos = desformatarNumero(capitulos);
    const numImgPequena = desformatarNumero(imgPequena);
    const numImgMedia = desformatarNumero(imgMedia);
    const numImgGrande = desformatarNumero(imgGrande);
    let caracteresPorPagina = tamanhoLivro === '14x21' ? 1000 : 1500;
    if (tipoLivro === 'coautoria') caracteresPorPagina *= 1.1;
    const paginasTexto = numCaracteres / caracteresPorPagina;
    const paginasSubtitulos = numSubtitulos * 0.1;
    const paginasImgPequena = numImgPequena * (1 / 3);
    const paginasImgMedia = numImgMedia * 0.5;
    const paginasImgGrande = numImgGrande * 1;
    const paginasCapitulos = numCapitulos * 2;
    const total = paginasTexto + paginasSubtitulos + paginasImgPequena + paginasImgMedia + paginasImgGrande + paginasCapitulos;
    const resultado = arredondarParaMultiploDe8(total);
    const totalImagens = numImgPequena + numImgMedia + numImgGrande;
    const textoResultado = `Estimativa: ${resultado} páginas no formato ${tamanhoLivro}.`;
    setResultadoFinal({ paginas: resultado, texto: textoResultado });
    setDashValues({
      paginas: resultado,
      caracteres: formatarNumero(String(numCaracteres)),
      capitulos: formatarNumero(String(numCapitulos)),
      imagens: formatarNumero(String(totalImagens)),
    });
  };

  const copiarResultado = () => {
    if (resultadoFinal?.texto) {
      navigator.clipboard.writeText(resultadoFinal.texto).then(() => {
        toast({
          title: "Copiado!",
          description: "O resultado foi copiado para a área de transferência.",
        });
      });
    }
  };

  const summaryCards = [
    { title: "Páginas", value: dashValues.paginas, icon: <BookOpen className="h-8 w-8 text-editorial" /> },
    { title: "Caracteres", value: dashValues.caracteres, icon: <FileText className="h-8 w-8 text-blue-500" /> },
    { title: "Capítulos", value: dashValues.capitulos, icon: <Hash className="h-8 w-8 text-yellow-500" /> },
    { title: "Imagens", value: dashValues.imagens, icon: <ImageIcon className="h-8 w-8 text-green-500" /> }
  ];

  return (
    <div ref={calculatorRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader><CardTitle className="text-xl flex items-center"><CalculatorIcon className="mr-2 h-6 w-6 text-editorial" />Calculadora de Páginas</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label htmlFor="caracteres">Quantidade de caracteres</Label><Input id="caracteres" placeholder="Ex: 20.000" value={caracteres} onChange={(e) => handleNumericInput(e.target.value, setCaracteres)} /></div>
              <div className="space-y-2"><Label htmlFor="subtitulos">Quantidade de subtítulos</Label><Input id="subtitulos" placeholder="Ex: 10" value={subtitulos} onChange={(e) => handleNumericInput(e.target.value, setSubtitulos)} /></div>
              <div className="space-y-2"><Label htmlFor="capitulos">Quantidade de capítulos</Label><Input id="capitulos" placeholder="Ex: 5" value={capitulos} onChange={(e) => handleNumericInput(e.target.value, setCapitulos)} /></div>
              <div className="space-y-2"><Label htmlFor="imgPequena">Imagens pequenas</Label><Input id="imgPequena" placeholder="Ex: 3" value={imgPequena} onChange={(e) => handleNumericInput(e.target.value, setImgPequena)} /></div>
              <div className="space-y-2"><Label htmlFor="imgMedia">Imagens médias</Label><Input id="imgMedia" placeholder="Ex: 2" value={imgMedia} onChange={(e) => handleNumericInput(e.target.value, setImgMedia)} /></div>
              <div className="space-y-2"><Label htmlFor="imgGrande">Imagens grandes</Label><Input id="imgGrande" placeholder="Ex: 1" value={imgGrande} onChange={(e) => handleNumericInput(e.target.value, setImgGrande)} /></div>
              <div className="space-y-2"><Label htmlFor="tipoLivro">Tipo de livro</Label><Select value={tipoLivro} onValueChange={setTipoLivro}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="solo">Solo (fonte 12)</SelectItem><SelectItem value="coautoria">Coautoria (fonte 11)</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="tamanhoLivro">Tamanho do livro</Label><Select value={tamanhoLivro} onValueChange={setTamanhoLivro}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="16x23">16x23 cm</SelectItem><SelectItem value="14x21">14x21 cm</SelectItem></SelectContent></Select></div>
            </div>
            <Button onClick={handleCalcular} className="w-full gradient-button">Calcular</Button>
            {resultadoFinal && (<div className="flex items-center justify-between bg-muted p-3 rounded-lg border border-glass-border animate-in fade-in-0 slide-in-from-bottom-5 duration-500"><p className="font-semibold text-foreground">{resultadoFinal.texto}</p><Button variant="ghost" size="icon" onClick={copiarResultado}><Copy className="h-4 w-4 text-muted-foreground hover:text-white" /></Button></div>)}
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">{summaryCards.map((card, index) => (<Card key={index}><CardContent className="p-4"><div className="flex items-center space-x-4">{card.icon}<div><p className="text-2xl font-bold">{card.value}</p><p className="text-sm text-muted-foreground">{card.title}</p></div></div></CardContent></Card>))}</div>
    </div>
  );
};
// --- End of Calculator Component ---

export default function AdminDashboard() {
  const [envios, setEnvios] = useState<EnvioCapitulo[]>([]);
  const [filteredEnvios, setFilteredEnvios] = useState<EnvioCapitulo[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusEnvio | 'all'>('all');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
  const [editingEnvio, setEditingEnvio] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ status: StatusEnvio; observacao: string; responsibleUserId: string }>({ status: 'Recebido', observacao: '', responsibleUserId: '' });
  const [chatChapterId, setChatChapterId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'capitulos' | 'calculadora' | 'revisor' | 'logistica'>('capitulos');
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState<boolean>(false);
  const [adjustmentObservation, setAdjustmentObservation] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { user, isAuthorized, signOut, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null); // Added for modal focus management

  // Handle opening the adjustment modal
  const handleOpenAdjustmentModal = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setAdjustmentObservation("");
    setIsAdjustmentModalOpen(true);
  };

  // Handle closing the adjustment modal
  const handleCloseAdjustmentModal = () => {
    setIsAdjustmentModalOpen(false);
    setSelectedChapterId(null);
    setAdjustmentObservation("");
  };

  // Handle submitting adjustment request
  const handleSubmitAdjustment = async () => {
    if (!adjustmentObservation.trim()) {
      toast({ title: "Campo obrigatório", description: "Por favor, digite a observação administrativa.", variant: "destructive" });
      return;
    }
    if (!selectedChapterId) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("https://editorial-literare.onrender.com/api/SAjustes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedChapterId, observacao_admin: adjustmentObservation }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast({ title: "Sucesso!", description: "Autor notificado e capítulo atualizado com sucesso." });
        await fetchEnvios();
        handleCloseAdjustmentModal();
      } else {
        throw new Error(data.message || "Ocorreu um erro no servidor.");
      }
    } catch (error) {
      toast({
        title: "Erro ao solicitar ajustes",
        description: error instanceof Error ? error.message : "Não foi possível conectar à API.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch chapters
  const fetchEnvios = async () => {
    try {
      const { data, error } = await supabase
        .from('envios_capitulos')
        .select(`*, responsible_profile:profiles!envios_capitulos_responsible_user_id_fkey(*)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEnvios(data || []);
    } catch (error) {
      toast({
        title: 'Erro ao carregar envios',
        description: 'Não foi possível carregar os dados. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch profiles
  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('display_name');
      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      toast({
        title: 'Erro ao carregar perfis',
        description: 'Não foi possível carregar os perfis. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  };

  // Filter chapters based on search and filters
  const filterEnvios = () => {
    let filtered = [...envios];
    if (searchTerm) {
      filtered = filtered.filter(
        (envio) =>
          envio.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          envio.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          envio.livro.toLowerCase().includes(searchTerm.toLowerCase()) ||
          envio.titulo_capitulo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter((envio) => envio.status === statusFilter);
    }
    if (responsibleFilter !== 'all') {
      filtered = filtered.filter((envio) => envio.responsible_user_id === responsibleFilter);
    }
    setFilteredEnvios(filtered);
  };

  // Download chapter file
  const downloadFile = async (envio: EnvioCapitulo) => {
    try {
      const { data, error } = await supabase.storage.from('capitulos').download(envio.url_arquivo);
      if (error) throw error;
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${envio.nome}_${envio.titulo_capitulo}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: 'Download iniciado', description: 'O arquivo está sendo baixado.' });
    } catch (error) {
      toast({
        title: 'Erro no download',
        description: 'Não foi possível baixar o arquivo. Verifique a URL do arquivo.',
        variant: 'destructive',
      });
    }
  };

  // Update chapter
  const updateEnvio = async (id: string, updates: Partial<EnvioCapitulo>) => {
    try {
      const { error } = await supabase.from('envios_capitulos').update(updates).eq('id', id);
      if (error) throw error;
      if (updates.status && ['Aprovado', 'Solicitar Ajustes'].includes(updates.status)) {
        try {
          await supabase.functions.invoke('send-notifications', {
            body: { chapter_id: id, status: updates.status },
          });
        } catch (emailError) {
          console.error('Error sending notification email:', emailError);
          toast({
            title: 'Aviso',
            description: 'Capítulo atualizado, mas houve um erro ao enviar a notificação por e-mail.',
            variant: 'default',
          });
        }
      }
      setEnvios((prev) => prev.map((envio) => (envio.id === id ? { ...envio, ...updates } : envio)));
      toast({ title: 'Envio atualizado', description: 'As informações foram salvas com sucesso.' });
      setEditingEnvio(null);
      await fetchEnvios();
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const csvData = filteredEnvios.map((envio) => ({
      'Nome': envio.nome,
      'E-mail': envio.email,
      'Livro': envio.livro,
      'Tipo de Participação': envio.tipo_participacao,
      'Título do Capítulo': envio.titulo_capitulo,
      'Status': envio.status,
      'Observação Admin': envio.observacao_admin || '',
      'Comentário Adicional': envio.comentario_adicional || '',
      'Data de Envio': new Date(envio.created_at).toLocaleString('pt-BR'),
      'Última Atualização': new Date(envio.updated_at).toLocaleString('pt-BR'),
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `envios_capitulos_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast({ title: 'Exportação concluída', description: 'O arquivo CSV foi baixado com sucesso.' });
  };

  // Get badge variant based on status
  const getStatusBadgeVariant = (status: StatusEnvio) => {
    switch (status) {
      case 'Recebido':
        return 'secondary';
      case 'Em Análise':
        return 'default';
      case 'Aprovado':
        return 'default';
      case 'Solicitar Ajustes':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Start editing a chapter
  const startEdit = (envio: EnvioCapitulo) => {
    setEditingEnvio(envio.id);
    setEditData({
      status: envio.status,
      observacao: envio.observacao_admin || '',
      responsibleUserId: envio.responsible_user_id || '',
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingEnvio(null);
    setEditData({ status: 'Recebido', observacao: '', responsibleUserId: '' });
  };

  // Save edited chapter
  const saveEdit = (id: string) => {
    updateEnvio(id, {
      status: editData.status,
      observacao_admin: editData.observacao,
      responsible_user_id: editData.responsibleUserId || null,
    });
  };

  // Get user initials
  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Handle modal focus for accessibility
  useEffect(() => {
    if (isAdjustmentModalOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isAdjustmentModalOpen]);

  // Fetch data on mount
  useEffect(() => {
    if (user && isAuthorized) {
      fetchEnvios();
      fetchProfiles();
    }
  }, [user, isAuthorized]);

  // Apply animations
  useEffect(() => {
    if (dashboardRef.current && !authLoading) {
      if (activeTab === 'capitulos') {
        animateIn(Array.from(dashboardRef.current.children), { delay: 0.1 });
      }
    }
  }, [authLoading, activeTab]);

  // Filter chapters when dependencies change
  useEffect(() => {
    filterEnvios();
  }, [envios, searchTerm, statusFilter, responsibleFilter]);

  // Redirect if not authorized
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-dark">
        <RefreshCw className="h-8 w-8 animate-spin text-editorial" />
      </div>
    );
  }

  if (!user || !isAuthorized) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen gradient-dark">
      <header className="border-b border-glass-border" style={{ backgroundColor: 'hsl(0 0% 8%)' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-editorial" />
                <div>
                  <span className="text-xl font-bold gradient-primary bg-clip-text text-transparent">Editorial</span>
                  <p className="text-sm text-glass">Painel</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials(user?.email || '')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-glass">{user?.email}</span>
              </div>
              <Button
                variant="outline"
                onClick={signOut}
                className="glass-button glass-hover border-editorial/30"
                aria-label="Sair do painel"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex border-b border-glass-border mb-6">
          <button
            onClick={() => setActiveTab('capitulos')}
            className={`flex items-center px-4 py-3 text-sm font-semibold transition-all duration-200 ease-in-out -mb-px ${
              activeTab === 'capitulos'
                ? 'text-editorial border-b-2 border-editorial'
                : 'text-glass hover:text-white border-b-2 border-transparent'
            }`}
            aria-current={activeTab === 'capitulos' ? 'page' : undefined}
          >
            <Book className="h-4 w-4 mr-2" />
            Capítulos
          </button>
          <button
            onClick={() => setActiveTab('calculadora')}
            className={`flex items-center px-4 py-3 text-sm font-semibold transition-all duration-200 ease-in-out -mb-px ${
              activeTab === 'calculadora'
                ? 'text-editorial border-b-2 border-editorial'
                : 'text-glass hover:text-white border-b-2 border-transparent'
            }`}
            aria-current={activeTab === 'calculadora' ? 'page' : undefined}
          >
            <CalculatorIcon className="h-4 w-4 mr-2" />
            Calculadora
          </button>
          <button
            onClick={() => setActiveTab('revisor')}
            className={`flex items-center px-4 py-3 text-sm font-semibold transition-all duration-200 ease-in-out -mb-px ${
              activeTab === 'revisor'
                ? 'text-editorial border-b-2 border-editorial'
                : 'text-glass hover:text-white border-b-2 border-transparent'
            }`}
            aria-current={activeTab === 'revisor' ? 'page' : undefined}
          >
            <ListChecks className="h-4 w-4 mr-2" />
            Revisor de Texto
          </button>
          <button
            onClick={() => setActiveTab('logistica')}
            className={`flex items-center px-4 py-3 text-sm font-semibold transition-all duration-200 ease-in-out -mb-px ${
              activeTab === 'logistica'
                ? 'text-editorial border-b-2 border-editorial'
                : 'text-glass hover:text-white border-b-2 border-transparent'
            }`}
            aria-current={activeTab === 'logistica' ? 'page' : undefined}
          >
            <Truck className="h-4 w-4 mr-2" />
            Logística
          </button>
        </div>

        {/* CAPÍTULOS */}
        {activeTab === 'capitulos' && (
          <div ref={dashboardRef} className="space-y-6 animate-in fade-in-0 duration-300">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Book className="h-6 w-6 text-editorial mr-2" />
                  Gerenciamento de Capítulos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Label htmlFor="search" className="sr-only">Pesquisar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Pesquisar por nome, e-mail, livro ou título..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        aria-label="Pesquisar capítulos por nome, e-mail, livro ou título"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusEnvio | 'all')}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="Recebido">Recebido</SelectItem>
                        <SelectItem value="Em Análise">Em Análise</SelectItem>
                        <SelectItem value="Aprovado">Aprovado</SelectItem>
                        <SelectItem value="Solicitar Ajustes">Solicitar Ajustes</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Responsáveis</SelectItem>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.display_name || profile.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={exportToCSV} className="gradient-button" aria-label="Exportar para CSV">
                      <FileDown className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
                  </div>
                </div>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-editorial" />
                  </div>
                ) : filteredEnvios.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum capítulo encontrado.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Livro</TableHead>
                        <TableHead>Título do Capítulo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Data de Envio</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEnvios.map((envio) => (
                        <TableRow key={envio.id}>
                          <TableCell>{envio.nome}</TableCell>
                          <TableCell>{envio.email}</TableCell>
                          <TableCell>{envio.livro}</TableCell>
                          <TableCell>{envio.titulo_capitulo}</TableCell>
                          <TableCell>
                            {editingEnvio === envio.id ? (
                              <Select
                                value={editData.status}
                                onValueChange={(value) => setEditData({ ...editData, status: value as StatusEnvio })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Recebido">Recebido</SelectItem>
                                  <SelectItem value="Em Análise">Em Análise</SelectItem>
                                  <SelectItem value="Aprovado">Aprovado</SelectItem>
                                  <SelectItem value="Solicitar Ajustes">Solicitar Ajustes</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant={getStatusBadgeVariant(envio.status)}>{envio.status}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingEnvio === envio.id ? (
                              <Select
                                value={editData.responsibleUserId}
                                onValueChange={(value) => setEditData({ ...editData, responsibleUserId: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecionar responsável" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">Nenhum</SelectItem>
                                  {profiles.map((profile) => (
                                    <SelectItem key={profile.id} value={profile.id}>
                                      {profile.display_name || profile.email}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              envio.responsible_profile?.display_name || envio.responsible_profile?.email || 'Nenhum'
                            )}
                          </TableCell>
                          <TableCell>{new Date(envio.created_at).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>
                            {editingEnvio === envio.id ? (
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => saveEdit(envio.id)}
                                  aria-label={`Salvar alterações para ${envio.titulo_capitulo}`}
                                >
                                  Salvar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={cancelEdit}
                                  aria-label="Cancelar edição"
                                >
                                  Cancelar
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => downloadFile(envio)}
                                  aria-label={`Baixar capítulo ${envio.titulo_capitulo}`}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => startEdit(envio)}
                                  aria-label={`Editar capítulo ${envio.titulo_capitulo}`}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setChatChapterId(envio.id)}
                                  aria-label={`Abrir chat para ${envio.titulo_capitulo}`}
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenAdjustmentModal(envio.id)}
                                  aria-label={`Solicitar ajustes para ${envio.titulo_capitulo}`}
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* CALCULADORA */}
        {activeTab === 'calculadora' && (
          <div className="animate-in fade-in-0 duration-300">
            <Calculator />
          </div>
        )}

        {/* REVISOR */}
        {activeTab === 'revisor' && (
          <div className="animate-in fade-in-0 duration-300">
            <RevisorAutomatico />
          </div>
        )}

        {/* LOGÍSTICA */}
        {activeTab === 'logistica' && (
          <div className="animate-in fade-in-0 duration-300">
            <LogisticsBoard />
          </div>
        )}
      </div>

      <ChapterChat
        chapterId={chatChapterId || ''}
        isOpen={!!chatChapterId}
        onClose={() => setChatChapterId(null)}
      />

      {isAdjustmentModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-in fade-in-0"
          role="dialog"
          aria-modal="true"
          aria-labelledby="adjustment-modal-title"
        >
          <div
            ref={modalRef}
            className="bg-card p-6 rounded-lg shadow-xl w-full max-w-lg border border-glass-border m-4 focus:outline-none"
            tabIndex={-1}
          >
            <h2 id="adjustment-modal-title" className="text-lg font-semibold text-white mb-4">
              Solicitar Ajustes
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Escreva a observação para o autor. Ele será notificado por e-mail e o status do capítulo será atualizado para "Solicitar Ajustes".
            </p>
            <div className="space-y-4">
              <Label htmlFor="adjustment-observation" className="text-white">
                Observação administrativa
              </Label>
              <Textarea
                id="adjustment-observation"
                placeholder="Ex: Por favor, revise a formatação do capítulo de acordo com o manual..."
                value={adjustmentObservation}
                onChange={(e) => setAdjustmentObservation(e.target.value)}
                rows={5}
                className="bg-background text-white"
                aria-required="true"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={handleCloseAdjustmentModal}
                disabled={isSubmitting}
                aria-label="Cancelar solicitação de ajustes"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitAdjustment}
                disabled={isSubmitting}
                aria-label="Enviar solicitação de ajustes"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}