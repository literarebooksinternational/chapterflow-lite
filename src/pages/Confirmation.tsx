import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { CheckCircle, FileText, Home } from 'lucide-react';
import { animateIn } from '@/hooks/useGSAP';

export default function Confirmation() {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      animateIn(Array.from(contentRef.current.children), { delay: 0.2 });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl" ref={contentRef}>
        <Card className="editorial-shadow text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-3xl font-bold">
              <span className="text-editorial">Capítulo Enviado</span> com Sucesso!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg text-muted-foreground">
              Obrigado por enviar seu capítulo. Nossa equipe editorial irá analisá-lo 
              e você receberá uma confirmação por e-mail em breve.
            </p>
            
            <div className="bg-secondary/50 p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Próximos passos:</h3>
              <ul className="text-left space-y-2 text-sm">
                <li>✅ Confirmação por e-mail será enviada</li>
                <li>📋 Análise técnica pela equipe editorial</li>
                <li>📧 Retorno sobre o status do capítulo</li>
                <li>📚 Possível inclusão na publicação</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/">
                <Button className="bg-editorial hover:bg-editorial/90 text-white">
                  <FileText className="h-4 w-4 mr-2" />
                  Enviar Outro Capítulo
                </Button>
              </Link>
              <Link to="/instrucoes">
                <Button variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Ver Instruções
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}