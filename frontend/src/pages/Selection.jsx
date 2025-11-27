import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Stethoscope, ArrowRight } from 'lucide-react';

const Selection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />
      <main className="container mx-auto px-4 py-16 md:px-8 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Simple Diagnosis Option */}
          <Card 
            className="group hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-lg relative overflow-hidden"
            onClick={() => navigate('/simple')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                <Sparkles className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl">Diagnóstico Simples</CardTitle>
              <CardDescription className="text-base">
                Ideal para anotações rápidas e fluxo livre.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Digite toda a anamnese em um único campo de texto livre. A IA irá estruturar e analisar as informações automaticamente.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Entrada de texto livre
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Análise rápida
                </li>
              </ul>
              <Button className="w-full mt-4 group-hover:bg-primary" variant="outline">
                Selecionar Modo Simples <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Detailed Diagnosis Option */}
          <Card 
            className="group hover:border-secondary/50 transition-all duration-300 cursor-pointer hover:shadow-lg relative overflow-hidden"
            onClick={() => navigate('/detailed')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4 group-hover:bg-secondary group-hover:text-white transition-colors">
                <FileText className="h-6 w-6 text-secondary-foreground group-hover:text-white" />
              </div>
              <CardTitle className="text-2xl">Diagnóstico Detalhado</CardTitle>
              <CardDescription className="text-base">
                Estruturado para casos complexos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Preencha campos específicos para Queixa, Histórico, Exame Físico e Complementares. Maior precisão na coleta de dados.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  Campos estruturados
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  Ideal para documentação completa
                </li>
              </ul>
              <Button className="w-full mt-4 group-hover:bg-secondary group-hover:text-white" variant="outline">
                Selecionar Modo Detalhado <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Selection;
