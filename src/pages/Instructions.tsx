import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { FileText, Upload, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { animateIn } from '@/hooks/useGSAP';

export default function Instructions() {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      animateIn(Array.from(contentRef.current.children), { delay: 0.1 });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-editorial" />
              <span className="text-xl font-bold">Literare Books</span>
            </div>
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Envio
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div ref={contentRef} className="max-w-4xl mx-auto space-y-8">
          {/* Título Principal */}
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              Instruções para <span className="text-editorial">Autores</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Guia completo para envio de capítulos
            </p>
          </div>

          {/* Como Enviar */}
          <Card className="editorial-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-6 w-6 text-editorial" />
                <span>Como Enviar seu Capítulo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-editorial text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-semibold">Preencha o formulário</h4>
                    <p className="text-muted-foreground">Complete todos os campos obrigatórios com suas informações</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-editorial text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-semibold">Anexe seu arquivo</h4>
                    <p className="text-muted-foreground">Faça upload do seu capítulo nos formatos aceitos</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-editorial text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-semibold">Envie e aguarde</h4>
                    <p className="text-muted-foreground">Você receberá uma confirmação por e-mail em breve</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requisitos do Arquivo */}
          <Card className="editorial-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-editorial" />
                <span>Requisitos do Arquivo</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Formatos Aceitos
                  </h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Documentos Word (.doc, .docx)</li>
                    <li>• Arquivos PDF (.pdf)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                    Limitações
                  </h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Tamanho máximo: 10MB</li>
                    <li>• Apenas um arquivo por envio</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dicas de Formatação */}
          <Card className="editorial-shadow">
            <CardHeader>
              <CardTitle>Dicas de Formatação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-secondary/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Recomendações para seu capítulo:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Use fonte Times New Roman ou Arial, tamanho 12</li>
                  <li>• Espaçamento entre linhas: 1,5</li>
                  <li>• Margens de 2,5cm em todos os lados</li>
                  <li>• Numere as páginas</li>
                  <li>• Inclua um cabeçalho com título do capítulo</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Status do Envio */}
          <Card className="editorial-shadow">
            <CardHeader>
              <CardTitle>Status do Envio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span><strong>Recebido:</strong> Seu capítulo foi recebido com sucesso</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span><strong>Em Análise:</strong> Sua proposta está sendo avaliada</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span><strong>Aprovado:</strong> Parabéns! Seu capítulo foi aprovado</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span><strong>Solicitar Ajustes:</strong> Precisa de algumas modificações</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card className="editorial-shadow">
            <CardHeader>
              <CardTitle>Precisa de Ajuda?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Se você tiver alguma dúvida ou problema técnico, entre em contato conosco:
              </p>
              <div className="space-y-2">
                <p><strong>E-mail:</strong> comunicacao@literarebooks.com.br</p>
                <p><strong>Horário de atendimento:</strong> Segunda a sexta, 9h às 18h</p>
              </div>
            </CardContent>
          </Card>

          {/* CTA Final */}
          <div className="text-center py-8">
            <Link to="/">
              <Button size="lg" className="bg-editorial hover:bg-editorial/90 text-white font-semibold px-8 py-3">
                Enviar Meu Capítulo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}