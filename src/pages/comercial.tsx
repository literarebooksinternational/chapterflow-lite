import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Crown, Star, Edit, DollarSign, Target, Calendar, RefreshCw } from 'lucide-react';

// Tipos de Dados
type Vendedora = {
  id: string;
  nome: string;
  meta_pessoal: number;
  total_vendido: number;
};

type MetaMensal = {
  valor_meta_geral: number;
};

type UserRole = 'admin' | 'vendedora' | null;

// Função para formatar valores monetários
const formatCurrency = (value: number | null | undefined) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

export default function ComercialDashboard() {
  const [vendedoras, setVendedoras] = useState<Vendedora[]>([]);
  const [metaMensal, setMetaMensal] = useState<MetaMensal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const currentMonthName = new Date().toLocaleString('pt-BR', { month: 'long' });
  const currentMonthNumber = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Função para buscar todos os dados necessários
  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (!user) return;

      // Busca a função do usuário atual
      const { data: userData } = await supabase.from('usuarios').select('role').eq('id', user.id).single();
      setUserRole(userData?.role || 'vendedora');

      // Busca a meta geral do mês
      const { data: metaData } = await supabase.from('meta_mensal').select('valor_meta_geral').eq('mes', currentMonthNumber).eq('ano', currentYear).single();
      setMetaMensal(metaData);
      
      // Busca vendedoras e vendas do mês em paralelo para otimização
      const [vendedorasRes, vendasRes] = await Promise.all([
        supabase.from('vendedoras').select('*'),
        supabase.from('vendas').select('vendedora_id, valor').eq('EXTRACT(MONTH from data)', currentMonthNumber).eq('EXTRACT(YEAR from data)', currentYear)
      ]);

      if (vendedorasRes.error) throw vendedorasRes.error;
      if (vendasRes.error) throw vendasRes.error;

      // Calcula o total vendido por vendedora
      const vendedorasComVendas = vendedorasRes.data.map(v => {
        const totalVendido = vendasRes.data
          ?.filter(venda => venda.vendedora_id === v.id)
          .reduce((acc, curr) => acc + (curr.valor || 0), 0) || 0;
        return { ...v, total_vendido: totalVendido };
      });
      setVendedoras(vendedorasComVendas);

    } catch (error: any) {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível buscar as informações do painel comercial.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Calcula o total de vendas do mês (só recalcula se as vendedoras mudarem)
  const totalVendidoMes = useMemo(() => {
    return vendedoras.reduce((acc, v) => acc + v.total_vendido, 0);
  }, [vendedoras]);

  // Encontra a maior vendedora do mês
  const maiorVendedoraId = useMemo(() => {
    if (vendedoras.length === 0) return null;
    const topSeller = vendedoras.reduce((max, current) => (current.total_vendido > max.total_vendido ? current : max));
    return topSeller.total_vendido > 0 ? topSeller.id : null;
  }, [vendedoras]);

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><RefreshCw className="h-8 w-8 animate-spin text-editorial" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-editorial/50 shadow-lg bg-card/50">
        <CardHeader>
          <div className="flex justify-between items-center">
             <CardTitle className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">Desempenho Comercial</CardTitle>
             {userRole === 'admin' && <Button size="sm" variant="outline"><Edit className="h-4 w-4 mr-2"/>Editar Meta Geral</Button>}
          </div>
          <p className="text-sm text-muted-foreground flex items-center"><Calendar className="mr-2 h-4 w-4" />{currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)} de {currentYear}</p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
            <div className="bg-background/70 p-4 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground">Meta Mensal Geral</p>
                <p className="text-2xl font-bold flex items-center justify-center gap-2"><Target className="text-editorial" /> {formatCurrency(metaMensal?.valor_meta_geral)}</p>
            </div>
            <div className="bg-background/70 p-4 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground">Total de Vendas Atual</p>
                <p className="text-2xl font-bold flex items-center justify-center gap-2"><DollarSign className="text-green-500" /> {formatCurrency(totalVendidoMes)}</p>
            </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        {vendedoras.sort((a, b) => b.total_vendido - a.total_vendido).map(vendedora => {
          const progresso = vendedora.meta_pessoal > 0 ? (vendedora.total_vendido / vendedora.meta_pessoal) * 100 : 0;
          const metaBatida = progresso >= 100;
          const isMaiorVendedora = vendedora.id === maiorVendedoraId;

          return (
            <Card key={vendedora.id} className="bg-card/50">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="text-2xl flex gap-2">
                                {isMaiorVendedora && <span title="Maior Vendedora do Mês" className="text-yellow-400">👑</span>}
                                {metaBatida && <span title="Meta Batida!" className="text-cyan-400">⭐</span>}
                            </div>
                            <div className="w-full">
                                <div className="flex justify-between items-baseline">
                                    <p className="font-bold text-lg text-white">{vendedora.nome}</p>
                                    <p className="text-xs text-muted-foreground">Meta: {formatCurrency(vendedora.meta_pessoal)}</p>
                                </div>
                                <Progress value={progresso} className="h-3 mt-1" />
                                <p className="text-sm font-semibold text-right mt-1 text-green-400">{formatCurrency(vendedora.total_vendido)}</p>
                            </div>
                        </div>

                        {userRole === 'admin' && (
                            <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-2" />
                                Alterar Dados
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Aqui entrariam os modais para edição, controlados por estados */}
    </div>
  );
}