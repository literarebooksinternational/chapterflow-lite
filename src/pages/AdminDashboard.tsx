import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { EnvioCapitulo, StatusEnvio, Profile } from '@/types/database';
import { Navigate } from 'react-router-dom';
import ChapterChat from '@/components/AdminDashboard/ChapterChat';
import { 
  FileText, 
  Download, 
  Filter, 
  Search, 
  LogOut, 
  Settings,
  FileDown,
  RefreshCw,
  Calendar,
  User,
  Book,
  Edit2,
  MessageCircle,
  UserPlus
} from 'lucide-react';
import Papa from 'papaparse';
import { animateIn } from '@/hooks/useGSAP';

/* 
 * Painel Administrativo com tipografia Inter/Outfit
 * Para alterações de cores/estilos, consulte src/index.css
 */

export default function AdminDashboard() {
  const [envios, setEnvios] = useState<EnvioCapitulo[]>([]);
  const [filteredEnvios, setFilteredEnvios] = useState<EnvioCapitulo[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusEnvio | 'all'>('all');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
  const [editingEnvio, setEditingEnvio] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ status: StatusEnvio; observacao: string; responsibleUserId: string }>({
    status: 'Recebido',
    observacao: '',
    responsibleUserId: ''
  });
  const [chatChapterId, setChatChapterId] = useState<string | null>(null);

  const { user, isAuthorized, signOut, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dashboardRef.current && !authLoading) {
      animateIn(Array.from(dashboardRef.current.children), { delay: 0.1 });
    }
  }, [authLoading]);

  useEffect(() => {
    if (user && isAuthorized) {
      fetchEnvios();
      fetchProfiles();
    }
  }, [user, isAuthorized]);

  useEffect(() => {
    filterEnvios();
  }, [envios, searchTerm, statusFilter, responsibleFilter]);

  // Redirect if not authenticated or not authorized
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-editorial" />
      </div>
    );
  }

  if (!user || !isAuthorized) {
    return <Navigate to="/admin" replace />;
  }

  const fetchEnvios = async () => {
    try {
      const { data, error } = await supabase
        .from('envios_capitulos')
        .select(`
          *,
          responsible_profile:profiles!envios_capitulos_responsible_user_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEnvios(data || []);
    } catch (error) {
      toast({
        title: 'Erro ao carregar envios',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('display_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const filterEnvios = () => {
    let filtered = [...envios];

    if (searchTerm) {
      filtered = filtered.filter(envio =>
        envio.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        envio.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        envio.livro.toLowerCase().includes(searchTerm.toLowerCase()) ||
        envio.titulo_capitulo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(envio => envio.status === statusFilter);
    }

    if (responsibleFilter !== 'all') {
      filtered = filtered.filter(envio => envio.responsible_user_id === responsibleFilter);
    }

    setFilteredEnvios(filtered);
  };

  const downloadFile = async (envio: EnvioCapitulo) => {
    try {
      const { data, error } = await supabase.storage
        .from('capitulos')
        .download(envio.url_arquivo);

      if (error) throw error;

      // Create download link
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${envio.nome}_${envio.titulo_capitulo}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Download iniciado',
        description: 'O arquivo está sendo baixado.',
      });
    } catch (error) {
      toast({
        title: 'Erro no download',
        description: 'Não foi possível baixar o arquivo.',
        variant: 'destructive',
      });
    }
  };

  const updateEnvio = async (id: string, updates: Partial<EnvioCapitulo>) => {
    try {
      const { error } = await supabase
        .from('envios_capitulos')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Send notification email if status changed to Aprovado or Solicitar Ajustes
      if (updates.status && ['Aprovado', 'Solicitar Ajustes'].includes(updates.status)) {
        try {
          await supabase.functions.invoke('send-notifications', {
            body: {
              chapter_id: id,
              status: updates.status
            }
          });
        } catch (emailError) {
          console.error('Error sending notification email:', emailError);
        }
      }

      // Update local state
      setEnvios(prev => prev.map(envio => 
        envio.id === id ? { ...envio, ...updates } : envio
      ));

      toast({
        title: 'Envio atualizado',
        description: 'As informações foram salvas com sucesso.',
      });

      setEditingEnvio(null);
      await fetchEnvios(); // Refresh to get updated responsible profile
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    }
  };

  const exportToCSV = () => {
    const csvData = filteredEnvios.map(envio => ({
      'Nome': envio.nome,
      'E-mail': envio.email,
      'Livro': envio.livro,
      'Tipo de Participação': envio.tipo_participacao,
      'Título do Capítulo': envio.titulo_capitulo,
      'Status': envio.status,
      'Observação Admin': envio.observacao_admin || '',
      'Comentário Adicional': envio.comentario_adicional || '',
      'Data de Envio': new Date(envio.created_at).toLocaleString('pt-BR'),
      'Última Atualização': new Date(envio.updated_at).toLocaleString('pt-BR')
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

    toast({
      title: 'Exportação concluída',
      description: 'O arquivo CSV foi baixado com sucesso.',
    });
  };

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

  const startEdit = (envio: EnvioCapitulo) => {
    setEditingEnvio(envio.id);
    setEditData({
      status: envio.status,
      observacao: envio.observacao_admin || '',
      responsibleUserId: envio.responsible_user_id || ''
    });
  };

  const cancelEdit = () => {
    setEditingEnvio(null);
    setEditData({ status: 'Recebido', observacao: '', responsibleUserId: '' });
  };

  const saveEdit = (id: string) => {
    updateEnvio(id, {
      status: editData.status,
      observacao_admin: editData.observacao,
      responsible_user_id: editData.responsibleUserId || null
    });
  };

  // Função para gerar iniciais do nome/email para avatar dos usuários
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen gradient-dark">
      {/* Header - Cor igual ao background da página inicial + espaço para logo */}
      <header className="border-b border-glass-border" style={{ backgroundColor: 'hsl(0 0% 8%)' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* Espaço para logo da empresa */}
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-editorial" />
                <div>
                  <span className="text-xl font-bold gradient-primary bg-clip-text text-transparent">
                    {/* Para alterar: substitua por <img src="/logo.png" alt="Logo" className="h-8" /> */}
                    Espaço para Logo
                  </span>
                  <p className="text-sm text-glass">Painel Administrativo</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Avatar do usuário administrador */}
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials(user?.email || '')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-glass">
                  {user?.email}
                </span>
              </div>
              <Button variant="outline" onClick={signOut} className="glass-button glass-hover border-editorial/30">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div ref={dashboardRef} className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-8 w-8 text-editorial" />
                  <div>
                    <p className="text-2xl font-bold">{envios.length}</p>
                    <p className="text-sm text-muted-foreground">Total de Envios</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {envios.filter(e => e.status === 'Recebido').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Recebidos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Settings className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {envios.filter(e => e.status === 'Em Análise').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Em Análise</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Download className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {envios.filter(e => e.status === 'Aprovado').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Aprovados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros e Ações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome, e-mail, livro ou título..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={(value: StatusEnvio | 'all') => setStatusFilter(value)}>
                    <SelectTrigger className="w-[180px] glass">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Recebido">Recebido</SelectItem>
                      <SelectItem value="Em Análise">Em Análise</SelectItem>
                      <SelectItem value="Aprovado">Aprovado</SelectItem>
                      <SelectItem value="Solicitar Ajustes">Solicitar Ajustes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Responsável</label>
                  <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
                    <SelectTrigger className="w-[180px] glass">
                      <SelectValue placeholder="Filtrar por responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.user_id} value={profile.user_id}>
                          {profile.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={fetchEnvios} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                  <Button onClick={exportToCSV} variant="outline">
                    <FileDown className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submissions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Envios de Capítulos ({filteredEnvios.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-editorial" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Autor</TableHead>
                        <TableHead>Livro</TableHead>
                        <TableHead>Capítulo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEnvios.map((envio) => (
                        <TableRow key={envio.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{envio.nome}</p>
                              <p className="text-sm text-muted-foreground">{envio.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{envio.livro}</TableCell>
                          <TableCell>{envio.titulo_capitulo}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{envio.tipo_participacao}</Badge>
                          </TableCell>
                          <TableCell>
                            {editingEnvio === envio.id ? (
                              <div className="space-y-2">
                                <Select 
                                  value={editData.status} 
                                  onValueChange={(value: StatusEnvio) => 
                                    setEditData(prev => ({ ...prev, status: value }))
                                  }
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Recebido">Recebido</SelectItem>
                                    <SelectItem value="Em Análise">Em Análise</SelectItem>
                                    <SelectItem value="Aprovado">Aprovado</SelectItem>
                                    <SelectItem value="Solicitar Ajustes">Solicitar Ajustes</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Textarea
                                  placeholder="Observação administrativa..."
                                  value={editData.observacao}
                                  onChange={(e) => setEditData(prev => ({ ...prev, observacao: e.target.value }))}
                                  rows={2}
                                  className="text-xs"
                                />
                                <div className="flex space-x-1">
                                  <Button size="sm" onClick={() => saveEdit(envio.id)}>
                                    Salvar
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <Badge variant={getStatusBadgeVariant(envio.status)}>
                                  {envio.status}
                                </Badge>
                                {envio.observacao_admin && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {envio.observacao_admin}
                                  </p>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(envio.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadFile(envio)}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => startEdit(envio)}
                                 disabled={editingEnvio === envio.id}
                                 className="glass-button glass-hover"
                               >
                                 <Edit2 className="h-3 w-3" />
                               </Button>
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => setChatChapterId(envio.id)}
                                 className="glass-button glass-hover"
                               >
                                 <MessageCircle className="h-3 w-3" />
                               </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {filteredEnvios.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm || statusFilter !== 'all' 
                          ? 'Nenhum envio encontrado com os filtros aplicados.' 
                          : 'Nenhum envio encontrado.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chapter Chat Modal */}
      <ChapterChat
        chapterId={chatChapterId || ''}
        isOpen={!!chatChapterId}
        onClose={() => setChatChapterId(null)}
      />
    </div>
  );
}
