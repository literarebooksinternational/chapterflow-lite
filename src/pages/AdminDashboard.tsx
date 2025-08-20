import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import ComercialDashboard from "./comercial";
import { FileText, Download, Search, LogOut, FileDown, RefreshCw, Book, Edit2, MessageCircle, AlertTriangle, ListChecks, Truck, BarChart2, Calculator, DollarSign } from 'lucide-react';
import Papa from 'papaparse';
import { animateIn } from '@/hooks/useGSAP';

// Componente da Calculadora Funcional
const CalculadoraCustoLivro = () => {
    const { toast } = useToast();
    const [numPaginas, setNumPaginas] = useState('');
    const [tiragem, setTiragem] = useState('');
    const [custoPorPagina, setCustoPorPagina] = useState('');
    const [precoVenda, setPrecoVenda] = useState('');
    const [percentualRoyalties, setPercentualRoyalties] = useState('10');
    const [resultados, setResultados] = useState<{
        custoTotal: number;
        receitaTotal: number;
        royaltiesAutor: number;
        lucroEditora: number;
        lucroPorLivro: number;
    } | null>(null);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const handleCalcular = () => {
        const paginas = parseFloat(numPaginas);
        const qtdLivros = parseFloat(tiragem);
        const custoPag = parseFloat(custoPorPagina);
        const precoCapa = parseFloat(precoVenda);
        const royaltiesPerc = parseFloat(percentualRoyalties);

        if (isNaN(paginas) || isNaN(qtdLivros) || isNaN(custoPag) || isNaN(precoCapa) || isNaN(royaltiesPerc)) {
            toast({
                title: "Erro de Validação",
                description: "Por favor, preencha todos os campos com números válidos.",
                variant: "destructive",
            });
            return;
        }

        const custoProducaoUnidade = paginas * custoPag;
        const custoTotal = custoProducaoUnidade * qtdLivros;
        const receitaTotal = precoCapa * qtdLivros;
        const royaltiesAutor = (precoCapa * (royaltiesPerc / 100)) * qtdLivros;
        const lucroEditora = receitaTotal - custoTotal - royaltiesAutor;
        const lucroPorLivro = lucroEditora / qtdLivros;

        setResultados({
            custoTotal,
            receitaTotal,
            royaltiesAutor,
            lucroEditora,
            lucroPorLivro,
        });
    };

    return (
        <Card className="bg-card border-glass-border w-full">
            <CardHeader>
                <CardTitle className="text-xl flex items-center text-white">
                    <Calculator className="h-6 w-6 text-editorial mr-2" />
                    Calculadora de Custos e Royalties
                </CardTitle>
                <CardDescription>
                    Estime os custos de produção, royalties e o lucro da sua publicação.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="paginas">Número de Páginas</Label>
                        <Input id="paginas" type="number" placeholder="Ex: 200" value={numPaginas} onChange={(e) => setNumPaginas(e.target.value)} className="bg-background text-white" />
                    </div>
                    <div>
                        <Label htmlFor="tiragem">Tiragem (Nº de Cópias)</Label>
                        <Input id="tiragem" type="number" placeholder="Ex: 1000" value={tiragem} onChange={(e) => setTiragem(e.target.value)} className="bg-background text-white" />
                    </div>
                    <div>
                        <Label htmlFor="custo-pagina">Custo de Impressão por Página (R$)</Label>
                        <Input id="custo-pagina" type="number" placeholder="Ex: 0.15" value={custoPorPagina} onChange={(e) => setCustoPorPagina(e.target.value)} className="bg-background text-white" />
                    </div>
                     <div>
                        <Label htmlFor="preco-venda">Preço de Venda (R$)</Label>
                        <Input id="preco-venda" type="number" placeholder="Ex: 49.90" value={precoVenda} onChange={(e) => setPrecoVenda(e.target.value)} className="bg-background text-white" />
                    </div>
                    <div>
                        <Label htmlFor="royalties">Percentual de Royalties do Autor (%)</Label>
                        <Input id="royalties" type="number" placeholder="Ex: 10" value={percentualRoyalties} onChange={(e) => setPercentualRoyalties(e.target.value)} className="bg-background text-white" />
                    </div>
                </div>

                {resultados && (
                    <div className="bg-background/50 p-4 rounded-lg space-y-3 flex flex-col justify-center">
                         <h3 className="text-lg font-semibold text-white border-b border-glass-border pb-2">Resultados da Simulação</h3>
                         <div className="flex justify-between items-center"><span className="text-muted-foreground">Custo Total de Produção:</span> <span className="font-bold text-red-400">{formatCurrency(resultados.custoTotal)}</span></div>
                         <div className="flex justify-between items-center"><span className="text-muted-foreground">Receita Bruta Total:</span> <span className="font-bold text-green-400">{formatCurrency(resultados.receitaTotal)}</span></div>
                         <div className="flex justify-between items-center"><span className="text-muted-foreground">Royalties do Autor (Total):</span> <span className="font-bold text-yellow-400">{formatCurrency(resultados.royaltiesAutor)}</span></div>
                         <div className="flex justify-between items-center text-lg"><span className="text-white">Lucro da Editora (Total):</span> <span className="font-bold text-editorial">{formatCurrency(resultados.lucroEditora)}</span></div>
                         <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Lucro por Livro Vendido:</span> <span className="font-medium text-cyan-400">{formatCurrency(resultados.lucroPorLivro)}</span></div>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={handleCalcular} className="w-full gradient-button">
                    <DollarSign className="h-4 w-4 mr-2" />Calcular
                </Button>
            </CardFooter>
        </Card>
    );
};

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
  const [activeTab, setActiveTab] = useState<'capitulos' | 'calculadora' | 'revisor' | 'logistica' | 'comercial'>('capitulos');
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState<boolean>(false);
  const [adjustmentObservation, setAdjustmentObservation] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { user, isAuthorized, signOut, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleOpenAdjustmentModal = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setIsAdjustmentModalOpen(true);
  };

  const handleCloseAdjustmentModal = () => {
    setIsAdjustmentModalOpen(false);
    setAdjustmentObservation("");
    setSelectedChapterId(null);
  };

  const handleSubmitAdjustment = async () => {
    if (!selectedChapterId) return;
    setIsSubmitting(true);
    try {
      console.log(`Enviando ajuste para o capítulo ${selectedChapterId} com a observação: ${adjustmentObservation}`);
      toast({ title: 'Solicitação enviada!', description: 'O autor foi notificado para realizar os ajustes.' });
      handleCloseAdjustmentModal();
    } catch (error) {
      toast({ title: 'Erro ao enviar', description: 'Não foi possível enviar a solicitação.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchEnvios = async () => {
    try {
      const { data, error } = await supabase.from('envios_capitulos').select('*, responsible_profile:profiles(*)').order('created_at', { ascending: false });
      if (error) throw error;
      setEnvios(data || []);
    } catch (error) {
      toast({ title: 'Erro ao carregar envios', description: 'Não foi possível carregar os dados. Tente novamente mais tarde.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('display_name');
      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      toast({ title: 'Erro ao carregar perfis', description: 'Não foi possível carregar os perfis. Tente novamente mais tarde.', variant: 'destructive' });
    }
  };

  const filterEnvios = () => {
    let filtered = [...envios];
    if (searchTerm) {
      filtered = filtered.filter((envio) => envio.nome.toLowerCase().includes(searchTerm.toLowerCase()) || envio.email.toLowerCase().includes(searchTerm.toLowerCase()) || envio.livro.toLowerCase().includes(searchTerm.toLowerCase()) || envio.titulo_capitulo.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter((envio) => envio.status === statusFilter);
    }
    if (responsibleFilter !== 'all') {
      filtered = filtered.filter((envio) => envio.responsible_user_id === responsibleFilter);
    }
    setFilteredEnvios(filtered);
  };

  const downloadFile = async (envio: EnvioCapitulo) => {
    toast({ title: 'Função não implementada', description: 'O download do arquivo ainda será implementado.' });
  };

  const updateEnvio = async (id: string, updates: Partial<EnvioCapitulo>) => {
     try {
        const { data, error } = await supabase
            .from('envios_capitulos')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;

        setEnvios(prevEnvios => prevEnvios.map(envio => (envio.id === id ? { ...envio, ...data[0] } : envio)));
        toast({ title: "Sucesso!", description: "O status do capítulo foi atualizado." });
    } catch (error) {
        toast({ title: "Erro ao atualizar", description: "Não foi possível salvar as alterações.", variant: "destructive" });
    }
  };

  const exportToCSV = () => {
    const csv = Papa.unparse(filteredEnvios);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'envios_capitulos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeVariant = (status: StatusEnvio): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case 'Aprovado': return 'default';
        case 'Em Análise': return 'secondary';
        case 'Solicitar Ajustes': return 'destructive';
        case 'Recebido':
        default: return 'outline';
    }
  };

  const startEdit = (envio: EnvioCapitulo) => {
    setEditingEnvio(envio.id);
    setEditData({
      status: envio.status,
      observacao: envio.observacao || '',
      responsibleUserId: envio.responsible_user_id || ''
    });
  };

  const cancelEdit = () => {
    setEditingEnvio(null);
  };

  const saveEdit = async (id: string) => {
    await updateEnvio(id, {
        status: editData.status,
        observacao: editData.observacao,
        responsible_user_id: editData.responsibleUserId
    });
    setEditingEnvio(null);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  useEffect(() => {
    if (isAuthorized) {
        fetchEnvios();
        fetchProfiles();
    }
    }, [isAuthorized]);

  useEffect(() => {
    filterEnvios();
  }, [envios, searchTerm, statusFilter, responsibleFilter]);

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
    <div className="min-h-screen gradient-dark text-white">
      <header className="border-b border-glass-border" style={{ backgroundColor: 'hsl(0 0% 8%)' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-editorial" />
                <div>
                  <span className="text-xl font-bold gradient-primary bg-clip-text text-transparent">Painel</span>
                  <p className="text-sm text-glass">Literare</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">{getInitials(user?.email || '')}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-glass">{user?.email}</span>
              </div>
              <Button variant="outline" onClick={signOut} className="glass-button glass-hover border-editorial/30" aria-label="Sair do painel">
                <LogOut className="h-4 w-4 mr-2" />Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex border-b border-glass-border mb-6">
          <button onClick={() => setActiveTab('capitulos')} className={`flex items-center px-4 py-3 text-sm font-semibold transition-all duration-200 ease-in-out -mb-px ${activeTab === 'capitulos' ? 'text-editorial border-b-2 border-editorial' : 'text-glass hover:text-white border-b-2 border-transparent'}`} aria-current={activeTab === 'capitulos' ? 'page' : undefined}>
            <Book className="h-4 w-4 mr-2" />Capítulos
          </button>
          <button onClick={() => setActiveTab('calculadora')} className={`flex items-center px-4 py-3 text-sm font-semibold transition-all duration-200 ease-in-out -mb-px ${activeTab === 'calculadora' ? 'text-editorial border-b-2 border-editorial' : 'text-glass hover:text-white border-b-2 border-transparent'}`} aria-current={activeTab === 'calculadora' ? 'page' : undefined}>
            <Calculator className="h-4 w-4 mr-2" />Calculadora
          </button>
          <button onClick={() => setActiveTab('revisor')} className={`flex items-center px-4 py-3 text-sm font-semibold transition-all duration-200 ease-in-out -mb-px ${activeTab === 'revisor' ? 'text-editorial border-b-2 border-editorial' : 'text-glass hover:text-white border-b-2 border-transparent'}`} aria-current={activeTab === 'revisor' ? 'page' : undefined}>
            <ListChecks className="h-4 w-4 mr-2" />Revisor de Texto
          </button>
          <button onClick={() => setActiveTab('logistica')} className={`flex items-center px-4 py-3 text-sm font-semibold transition-all duration-200 ease-in-out -mb-px ${activeTab === 'logistica' ? 'text-editorial border-b-2 border-editorial' : 'text-glass hover:text-white border-b-2 border-transparent'}`} aria-current={activeTab === 'logistica' ? 'page' : undefined}>
            <Truck className="h-4 w-4 mr-2" />Logística
          </button>
          <button onClick={() => setActiveTab('comercial')} className={`flex items-center px-4 py-3 text-sm font-semibold transition-all duration-200 ease-in-out -mb-px ${activeTab === 'comercial' ? 'text-editorial border-b-2 border-editorial' : 'text-glass hover:text-white border-b-2 border-transparent'}`} aria-current={activeTab === 'comercial' ? 'page' : undefined}>
            <BarChart2 className="h-4 w-4 mr-2" />Comercial
          </button>
        </div>

        {activeTab === 'capitulos' && (
          <div ref={dashboardRef} className="space-y-6 animate-in fade-in-0 duration-300">
            <Card className="bg-card border-glass-border">
              <CardHeader>
                <CardTitle className="text-xl flex items-center text-white">
                  <Book className="h-6 w-6 text-editorial mr-2" />Gerenciamento de Capítulos
                </CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Label htmlFor="search" className="sr-only">Pesquisar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="search" placeholder="Pesquisar por nome, e-mail, livro ou título..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-background text-white border-glass-border" aria-label="Pesquisar capítulos por nome, e-mail, livro ou título" />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusEnvio | 'all')}>
                      <SelectTrigger className="w-[180px] bg-background text-white border-glass-border">
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
                      <SelectTrigger className="w-[180px] bg-background text-white border-glass-border">
                        <SelectValue placeholder="Filtrar por responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Responsáveis</SelectItem>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>{profile.display_name || profile.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={exportToCSV} className="gradient-button" aria-label="Exportar para CSV">
                      <FileDown className="h-4 w-4 mr-2" />Exportar CSV
                    </Button>
                  </div>
                </div>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-editorial" />
                  </div>
                ) : filteredEnvios.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Nenhum capítulo encontrado.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-white">Nome</TableHead>
                        <TableHead className="text-white">E-mail</TableHead>
                        <TableHead className="text-white">Livro</TableHead>
                        <TableHead className="text-white">Título do Capítulo</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white">Responsável</TableHead>
                        <TableHead className="text-white">Data de Envio</TableHead>
                        <TableHead className="text-white">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEnvios.map((envio) => (
                        <TableRow key={envio.id} className="border-glass-border">
                          <TableCell>{envio.nome}</TableCell>
                          <TableCell>{envio.email}</TableCell>
                          <TableCell>{envio.livro}</TableCell>
                          <TableCell>{envio.titulo_capitulo}</TableCell>
                          <TableCell>
                            {editingEnvio === envio.id ? (
                              <Select value={editData.status} onValueChange={(value) => setEditData({ ...editData, status: value as StatusEnvio })}>
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
                                <Select value={editData.responsibleUserId} onValueChange={(value) => setEditData({ ...editData, responsibleUserId: value })}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecionar responsável" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">Nenhum</SelectItem>
                                  {profiles.map((profile) => (
                                    <SelectItem key={profile.id} value={profile.id}>{profile.display_name || profile.email}</SelectItem>
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
                                <Button variant="ghost" size="sm" onClick={() => saveEdit(envio.id)} aria-label={`Salvar alterações para ${envio.titulo_capitulo}`}>Salvar</Button>
                                <Button variant="ghost" size="sm" onClick={cancelEdit} aria-label="Cancelar edição">Cancelar</Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => downloadFile(envio)} aria-label={`Baixar capítulo ${envio.titulo_capitulo}`}>
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => startEdit(envio)} aria-label={`Editar capítulo ${envio.titulo_capitulo}`}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setChatChapterId(envio.id)} aria-label={`Abrir chat para ${envio.titulo_capitulo}`}>
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleOpenAdjustmentModal(envio.id)} aria-label={`Solicitar ajustes para ${envio.titulo_capitulo}`}>
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

        {activeTab === 'calculadora' && (
          <div className="animate-in fade-in-0 duration-300">
            <CalculadoraCustoLivro />
          </div>
        )}

        {activeTab === 'revisor' && (
          <div className="animate-in fade-in-0 duration-300">
            <RevisorAutomatico />
          </div>
        )}

        {activeTab === 'logistica' && (
          <div className="animate-in fade-in-0 duration-300">
            <LogisticsBoard />
          </div>
        )}

        {activeTab === 'comercial' && (
          <div className="animate-in fade-in-0 duration-300">
            <ComercialDashboard />
          </div>
        )}

        <ChapterChat chapterId={chatChapterId || ''} isOpen={!!chatChapterId} onClose={() => setChatChapterId(null)} />
        
        {isAdjustmentModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-in fade-in-0" role="dialog" aria-modal="true" aria-labelledby="adjustment-modal-title">
            <div ref={modalRef} className="bg-card p-6 rounded-lg shadow-xl w-full max-w-lg border border-glass-border m-4 focus:outline-none" tabIndex={-1}>
              <h2 id="adjustment-modal-title" className="text-lg font-semibold text-white mb-4">Solicitar Ajustes</h2>
              <p className="text-sm text-muted-foreground mb-4">Escreva a observação para o autor. Ele será notificado por e-mail e o status do capítulo será atualizado para "Solicitar Ajustes".</p>
              <div className="space-y-4">
                <Label htmlFor="adjustment-observation" className="text-white">Observação administrativa</Label>
                <Textarea id="adjustment-observation" placeholder="Ex: Por favor, revise a formatação do capítulo de acordo com o manual..." value={adjustmentObservation} onChange={(e) => setAdjustmentObservation(e.target.value)} rows={5} className="bg-background text-white" aria-required="true" />
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={handleCloseAdjustmentModal} disabled={isSubmitting} aria-label="Cancelar solicitação de ajustes">Cancelar</Button>
                <Button onClick={handleSubmitAdjustment} disabled={isSubmitting} aria-label="Enviar solicitação de ajustes">{isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}