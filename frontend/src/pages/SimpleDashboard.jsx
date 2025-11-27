import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { ClinicalReport } from '@/components/ClinicalReport';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Activity, Sparkles, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const SimpleDashboard = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [anamnese, setAnamnese] = useState("");

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!anamnese.trim()) {
      toast.error("Por favor, descreva o caso clínico.");
      return;
    }

    setIsLoading(true);
    setReportData(null);

    // Simulate AI Processing Delay
    setTimeout(() => {
      // Mock Logic based on input
      let mockResponse;
      const text = anamnese.toLowerCase();

      if (text.includes("dor no peito") || text.includes("tórax") || text.includes("precordial")) {
        mockResponse = {
          diagnoses: [
            {
              name: "Síndrome Coronariana Aguda (SCA)",
              justification: "Sintomas descritos na anamnese livre sugerem quadro isquêmico agudo."
            },
            {
              name: "Dissecção Aórtica",
              justification: "Diagnóstico diferencial obrigatório em dor torácica."
            }
          ],
          conduct: {
            exams: ["ECG", "Troponina", "RX Tórax"],
            procedures: ["Monitorização", "MOV"],
            advice: "Encaminhar para emergência se não estiver em ambiente hospitalar."
          },
          medications: [
            { name: "AAS", dosage: "300mg", mechanism: "Antiagregante" },
            { name: "Isordil", dosage: "5mg SL", mechanism: "Vasodilatador" }
          ]
        };
      } else {
        // Default Generic Response
        mockResponse = {
          diagnoses: [
            {
              name: "Análise baseada em Texto Livre",
              justification: "Hipótese gerada a partir da descrição narrativa do caso."
            }
          ],
          conduct: {
            exams: ["Exames de rotina conforme quadro"],
            procedures: ["Avaliação física detalhada"],
            advice: "Complementar anamnese com exame físico."
          },
          medications: [
            { name: "Sintomáticos", dosage: "SN", mechanism: "Alívio de sintomas" }
          ]
        };
      }

      // Save to History (Simplified structure)
      const newEntry = {
        id: Date.now(),
        date: new Date().toISOString(),
        patient: {
          idade: "N/I",
          sexo: "N/I",
          queixa: anamnese.substring(0, 50) + "..." // Use start of text as complaint
        },
        report: mockResponse
      };

      const existingHistory = JSON.parse(localStorage.getItem('meduf_history') || '[]');
      localStorage.setItem('meduf_history', JSON.stringify([newEntry, ...existingHistory]));

      setReportData(mockResponse);
      setIsLoading(false);
      toast.success("Análise concluída!");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8 md:px-8">
        <Button 
          variant="ghost" 
          className="mb-6 pl-0 hover:pl-2 transition-all" 
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Seleção
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Input */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <Card className="h-full border-none shadow-md bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-primary">
                  <Sparkles className="h-5 w-5" />
                  Diagnóstico Simples
                </CardTitle>
                <CardDescription>
                  Descreva o caso livremente. A IA identificará os padrões.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAnalyze} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="anamnese">Anamnese Completa</Label>
                    <Textarea 
                      id="anamnese" 
                      placeholder="Ex: Paciente homem, 45 anos, chega com dor no peito há 2 horas..." 
                      className="min-h-[300px] resize-none text-base leading-relaxed"
                      value={anamnese}
                      onChange={(e) => setAnamnese(e.target.value)}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span> Analisando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" /> Gerar Análise Clínica
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-7 xl:col-span-8">
            <ClinicalReport data={reportData} />
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
};

export default SimpleDashboard;
