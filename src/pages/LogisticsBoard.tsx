import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// --- Ícones SVG ---
const IsbnIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> );
const ReceiptIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> );
const BoxIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7v10l8 4m0-14L4 7" /></svg> );
const CalendarIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> );
const ChevronLeftIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> );
const ChevronRightIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg> );

// --- Tipos e Constantes ---
type Book = {
  id: string; nome_livro: string; data_envio_grafica: string; previsao_entrega: string; data_chegada_editora: string | null; quantidade_solicitada: number; quantidade_recebida: number | null; isbn: string; nota_fiscal: string; cota_autores: boolean; etapa: string; criado_em: string; atualizado_em: string;
};

const statuses = [
  { key: 'enviado', label: 'Enviado para Gráfica' }, { key: 'na-grafica', label: 'Está na Gráfica' }, { key: 'editora', label: 'Chegou na Editora' }, { key: 'cota', label: 'Cota de Autores' },
];

const initialFormState: Partial<Book> = {
  nome_livro: '', data_envio_grafica: '', previsao_entrega: '', data_chegada_editora: '', quantidade_solicitada: 0, quantidade_recebida: 0, isbn: '', nota_fiscal: '', cota_autores: false, etapa: 'enviado',
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { if (this.state.hasError) { return <div className="text-center text-red-500 p-4">Algo deu errado.</div>; } return this.props.children; }
}

