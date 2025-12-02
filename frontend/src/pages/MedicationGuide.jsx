import React, { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Pill, ArrowLeft, Syringe } from 'lucide-react';
import { ResultActions } from '@/components/ResultActions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import api from '@/lib/api';
import { startAITask } from '@/lib/aiPolling';
import { CustomLoader } from '@/components/ui/custom-loader';
import '../styles/animations.css';

const MedicationGuide = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [symptoms, setSymptoms] = useState("");
  const [progress, setProgress] = useState(0);
  const reportRef = useRef(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      toast.error("Por favor, descreva os sintomas.");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setProgress(10);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) return prev;
          return prev + 5;
        });
      }, 1500);

      const aiMedications = await startAITask(
        '/ai/consensus/medication-guide',
        { symptoms: symptoms },
        (task) => {
          if (task.status === 'processing' && task.progress > 0) {
            setProgress(prev => Math.max(prev, task.progress));
          }
        }
      );
      
      clearInterval(progressInterval);
      setProgress(100);

      try {
        await api.post('/consultations', {
          patient: { queixa: `[Guia Terapêutico] ${symptoms}`, idade: "N/I", sexo: "N/I" },
          report: { 
            diagnoses: [{ name: "Consulta Terapêutica com IA", justification: "Consenso de 3 IAs" }],
            medications: aiMedications.medications?.map(m => ({ 
              name: m.name, 
              dosage: `${m.dose || m.dosage} ${m.frequency || ''}`, 
              mechanism: m.notes || m.contraindications
            })) || []
          }
        });
        toast.success("✅ Guia completo! Análise concluída");
      } catch (error) {
        console.error("Error saving:", error);
        toast.success("Guia gerado (não salvo no histórico).");
      }

      setResult(aiMedications.medications || []);
      
    } catch (error) {
      console.error("AI Consensus Error:", error);
      toast.error("Erro ao processar guia. Tente novamente.");
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      </div>

      <Header />
      <main className="container mx-auto px-4 py-8 md:px-8 relative z-10">
        <Button 
          variant="ghost" 
          className="mb-6 pl-0 hover:pl-2 transition-all group animate-fade-in-up" 
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Voltar para Seleção
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 animate-slide-in-left">
            <Card className="h-full glass-card border-2 border-emerald-200 shadow-xl hover:shadow-2xl transition-all duration-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <Syringe className="h-5 w-5" />
                  </div>
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Guia Terapêutico</span>
                </CardTitle>
                <CardDescription className="text-base">
                  Descreva os sintomas para receber sugestões de prescrição detalhadas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAnalyze} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="symptoms" className="text-sm font-bold">Sintomas / Quadro Clínico</Label>
                    <Textarea 
                      id="symptoms" 
                      placeholder="Ex: Dor lombar aguda intensa, náuseas..." 
                      className="min-h-[300px] resize-none text-base leading-relaxed border-2 border-emerald-100 focus:border-emerald-400 transition-colors"
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl text-white text-base font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <CustomLoader size="sm" /> Buscando Protocolos...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Pill className="h-5 w-5" /> Gerar Prescrição
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-7 xl:col-span-8 animate-slide-in-right">
            {isLoading && progress > 0 && (
              <Card className="mb-4 glass-card border-2 border-emerald-200 shadow-xl animate-pulse-glow">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="flex items-center gap-2 text-emerald-700">
                        <CustomLoader size="sm" className="text-emerald-600" />
                        Analisando com IA e banco de dados PubMed...
                      </span>
                      <span className="font-bold text-emerald-600">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3 bg-emerald-100 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-teal-600 shadow-lg" />
                  </div>
                </CardContent>
              </Card>
            )}
            {result ? (
              <div className="space-y-6 animate-scale-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Pill className="h-6 w-6 text-emerald-600" /> 
                    <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Sugestão Terapêutica</span>
                  </h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2 hover:bg-emerald-50">
                      <Copy className="h-4 w-4" /> Copiar
                    </Button>
                    <Button variant="default" size="sm" onClick={handleSaveImage} className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600">
                      <Download className="h-4 w-4" /> Salvar Imagem
                    </Button>
                  </div>
                </div>
                
                <div ref={reportRef} className="space-y-4 p-6 bg-white rounded-xl shadow-lg">
                  <div className="grid gap-4">
                    {result.map((med, index) => (
                      <Card key={index} className="border-l-4 border-l-emerald-500 shadow-md hover:shadow-xl transition-all duration-300 interactive-card">
                        <CardContent className="pt-6">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                            <div>
                              <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-400">{med.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{med.notes}</p>
                            </div>
                            <Badge variant="outline" className="w-fit h-fit text-base px-3 py-1 border-emerald-200 bg-emerald-50 text-emerald-700">
                              {med.route}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 bg-emerald-50/50 p-4 rounded-lg">
                            <div>
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dose</span>
                              <p className="font-medium text-foreground">{med.dose}</p>
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Frequência</span>
                              <p className="font-medium text-foreground">{med.frequency}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 dark:bg-yellow-950/20 dark:border-yellow-900 dark:text-yellow-400">
                    <strong>Atenção:</strong> Estas são sugestões baseadas em protocolos padrão. Verifique sempre alergias, contraindicações e interações medicamentosas antes de prescrever.
                  </div>
                </div>
              </div>
            ) : (
              <Card className="h-full border-dashed border-2 flex items-center justify-center bg-gradient-to-br from-emerald-50/30 to-teal-50/30 min-h-[400px] rounded-xl">
                <div className="text-center p-8 text-muted-foreground">
                  <Syringe className="h-16 w-16 mx-auto mb-4 opacity-20 animate-float" />
                  <h3 className="text-lg font-medium">Aguardando Dados</h3>
                  <p className="text-sm max-w-xs mx-auto mt-2">
                    Preencha os sintomas ao lado para receber sugestões de medicamentos, doses e vias de administração.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
};

export default MedicationGuide;