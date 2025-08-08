import { useEffect, useRef } from 'react'; // Removido o useState
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { animateIn } from '@/hooks/useGSAP';
import { BookOpen, FileText, Users, Award } from 'lucide-react';
import * as THREE from 'three';
// Certifique-se de que o tipo VantaEffect está definido se você o tiver em outro lugar
// ou importe-o se a biblioteca fornecer. Caso contrário, podemos inferi-lo.
import BIRDS from 'vanta/dist/vanta.birds.min';

// Interface para dar um tipo ao efeito Vanta, tornando o código mais seguro
interface VantaEffect {
  destroy: () => void;
}

const Index = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const vantaRef = useRef<HTMLDivElement>(null);
  // O useState para 'vantaEffect' foi removido, pois não é necessário.

  useEffect(() => {
    if (heroRef.current) {
      animateIn(Array.from(heroRef.current.children), { delay: 0.15 });
    }
  }, []);

  // VERSÃO CORRIGIDA E MAIS ROBUSTA do useEffect para Vanta.js
  useEffect(() => {
    let vantaEffect: VantaEffect | undefined; // Usamos uma variável local

    // Verificamos se a referência ao DIV existe antes de inicializar
    if (vantaRef.current) {
      vantaEffect = BIRDS({
        el: vantaRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        scale: 1,
        scaleMobile: 1,
        backgroundAlpha: 0,
        color1: 0xff9200,
        color2: 0xff9200,
        quantity: 4,
      });
    }

    // A função de limpeza é retornada. Ela será chamada quando o componente for desmontado.
    // Ela usa a variável 'vantaEffect' da closure para garantir que o efeito correto seja destruído.
    return () => {
      if (vantaEffect) {
        vantaEffect.destroy();
      }
    };
  }, []); // O array de dependências vazio garante que isso rode apenas na montagem e desmontagem.

  return (
    <div className="min-h-screen gradient-dark relative">
      {/* Background Pattern - círculos amarelos */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--editorial-orange)) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
          zIndex: 0,
        }}
      />

      {/* Vanta Birds */}
      <div
        ref={vantaRef}
        className="absolute inset-0"
        style={{
          zIndex: 10,
          pointerEvents: 'none',
          backgroundColor: 'transparent',
        }}
      />

      {/* Conteúdo principal */}
      <div ref={heroRef} className="relative z-20 text-center max-w-4xl mx-auto px-4 py-20">
        {/* Logo */}
        <div className="glass-card mb-8 inline-flex items-center justify-center p-6">
          <img
            src="https://i.postimg.cc/Z5jxcX97/logoliterare.png"
            alt="Logo da Empresa"
            className="h-12 w-auto"
          />
        </div>

        {/* Título */}
        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
          Editorial
          <span className="block gradient-primary bg-clip-text text-transparent">
            Literare Books
          </span>
        </h1>

        {/* Subtítulo */}
        <p className="text-xl md:text-2xl text-glass mb-12 max-w-2xl mx-auto leading-relaxed">
          Autoras e autores da Literare Books, enviem seus capítulos com praticidade e organização pelo formulário abaixo.
        </p>

        {/* Botões CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link to="/submit">
            <Button className="glass-button glass-hover text-lg px-8 py-4 h-auto">
              <FileText className="h-5 w-5 mr-2" />
              Enviar Capítulo
            </Button>
          </Link>

          <Link to="/instructions">
            <Button
              variant="outline"
              className="glass-button glass-hover text-lg px-8 py-4 h-auto border-editorial/30 text-editorial hover:bg-editorial/10"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Ver Instruções
            </Button>
          </Link>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          <div className="glass-card glass-hover text-center" style={{ backgroundColor: '#131313' }}>
            <div className="gradient-primary w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Envie Seu Capítulo</h3>
            <p className="text-glass">
              Envie-o rápido e fácil pelo nosso formulário, garantindo que tudo chegue certo ao editorial.
            </p>
          </div>

          <div className="glass-card glass-hover text-center" style={{ backgroundColor: '#131313' }}>
            <div className="gradient-primary w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Processo Editorial</h3>
            <p className="text-glass">
              Seu capítulo passa por revisão e diagramação cuidadosa.
            </p>
          </div>

          <div className="glass-card glass-hover text-center" style={{ backgroundColor: '#131313' }}>
            <div className="gradient-primary w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Fique conectado com o editorial</h3>
            <p className="text-glass">
              Se preciso, entraremos em contato para ajustes ou dúvidas.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Pulses */}
      <div className="absolute top-20 left-10 w-20 h-20 gradient-primary rounded-full opacity-20 animate-pulse z-10" />
      <div className="absolute bottom-20 right-10 w-16 h-16 gradient-primary rounded-full opacity-10 animate-pulse z-10" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-5 w-12 h-12 gradient-primary rounded-full opacity-15 animate-pulse z-10" style={{ animationDelay: '2s' }} />

      {/* Footer */}
      <div className="fixed bottom-6 right-6 z-20">
        <Link to="/admin">
          <Button
            variant="outline"
            className="glass-button glass-hover border-editorial/30 text-editorial hover:bg-editorial/10"
          >
            Acesso Editorial
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
