import React, { useState } from 'react';
import { Header } from '@/components/Header';
import FooterLogo from '@/components/FooterLogo';
import { ClinicalReport } from '@/components/ClinicalReport';
import { AnalysisProgress } from '@/components/AnalysisProgress';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { startAITask } from '@/lib/aiPolling';
import '../styles/animations.css';

const SimpleDashboard = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [anamnese, setAnamnese] = useState("");
  const [progress, setProgress] = useState(0);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!anamnese.trim()) {
      toast.error("Por favor, descreva o caso clínico.");
      return;
    }

    setIsLoading(true);
    setReportData(null);
    setProgress(10);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => prev >= 85 ? prev : prev + 5);
      }, 1500);

      const aiReport = await startAITask(
        '/ai/consensus/diagnosis',
        { queixa: anamnese, idade: 'N/I', sexo: 'N/I' },
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
          patient: {
            idade: "N/I",
            sexo: "N/I",
            queixa: anamnese
          },
          report: aiReport
        });
      } catch (error) {
        // Silent fail
      }
      
      setReportData(aiReport);
      
      const historyEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        patient: { queixa: anamnese },
        report: aiReport
      };
      
      const existingHistory = JSON.parse(localStorage.getItem('meduf_history') || '[]');
      existingHistory.unshift(historyEntry);
      localStorage.setItem('meduf_history', JSON.stringify(existingHistory.slice(0, 50)));
      
    } catch (error) {
      toast.error("Não foi possível completar a análise. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
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
          {/* Left Column: Input */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 animate-slide-in-left">
            <Card className="h-full glass-card border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Diagnóstico Simples</span>
                </CardTitle>
                <CardDescription className="text-base">
                  Descreva o caso livremente. A IA identificará os padrões.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAnalyze} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="anamnese" className="text-sm font-bold">Anamnese Completa</Label>
                    <Textarea 
                      id="anamnese" 
                      placeholder="Ex: Paciente 38 anos com febre de 38 graus e dor epigástrica..." 
                      className="min-h-[300px] resize-none text-base leading-relaxed border-2 border-purple-100 focus:border-purple-400 transition-colors"
                      value={anamnese}
                      onChange={(e) => setAnamnese(e.target.value)}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl text-base font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span> Analisando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" /> Gerar Análise Clínica
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-7 xl:col-span-8 animate-slide-in-right">
            {isLoading && progress > 0 && <AnalysisProgress progress={progress} colorScheme="purple" />}
            <ClinicalReport data={reportData} analysisType="simple-diagnosis" />
          </div>
        </div>
        <FooterLogo />
      </main>
      <Toaster />
    </div>
  );
};

export default SimpleDashboard;
