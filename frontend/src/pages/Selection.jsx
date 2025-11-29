import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Stethoscope, ArrowRight, Syringe, Activity } from 'lucide-react';

const Selection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />
      <main className="container mx-auto px-4 py-16 md:px-8 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl">
          
          {/* Simple Diagnosis Option */}
          <Card 
            className="group hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-lg relative overflow-hidden flex flex-col"
            onClick={() => navigate('/simple')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                <Sparkles className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">Diagnóstico Simples</CardTitle>
              <CardDescription>
                Texto livre para análise rápida.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground flex-1">
                Digite a anamnese em um único campo. A IA estrutura e analisa automaticamente.
              </p>
              <Button className="w-full mt-auto group-hover:bg-primary" variant="outline">
                Acessar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Detailed Diagnosis Option */}
          <Card 
            className="group hover:border-blue-500/50 transition-all duration-300 cursor-pointer hover:shadow-lg relative overflow-hidden flex flex-col"
            onClick={() => navigate('/detailed')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-600">
                <FileText className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">Diagnóstico Detalhado</CardTitle>
              <CardDescription>
                Campos estruturados e completos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground flex-1">
                Preencha Queixa, Histórico e Exames separadamente para maior precisão.
              </p>
              <Button className="w-full mt-auto group-hover:bg-blue-600 group-hover:text-white" variant="outline">
                Acessar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Medication Guide Option */}
          <Card 
            className="group hover:border-green-500/50 transition-all duration-300 cursor-pointer hover:shadow-lg relative overflow-hidden flex flex-col"
            onClick={() => navigate('/medication')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors text-green-600">
                <Syringe className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">Guia Terapêutico</CardTitle>
              <CardDescription>
                Foco em prescrição e conduta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground flex-1">
                Descreva o quadro para receber sugestões de medicamentos, doses e vias de administração.
              </p>
              <Button className="w-full mt-auto group-hover:bg-green-600 group-hover:text-white" variant="outline">
                Acessar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Drug Interaction Option */}
          <Card 
            className="group hover:border-purple-500/50 transition-all duration-300 cursor-pointer hover:shadow-lg relative overflow-hidden flex flex-col"
            onClick={() => navigate('/interaction')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors text-purple-600">
                <Activity className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">Interação Medicamentosa</CardTitle>
              <CardDescription>
                Verifique a segurança de associações.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground flex-1">
                Adicione até 10 medicamentos para checar interações, riscos e condutas sugeridas.
              </p>
              <Button className="w-full mt-auto group-hover:bg-purple-600 group-hover:text-white" variant="outline">
                Acessar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
};

export default Selection;
