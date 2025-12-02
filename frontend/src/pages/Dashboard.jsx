import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { PatientForm } from '@/components/PatientForm';
import { ClinicalReport } from '@/components/ClinicalReport';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Activity, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { startAITask } from '@/lib/aiPolling';
import { CustomLoader } from '@/components/ui/custom-loader';
import '../styles/animations.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleAnalyze = async (formData) => {
    setIsLoading(true);
    setReportData(null);
    setProgress(10);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) return prev;
          return prev + 5;
        });
      }, 1500);

      const aiReport = await startAITask(
        '/ai/consensus/diagnosis',
        formData,
        (task) => {
          console.log(`📊 Task status: ${task.status}, progress: ${task.progress}%`);
          if (task.status === 'processing' && task.progress > 0) {
            setProgress(prev => Math.max(prev, task.progress));
          }
        }
      );
      
      clearInterval(progressInterval);
      setProgress(100);
      
      console.log("✅ AI task completed successfully!");
      console.log("Result structure:", {
        hasDiagnoses: !!aiReport?.diagnoses,
        count: aiReport?.diagnoses?.length
      });
      
      if (!aiReport || !aiReport.diagnoses) {
        console.error("❌ Invalid response");
        throw new Error("Resposta inválida. Tente novamente.");
      }
      
      try {
        await api.post('/consultations', {
          patient: formData,
          report: aiReport
        });
      } catch (error) {
        console.error("Error saving:", error);
      }
      
      setReportData(aiReport);
      
      const historyEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        patient: formData,
        report: aiReport
      };
      
      const existingHistory = JSON.parse(localStorage.getItem('meduf_history') || '[]');
      existingHistory.unshift(historyEntry);
      localStorage.setItem('meduf_history', JSON.stringify(existingHistory.slice(0, 50)));
      
    } catch (error) {
      console.error("AI Consensus Error:", error);
      console.error("Error details:", error.message, error.response);
      
      const errorMsg = error.message || "Erro ao processar análise. Por favor, tente novamente.";
      toast.error(errorMsg);
      
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
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
            <PatientForm onSubmit={handleAnalyze} isLoading={isLoading} />
            
            {/* Quick Tips Card */}
            <div className="glass-card p-5 rounded-xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 animate-pulse-slow" /> Dica Clínica
              </h4>
              <p className="text-xs text-blue-700/90 dark:text-blue-400 leading-relaxed">
                Sempre descreva o histórico de forma detalhada. A IA utiliza comorbidades prévias para refinar a probabilidade pré-teste das hipóteses diagnósticas.
              </p>
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-7 xl:col-span-8 animate-slide-in-right">
            {isLoading && progress > 0 && (
              <Card className="mb-4 glass-card border-2 border-blue-200 shadow-xl animate-pulse-glow">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="flex items-center gap-2 text-blue-700">
                        <span className="animate-spin">🔬</span>
                        Analisando com IA e banco de dados PubMed...
                      </span>
                      <span className="font-bold text-blue-600">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3 bg-blue-100 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-purple-600 shadow-lg" />
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

export default Dashboard;