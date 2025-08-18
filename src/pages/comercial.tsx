import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Star, Edit, DollarSign, Target, Calendar, RefreshCw } from 'lucide-react';

// --- Tipos de Dados ---
type Vendedora = {
  id: string; nome: string; foto_url: string | null; meta_pessoal: number; total_vendido: number;
};
type MetaMensal = { valor_meta_geral: number; };
type UserRole = 'admin' | 'vendedora' | 'editor' | 'reviewer' | null;

// --- Funções Auxiliares ---
const formatCurrency = (value: number | null | undefined) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

// FUNÇÃO ATUALIZADA: Converte uma string formatada (ex: "-1.234,56") de volta para um número (-1234.56)
const parseFormattedCurrency = (value: string): number => {
  if (!value) return 0;
  const numberString = value
    .replace(/\./g, '')    // Remove os pontos de milhar
    .replace(',', '.');  // Substitui a vírgula decimal por ponto
  return parseFloat(numberString) || 0;
};

// --- Componente Principal ---
export default function ComercialDashboard() {
  const [vendedoras, setVendedoras] = useState<Vendedora[]>([]);
  const [metaMensal, setMetaMensal] = useState<MetaMensal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'metaGeral' | 'vendedora' | null>(null);
  const [editingVendedora, setEditingVendedora] = useState<Vendedora | null>(null);
  const [formData, setFormData] = useState({ metaGeral: '', metaPessoal: '', ajusteVenda: '' });

  const { user } = useAuth();
  const { toast } = useToast();
  const currentMonthNumber = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentMonthName = new Date().toLocaleString('pt-BR', { month: 'long' });
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (!user) return;
      const { data: userData } = await supabase.from('usuarios').select('role').eq('id', user.id).single();
      setUserRole(userData?.role || null);
      const { data: metaData } = await supabase.from('meta_mensal').select('valor_meta_geral').eq('mes', currentMonthNumber).eq('ano', currentYear).single();
      setMetaMensal(metaData);
      const { data: vendedorasData, error: vendedorasError } = await supabase.from('vendedoras').select('*');
      if (vendedorasError) throw vendedorasError;
      const { data: vendasData, error: vendasError } = await supabase.from('vendas').select('vendedora_id, valor').filter('data', 'gte', new Date(currentYear, currentMonthNumber - 1, 1).toISOString()).filter('data', 'lt', new Date(currentYear, currentMonthNumber, 1).toISOString());
      if (vendasError) throw vendasError;
      const vendedorasComVendas = vendedorasData.map(v => {
        const totalVendido = vendasData?.filter(venda => venda.vendedora_id === v.id).reduce((acc, curr) => acc + (curr.valor || 0), 0) || 0;
        return { ...v, total_vendido: totalVendido };
      });
      setVendedoras(vendedorasComVendas);
    } catch (error: any) {
      toast({ title: 'Erro ao carregar dados', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  const totalVendidoMes = useMemo(() => vendedoras.reduce((acc, v) => acc + v.total_vendido, 0), [vendedoras]);
  const maiorVendedoraId = useMemo(() => {
    if (vendedoras.length === 0) return null;
    const topSeller = vendedoras.reduce((max, current) => (current.total_vendido > max.total_vendido ? current : max));
    return topSeller.total_vendido > 0 ? topSeller.id : null;
  }, [vendedoras]);
  
  const handleOpenModal = (mode: 'metaGeral' | 'vendedora', vendedora: Vendedora | null = null) => {
    setModalMode(mode);
    if (mode === 'metaGeral') { setFormData({ metaGeral: formatCurrency(metaMensal?.valor_meta_geral).replace(/[R$\s]/g, ''), metaPessoal: '', ajusteVenda: '' }); }
    if (mode === 'vendedora' && vendedora) { setEditingVendedora(vendedora); setFormData({ metaPessoal: formatCurrency(vendedora.meta_pessoal).replace(/[R$\s]/g, ''), ajusteVenda: '', metaGeral: '' }); }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => { setIsModalOpen(false); setModalMode(null); setEditingVendedora(null); setFormData({ metaGeral: '', metaPessoal: '', ajusteVenda: '' }); };
  
  // FUNÇÃO DE FORMATAÇÃO DE MOEDA TOTALMENTE REFEITA
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const allowNegative = name === 'ajusteVenda';
    
    // Permite que o campo seja limpo ou que o sinal de menos seja digitado
    if (value === '' || (value === '-' && allowNegative)) {
      setFormData(prev => ({ ...prev, [name]: value }));
      return;
    }

    const isNegative = value.startsWith('-') && allowNegative;
    const digitsOnly = value.replace(/\D/g, '');

    if (digitsOnly === '') {
        setFormData(prev => ({ ...prev, [name]: isNegative ? '-' : '' }));
        return;
    }

    const numberValue = parseFloat(digitsOnly) / 100;
    
    const formattedDisplay = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numberValue);

    setFormData(prev => ({ ...prev, [name]: isNegative ? `-${formattedDisplay}` : formattedDisplay, }));
  };

  const handleSubmit = async () => {
    try {
      if (modalMode === 'metaGeral') {
        const novoValorMeta = parseFormattedCurrency(formData.metaGeral);
        const { error } = await supabase.from('meta_mensal').upsert({ mes: currentMonthNumber, ano: currentYear, valor_meta_geral: novoValorMeta }, { onConflict: 'mes,ano' });
        if (error) throw error;
        toast({ title: "Sucesso!", description: "Meta geral atualizada." });
      }

      if (modalMode === 'vendedora' && editingVendedora) {
        const ajusteVenda = parseFormattedCurrency(formData.ajusteVenda);
        const novaMetaPessoal = parseFormattedCurrency(formData.metaPessoal);
        if (ajusteVenda !== 0) {
          const { error } = await supabase.from('vendas').insert({ vendedora_id: editingVendedora.id, valor: ajusteVenda });
          if (error) throw error;
        }
        if (novaMetaPessoal !== editingVendedora.meta_pessoal) {
          const { error } = await supabase.from('vendedoras').update({ meta_pessoal: novaMetaPessoal }).eq('id', editingVendedora.id);
          if (error) throw error;
        }
        toast({ title: "Sucesso!", description: `Dados de ${editingVendedora.nome} atualizados.` });
      }
      await fetchData();
      handleCloseModal();
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: 'destructive' });
    }
  };

  if (isLoading) { return <div className="flex items-center justify-center p-8"><RefreshCw className="h-8 w-8 animate-spin text-editorial" /></div>; }

  return (
    <>
      <div className="space-y-6">
        <Card className="border-2 border-editorial/50 shadow-lg bg-card/50">
          <CardHeader>
            <div className="flex justify-between items-center"><CardTitle className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">Desempenho Comercial</CardTitle>{userRole === 'admin' && <Button size="sm" variant="outline" onClick={() => handleOpenModal('metaGeral')}><Edit className="h-4 w-4 mr-2"/>Editar Meta Geral</Button>}</div>
            <p className="text-sm text-muted-foreground flex items-center"><Calendar className="mr-2 h-4 w-4" />{currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)} de {currentYear}</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
            <div className="bg-background/70 p-4 rounded-lg"><p className="text-sm font-medium text-muted-foreground">Meta Mensal Geral</p><p className="text-2xl font-bold flex items-center justify-center gap-2"><Target className="text-editorial" /> {formatCurrency(metaMensal?.valor_meta_geral)}</p></div>
            <div className="bg-background/70 p-4 rounded-lg"><p className="text-sm font-medium text-muted-foreground">Total de Vendas Atual</p><p className="text-2xl font-bold flex items-center justify-center gap-2"><DollarSign className="text-green-500" /> {formatCurrency(totalVendidoMes)}</p></div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          {vendedoras.sort((a, b) => b.total_vendido - a.total_vendido).map(vendedora => {
            const progresso = vendedora.meta_pessoal > 0 ? (vendedora.total_vendido / vendedora.meta_pessoal) * 100 : 0;
            const metaBatida = progresso >= 100;
            const isMaiorVendedora = vendedora.id === maiorVendedoraId;
            return (
              <Card key={vendedora.id} className="bg-card/50">
                <CardContent className="p-4"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-4 flex-1"><Avatar className="h-12 w-12"><AvatarImage src={vendedora.foto_url || ''} alt={vendedora.nome} /><AvatarFallback>{getInitials(vendedora.nome)}</AvatarFallback></Avatar><div className="w-full"><div className="flex justify-between items-baseline"><div className="flex items-center gap-2"><p className="font-bold text-lg text-white">{vendedora.nome}</p><div className="text-lg flex gap-1.5">{isMaiorVendedora && <span title="Maior Vendedora do Mês">👑</span>}{metaBatida && <span title="Meta Batida!">⭐</span>}</div></div><p className="text-xs text-muted-foreground">Meta: {formatCurrency(vendedora.meta_pessoal)}</p></div><Progress value={progresso} className="h-3 mt-1" /><p className="text-sm font-semibold text-right mt-1 text-green-400">{formatCurrency(vendedora.total_vendido)}</p></div></div>{userRole === 'admin' && (<Button variant="outline" size="sm" onClick={() => handleOpenModal('vendedora', vendedora)} className="ml-4"><Edit className="h-4 w-4 mr-2" />Alterar</Button>)}</div></CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>{modalMode === 'metaGeral' ? 'Editar Meta Geral' : `Alterar Dados de ${editingVendedora?.nome}`}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            {modalMode === 'metaGeral' && (<div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="metaGeral" className="text-right">Meta (R$)</Label><Input id="metaGeral" name="metaGeral" value={formData.metaGeral} onChange={handleCurrencyChange} className="col-span-3" type="text" placeholder="Ex: 750.000,00" /></div>)}
            {modalMode === 'vendedora' && (<>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="ajusteVenda" className="text-right">Ajustar Vendas (R$)</Label><Input id="ajusteVenda" name="ajusteVenda" value={formData.ajusteVenda} onChange={handleCurrencyChange} className="col-span-3" type="text" placeholder="Use - para estornar"/></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="metaPessoal" className="text-right">Meta Pessoal (R$)</Label><Input id="metaPessoal" name="metaPessoal" value={formData.metaPessoal} onChange={handleCurrencyChange} className="col-span-3" type="text" placeholder="Ex: 150.000,00" /></div>
            </>)}
          </div>
          <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose><Button type="button" onClick={handleSubmit}>Salvar Alterações</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}