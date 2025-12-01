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
import { Progress } from "@/components/ui/progress";
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { startAITask } from '@/lib/aiPolling';

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
    setProgress(10); // Start with 10% immediately

    try:
      // Call AI Consensus Engine with polling
      const progressToast = toast.loading("🔬 Analisando 10%...");
      
      const aiReport = await startAITask(
        '/ai/consensus/diagnosis',
        { queixa: anamnese, idade: 'N/I', sexo: 'N/I' },
        (task) => {
          if (task.status === 'processing') {
            setProgress(task.progress);
            toast.loading(`🔬 Analisando ${task.progress}%`, { id: progressToast });
          }
        }
      );
      
      toast.success("✅ Análise concluída!", { id: progressToast });

      // Save to consultation history
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
        console.error("Error saving:", error);
      }
      
      setReportData(aiReport);
      
      // Save to localStorage for history
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
      console.error("AI Consensus Error:", error);
      toast.error("Erro ao processar análise. Tente novamente.");
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
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
                      placeholder="Ex: Paciente 38 anos com febre de 38 graus e dor epigástrica..." 
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
            {isLoading && progress > 0 && (
              <Card className="mb-4">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>🔬 Analisando com IA...</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )}
            <ClinicalReport data={reportData} />
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
};

export default SimpleDashboard;