// --- Componente Principal ---
export default function LogisticsBoard() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Book>>(initialFormState);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBooks = async () => {
    const { data, error } = await supabase.from('logistica_tarefas').select('*').order('criado_em', { ascending: false });
    if (error) { setError(error.message); } else { setBooks(data || []); }
  };

  useEffect(() => {
    setLoading(true);
    fetchBooks().finally(() => setLoading(false));
  }, []);
  
  const handleMoveTask = async (bookId: string, currentStatus: string) => {
    const currentIndex = statuses.findIndex(s => s.key === currentStatus);
    if (currentIndex < statuses.length - 1) {
      const nextStatus = statuses[currentIndex + 1].key;
      const { error } = await supabase.from('logistica_tarefas').update({ etapa: nextStatus }).eq('id', bookId);
      if (error) { setError(error.message); } else { await fetchBooks(); }
    }
  };
  
  const handleMoveBack = async (bookId: string, currentStatus: string) => {
    const currentIndex = statuses.findIndex(s => s.key === currentStatus);
    if (currentIndex > 0) {
      const previousStatus = statuses[currentIndex - 1].key;
      const { error } = await supabase.from('logistica_tarefas').update({ etapa: previousStatus }).eq('id', bookId);
      if (error) { setError(error.message); } else { await fetchBooks(); }
    }
  };

  const filteredBooks = books.filter(book =>
    book.nome_livro.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.isbn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.nota_fiscal.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;
    const finalValue = type === 'number' ? (value === '' ? '' : Number(value)) : (isCheckbox ? checked : value);
    setFormData((prev) => ({ ...prev, [name]: finalValue, }));
  };

  const handleOpenCreateModal = () => {
    setEditingBookId(null); setFormData(initialFormState); setIsModalOpen(true);
  };

  const handleOpenEditModal = (book: Book) => {
    setEditingBookId(book.id);
    setFormData({ ...book, data_chegada_editora: book.data_chegada_editora || '', quantidade_recebida: book.quantidade_recebida || 0, });
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false); setEditingBookId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = { ...formData, data_chegada_editora: formData.data_chegada_editora || null, quantidade_recebida: formData.quantidade_recebida || null, quantidade_solicitada: formData.quantidade_solicitada || 0, };
    let error;
    if (editingBookId) {
      const { error: updateError } = await supabase.from('logistica_tarefas').update(submissionData).eq('id', editingBookId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('logistica_tarefas').insert([submissionData]);
      error = insertError;
    }
    if (error) { setError(error.message); } else { await fetchBooks(); closeModal(); }
  };
  
  if (loading) return <div className="text-center p-4">Carregando...</div>;
  if (error) return <div className="text-center text-red-500 p-4">Erro: {error}</div>;

  return (
    <ErrorBoundary>
      <div>
        <div className="flex justify-between items-center mb-4 gap-4">
          <button onClick={handleOpenCreateModal} className="bg-[#ffb319] text-black font-bold py-2 px-4 rounded hover:bg-[#ffc23d] transition-colors flex-shrink-0">Criar Nova Tarefa</button>
          <div className="w-full max-w-sm">
            <input type="text" placeholder="Pesquisar por livro, ISBN ou NF..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded" />
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={closeModal}>
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <div className="flex-shrink-0">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white">{editingBookId ? 'Editar Tarefa' : 'Criar Nova Tarefa'}</h2>
                  <button onClick={closeModal} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                </div>
              </div>
              
              {/* ===== INÍCIO DO CONTEÚDO RESTAURADO ===== */}
              <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
                <div><label htmlFor="nome_livro" className="block text-sm font-medium text-gray-300 mb-1">Nome do Livro</label><input id="nome_livro" type="text" name="nome_livro" placeholder="Ex: O Peregrino" value={formData.nome_livro} onChange={handleInputChange} required className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded"/></div>
                <div><label htmlFor="data_envio_grafica" className="block text-sm font-medium text-gray-300 mb-1">Data de Envio para Gráfica</label><input id="data_envio_grafica" type="date" name="data_envio_grafica" value={formData.data_envio_grafica} onChange={handleInputChange} required className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded"/></div>
                <div><label htmlFor="previsao_entrega" className="block text-sm font-medium text-gray-300 mb-1">Previsão de Entrega</label><input id="previsao_entrega" type="date" name="previsao_entrega" value={formData.previsao_entrega} onChange={handleInputChange} className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded"/></div>
                <div><label htmlFor="data_chegada_editora" className="block text-sm font-medium text-gray-300 mb-1">Data de Chegada na Editora (Opcional)</label><input id="data_chegada_editora" type="date" name="data_chegada_editora" value={formData.data_chegada_editora || ''} onChange={handleInputChange} className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded"/></div>
                <div><label htmlFor="quantidade_solicitada" className="block text-sm font-medium text-gray-300 mb-1">Quantidade Solicitada</label><input id="quantidade_solicitada" type="number" name="quantidade_solicitada" placeholder="Total de exemplares encomendados" value={formData.quantidade_solicitada} onChange={handleInputChange} required className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded"/></div>
                <div><label htmlFor="quantidade_recebida" className="block text-sm font-medium text-gray-300 mb-1">Quantidade Recebida</label><input id="quantidade_recebida" type="number" name="quantidade_recebida" placeholder="Exemplares que chegaram na editora" value={formData.quantidade_recebida || ''} onChange={handleInputChange} className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded"/></div>
                <div><label htmlFor="isbn" className="block text-sm font-medium text-gray-300 mb-1">ISBN</label><input id="isbn" type="text" name="isbn" placeholder="Código de barras do livro" value={formData.isbn} onChange={handleInputChange} required className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded"/></div>
                <div><label htmlFor="nota_fiscal" className="block text-sm font-medium text-gray-300 mb-1">Nota Fiscal</label><input id="nota_fiscal" type="text" name="nota_fiscal" placeholder="Número da NF-e da gráfica" value={formData.nota_fiscal} onChange={handleInputChange} required className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded"/></div>
                <label className="flex items-center space-x-3 text-white pt-2"><input type="checkbox" name="cota_autores" checked={!!formData.cota_autores} onChange={handleInputChange} className="form-checkbox h-5 w-5 text-[#ffb319] bg-gray-700 border-gray-600 rounded focus:ring-[#ffb319]"/><span>Cota de Autores (Envio já feito)</span></label>
                <button type="submit" className="w-full bg-[#ffb319] text-black font-bold py-2 px-4 rounded hover:bg-[#ffc23d] transition-colors !mt-6">{editingBookId ? 'Salvar Alterações' : 'Criar Tarefa'}</button>
              </form>
              {/* ===== FIM DO CONTEÚDO RESTAURADO ===== */}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6" role="region" aria-label="Quadro de Logística">
          {statuses.map((col) => (
            <div key={col.key} className="bg-[#141414] border border-gray-700 rounded-lg p-4 flex flex-col h-[75vh]" role="group">
              <h2 className="text-[#ffb319] font-semibold text-lg mb-4 flex-shrink-0">{col.label}</h2>
              <div className="flex flex-col gap-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {filteredBooks.filter((b) => b.etapa === col.key).length === 0 ? (
                  <div className="text-center text-gray-400 py-4">Nenhum livro aqui.</div>
                ) : (
                  filteredBooks
                    .filter((b) => b.etapa === col.key)
                    .map((book) => {
                      const currentIndex = statuses.findIndex(s => s.key === book.etapa);
                      const nextStatus = currentIndex < statuses.length - 1 ? statuses[currentIndex + 1] : null;
                      const previousStatus = currentIndex > 0 ? statuses[currentIndex - 1] : null;

                      return (
                        <div key={book.id} className="bg-gray-800 border border-gray-700 rounded-md p-3 flex flex-col space-y-3" role="article">
                          <div className="flex justify-between items-start"><h3 className="text-base font-semibold text-white pr-4">{book.nome_livro}</h3><button onClick={() => handleOpenEditModal(book)} className="text-xs text-gray-400 hover:text-white flex-shrink-0">Editar</button></div>
                          <div className="space-y-2 text-sm text-gray-300"><div className="flex items-center space-x-2"><IsbnIcon /><span>{book.isbn}</span></div><div className="flex items-center space-x-2"><ReceiptIcon /><span>NF: {book.nota_fiscal}</span></div><div className="flex items-center space-x-2"><BoxIcon /><span>{book.quantidade_solicitada} / {book.quantidade_recebida || 0}</span></div><div className="flex items-center space-x-2"><CalendarIcon /><span>Envio: {book.data_envio_grafica}</span></div></div>
                          {(nextStatus || previousStatus) && (
                            <div className="border-t border-gray-700 pt-2 mt-auto flex justify-between items-center">
                              {previousStatus ? ( <button onClick={() => handleMoveBack(book.id, book.etapa)} title={`Mover para: ${previousStatus.label}`} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700"><ChevronLeftIcon /></button> ) : ( <div /> )}
                              {nextStatus ? ( <button onClick={() => handleMoveTask(book.id, book.etapa)} title={`Mover para: ${nextStatus.label}`} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700"><ChevronRightIcon /></button> ) : ( <div /> )}
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
}