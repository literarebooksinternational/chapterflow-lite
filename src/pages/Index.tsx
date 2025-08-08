import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { animateIn } from '@/hooks/useGSAP';
import { BookOpen, FileText, Users, Award } from 'lucide-react';

// Declarando global para o Vanta
declare global {
  interface Window {
    VANTA: any;
  }
}

const Index = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const vantaRef = useRef<HTMLDivElement>(null);
  const [vantaEffect, setVantaEffect] = useState<any>(null);

  useEffect(() => {
    if (heroRef.current) {
      animateIn(Array.from(heroRef.current.children), { delay: 0.15 });
    }
  }, []);

  useEffect(() => {
    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (!existingScript) {
          const script = document.createElement('script');
          script.src = src;
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject();
          document.body.appendChild(script);
        } else {
          resolve();
        }
      });

    const initVanta = async () => {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.birds.min.js');

        if (!vantaEffect && vantaRef.current && window.VANTA) {
          const effect = window.VANTA.BIRDS({
            el: vantaRef.current,
            THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            background: 'linear-gradient(121deg, rgba(0,0,0,1) 0%, rgba(21,21,21,1) 38%, rgba(35,35,35,1) 100%)',
            color1: 0xff9200,
            color2: 0xff9200,
            quantity: 4.0,
          });
          setVantaEffect(effect);
        }
      } catch (error) {
        console.error('Erro ao carregar o Vanta Birds:', error);
      }
    };

    initVanta();

    return () => {
      if (vantaEffect) {
        vantaEffect.destroy();
      }
    };
  }, [vantaEffect]);

  return (
    <div ref={vantaRef} className="min-h-screen relative overflow-hidden">
      {/* Conteúdo principal */}
      <div className="relative min-h-screen flex items-center justify-center">
        {/* Container do conteúdo */}
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div ref={heroRef} className="text-center max-w-4xl mx-auto">
            {/* Logo */}
            <div className="glass-card mb-8 inline-flex items-center justify-center p-6">
              <img
                src="https://i.postimg.cc/Z5jxcX97/logoliterare.png"
                alt="Logo da Empresa"
                className="h-12 w-auto"
              />
            </div>

            {/* Título principal */}
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

            {/* Cards de funcionalidades */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
              <div
                className="glass-card glass-hover text-center"
                style={{ backgroundColor: '#131313' }}
              >
                <div className="gradient-primary w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Envie Seu Capítulo</h3>
                <p className="text-glass">
                  Envie-o rápido e fácil pelo nosso formulário, garantindo que tudo chegue certo ao editorial.
                </p>
              </div>

              <div
                className="glass-card glass-hover text-center"
                style={{ backgroundColor: '#131313' }}
              >
                <div className="gradient-primary w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Processo Editorial</h3>
                <p className="text-glass">
                  Seu capítulo passa por revisão e diagramação cuidadosa.
                </p>
              </div>

              <div
                className="glass-card glass-hover text-center"
                style={{ backgroundColor: '#131313' }}
              >
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
        </div>

        {/* Elementos flutuantes */}
        <div className="absolute top-20 left-10 w-20 h-20 gradient-primary rounded-full opacity-20 animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-16 h-16 gradient-primary rounded-full opacity-10 animate-pulse"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute top-1/2 left-5 w-12 h-12 gradient-primary rounded-full opacity-15 animate-pulse"
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Footer com acesso editorial */}
      <div className="fixed bottom-6 right-6">
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
