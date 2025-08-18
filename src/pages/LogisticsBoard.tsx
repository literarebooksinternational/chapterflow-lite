import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Importa o cliente do Supabase

// Define o tipo Book para TypeScript
type Book = {
  id: string; // UUID
  nome_livro: string;
  data_envio_grafica: string; // Data como string
  previsao_entrega: string; // Data como string
  data_chegada_editora: string; // Data como string
  uantidade_solicitada: number; // <-- CORRIGIDO AQUI
  quantidade_recebida: number;
  isbn: string;
  nota_fiscal: string;
  cota_autores: boolean;
  etapa: string;
  criado_em: string; // Timestamp como string
  atualizado_em: string; // Timestamp como string
};

// Define os status
const statuses = [
  { key: 'enviado', label: 'Enviado para Gráfica' },
  { key: 'na-grafica', label: 'Está na Gráfica' },
  { key: 'editora', label: 'Chegou na Editora' },
  { key: 'cota', label: 'Cota de Autores' },
];

// Componente simples para tratamento de erros
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center text-red-500 p-4">
          Algo deu errado. Por favor, recarregue a página ou contate o suporte.
        </div>
      );
    }
    return this.props.children;
  }
}

export default function LogisticsBoard() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado para o formulário
  const [newBook, setNewBook] = useState<Partial<Book>>({
    nome_livro: '',
    data_envio_grafica: '',
    previsao_entrega: '',
    data_chegada_editora: '',
    uantidade_solicitada: 0, // <-- CORRIGIDO AQUI
    quantidade_recebida: 0,
    isbn: '',
    nota_fiscal: '',
    cota_autores: false,
    etapa: 'enviado',
  });

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from('logistica_tarefas')
      .select('*');

    if (error) {
      setError(error.message);
    } else {
      setBooks(data || []);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchBooks().finally(() => setLoading(false));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;
  
    setNewBook((prev) => ({
      ...prev,
      [name]: isCheckbox ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('logistica_tarefas')
      .insert([newBook]);

    if (error) {
      setError(error.message);
    } else {
      setNewBook({
        nome_livro: '',
        data_envio_grafica: '',
        previsao_entrega: '',
        data_chegada_editora: '',
        uantidade_solicitada: 0, // <-- CORRIGIDO AQUI
        quantidade_recebida: 0,
        isbn: '',
        nota_fiscal: '',
        cota_autores: false,
        etapa: 'enviado',
      });
      fetchBooks();
      setIsModalOpen(false);
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <ErrorBoundary>
      <div>
        <div className="mb-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-orange-500 text-white font-bold py-2 px-4 rounded hover:bg-orange-600 transition-colors"
          >
            Criar Nova Tarefa
          </button>
        </div>

        {isModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Criar Nova Tarefa</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* ... outros inputs ... */}
                <input
                  type="text"
                  name="nome_livro"
                  placeholder="Nome do Livro"
                  value={newBook.nome_livro}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded"
                />
                <input
                  type="date"
                  name="data_envio_grafica"
                  value={newBook.data_envio_grafica}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded"
                />
                <input
                  type="date"
                  name="previsao_entrega"
                  value={newBook.previsao_entrega}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded"
                />
                <input
                  type="date"
                  name="data_chegada_editora"
                  value={newBook.data_chegada_editora}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded"
                />

                <input
                  type="number"
                  name="uantidade_solicitada" // <-- CORRIGIDO AQUI
                  placeholder="Quantidade Solicitada"
                  value={newBook.uantidade_solicitada} // <-- CORRIGIDO AQUI
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded"
                />
                 <input
                  type="number"
                  name="quantidade_recebida"
                  placeholder="Quantidade Recebida"
                  value={newBook.quantidade_recebida}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded"
                />
                <input
                  type="text"
                  name="isbn"
                  placeholder="ISBN"
                  value={newBook.isbn}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded"
                />
                <input
                  type="text"
                  name="nota_fiscal"
                  placeholder="Nota Fiscal"
                  value={newBook.nota_fiscal}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded"
                />
                <label className="flex items-center space-x-2 text-white">
                  <span>Cota de Autores</span>
                  <input
                    type="checkbox"
                    name="cota_autores"
                    checked={newBook.cota_autores}
                    onChange={handleInputChange}
                    className="form-checkbox h-5 w-5 text-orange-500 bg-gray-700 border-gray-600 rounded"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full bg-orange-500 text-white font-bold py-2 px-4 rounded hover:bg-orange-600 transition-colors"
                >
                  Criar Tarefa
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6" role="region" aria-label="Quadro de Logística">
          {statuses.map((col) => (
            <div
              key={col.key}
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col h-[75vh]"
              role="group"
              aria-label={`Coluna ${col.label}`}
            >
              <h2 className="text-orange-500 font-semibold text-lg mb-4">
                {col.label}
              </h2>
              <div className="flex flex-col gap-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {books.filter((b) => b.etapa === col.key).map((book) => (
                  <div
                    key={book.id}
                    className="relative bg-gray-900/50 border border-gray-700 rounded-md p-4 hover:shadow-lg transition-shadow duration-200"
                    role="article"
                    aria-label={`Livro ${book.nome_livro}`}
                  >
                    {/* ... */}
                    <p className="text-sm text-gray-400">
                      Qtd: {book.uantidade_solicitada} / {book.quantidade_recebida} {/* <-- CORRIGIDO AQUI */}
                    </p>
                    {/* ... */}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
}