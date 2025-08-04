import { useEffect, useRef } from 'react';
import { ChapterSubmissionForm } from '@/components/forms/ChapterSubmissionForm';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { FileText, Users, Shield } from 'lucide-react';
import { animateIn } from '@/hooks/useGSAP';

export default function SubmitChapter() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (heroRef.current) {
      animateIn(Array.from(heroRef.current.children), { delay: 0.1 });
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
            <nav className="flex items-center space-x-4">
              <Link to="/instrucoes">
                <Button variant="ghost">Instruções</Button>
              </Link>
              <Link to="/admin">
                <Button variant="outline">Área Administrativa</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center" ref={heroRef}>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Envie seu <span className="text-editorial">Capítulo</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Sistema moderno e seguro para envio de capítulos. 
            Centralize seus envios e mantenha tudo organizado.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm hover-lift">
              <FileText className="h-12 w-12 text-editorial mb-4" />
              <h3 className="font-semibold mb-2">Fácil de usar</h3>
              <p className="text-sm text-muted-foreground text-center">
                Interface intuitiva para envio rápido e eficiente
              </p>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm hover-lift">
              <Shield className="h-12 w-12 text-editorial mb-4" />
              <h3 className="font-semibold mb-2">Seguro</h3>
              <p className="text-sm text-muted-foreground text-center">
                Seus arquivos protegidos com criptografia
              </p>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm hover-lift">
              <Users className="h-12 w-12 text-editorial mb-4" />
              <h3 className="font-semibold mb-2">Organizado</h3>
              <p className="text-sm text-muted-foreground text-center">
                Controle total para a equipe editorial
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <ChapterSubmissionForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © 2024 Literare Books. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}