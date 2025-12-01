import React, { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Skull, Sparkles, ArrowLeft, AlertTriangle, Copy, Download, Activity, HeartPulse, Brain, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import api from '@/lib/api';
import html2canvas from 'html2canvas';
import { startAITask } from '@/lib/aiPolling';
import '../styles/animations.css';

const Toxicology = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [substance, setSubstance] = useState("");
  const [progress, setProgress] = useState(0);
  const reportRef = useRef(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!substance.trim()) {
      toast.error("Por favor, informe a substância ou descreva o quadro.");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setProgress(10); // Start with 10% immediately

    try {
      // Simulate smooth progress animation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) return prev; // Cap at 85% until real completion
          return prev + 5; // Increment by 5% every 1.5 seconds
        });
      }, 1500);

      // Call AI Consensus Engine with polling
      const aiResponse = await startAITask(
        '/ai/consensus/toxicology',
        { substance: substance },
        (task) => {
          if (task.status === 'processing' && task.progress > 0) {
            setProgress(prev => Math.max(prev, task.progress));
          }
        }
      );
      
      // Clear interval and set to 100%
      clearInterval(progressInterval);
      setProgress(100);
      
      // Save to consultation history
      try {
        await api.post('/consultations', {
          patient: { 
            queixa: `[Toxicologia] ${substance}`, 
            idade: "N/I", 
            sexo: "N/I" 
          },
          report: { 
            diagnoses: [{ name: `Intoxicação: ${aiResponse.agent}`, justification: aiResponse.mechanism }],
            conduct: { 
              advice: `Protocolo: ${aiResponse.protocol}`,
              procedures: aiResponse.conduct
            },
            medications: [{ name: aiResponse.antidote, dosage: "Ver protocolo", mechanism: "Antídoto/Suporte" }]
          }
        });
        toast.success("✅ Protocolo gerado com sucesso");
      } catch (error) {
        console.error("Error saving:", error);
        toast.success("Protocolo gerado (não salvo no histórico).");
      }

      setResult(aiResponse);
    } catch (error) {
      console.error("AI Engine Error:", error);
      toast.error("Erro ao processar análise. Tente novamente.");
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    
    let text = `## Protocolo de Intoxicação: ${result.agent}\n\n`;
    text += `**Antídoto:** ${result.antidote}\n`;
    text += `**Mecanismo:** ${result.mechanism}\n\n`;
    text += `### Conduta Inicial\n`;
    result.conduct.forEach(step => text += `* ${step}\n`);
    text += `\n### Protocolo Específico\n${result.protocol}`;
    
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const handleSaveImage = async () => {
    if (!reportRef.current) return;
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `toxicologia-${new Date().toISOString().slice(0,10)}.png`;
      link.click();
      
      toast.success("Imagem salva com sucesso!");
    } catch (error) {
      console.error("Error saving image:", error);
      toast.error("Erro ao salvar imagem.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-96 h-96 bg-rose-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-pink-400/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
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
            <Card className="h-full glass-card border-2 border-rose-200 shadow-xl hover:shadow-2xl transition-all duration-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 text-white">
                    <Skull className="h-5 w-5" />
                  </div>
                  <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">Toxicologia</span>
                </CardTitle>
                <CardDescription className="text-base">
                  Informe a substância ingerida ou o quadro clínico para obter o protocolo de desintoxicação.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAnalyze} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="substance" className="text-sm font-bold">Substância / Agente Tóxico</Label>
                    <Textarea 
                      id="substance" 
                      placeholder="Ex: Ingestão de paracetamol, dipirona, produto de limpeza, veneno de rato..." 
                      className="min-h-[300px] resize-none text-base leading-relaxed border-2 border-rose-100 focus:border-rose-400 transition-colors"
                      value={substance}
                      onChange={(e) => setSubstance(e.target.value)}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl text-white text-base font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span> Buscando Protocolo...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Skull className="h-5 w-5" /> Gerar Conduta
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
              <Card className="mb-4 glass-card border-2 border-rose-200 shadow-xl animate-pulse-glow">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="flex items-center gap-2 text-rose-700">
                        <span className="animate-spin">🔬</span>
                        Analisando com IA e banco de dados PubMed...
                      </span>
                      <span className="font-bold text-rose-600">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3 bg-rose-100 [&>div]:bg-gradient-to-r [&>div]:from-rose-500 [&>div]:to-pink-600 shadow-lg" />
                  </div>
                </CardContent>
              </Card>
            )}
            {result ? (
              <div className="space-y-6 animate-scale-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Activity className="h-6 w-6 text-rose-600" /> 
                    <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">Protocolo de Manejo</span>
                  </h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2 hover:bg-rose-50">
                      <Copy className="h-4 w-4" /> Copiar
                    </Button>
                    <Button variant="default" size="sm" onClick={handleSaveImage} className="gap-2 bg-gradient-to-r from-rose-600 to-pink-600">
                      <Download className="h-4 w-4" /> Salvar Imagem
                    </Button>
                  </div>
                </div>
                
                <div ref={reportRef} className="space-y-4 p-6 bg-white rounded-xl shadow-lg border-2 border-rose-100">
                  <div className="flex flex-col md:flex-row justify-between gap-4 border-b pb-4">
                    <div>
                      <span className="text-xs font-bold text-muted-foreground uppercase">Agente Identificado</span>
                      <h3 className="text-2xl font-bold text-orange-700">{result.agent}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-muted-foreground uppercase">Antídoto Específico</span>
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <Badge className="bg-green-600 hover:bg-green-700 text-base px-3 py-1">
                          {result.antidote}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-slate-500" /> Mecanismo de Ação
                      </h4>
                      <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md">
                        {result.mechanism}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-slate-500" /> Conduta Inicial (ABCDE)
                      </h4>
                      <ul className="space-y-2">
                        {result.conduct.map((step, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                        <HeartPulse className="h-4 w-4 text-slate-500" /> Protocolo Específico
                      </h4>
                      <div className="bg-orange-50 border border-orange-100 p-4 rounded-md">
                        <p className="text-sm text-orange-900 font-medium whitespace-pre-line">
                          {result.protocol}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t text-center">
                    <p className="text-xs text-muted-foreground">
                      <strong>CEATOX (Centro de Assistência Toxicológica):</strong> 0800 014 8110 (SP) ou 0800 722 6001 (Nacional)
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <Card className="h-full border-dashed border-2 flex items-center justify-center bg-gradient-to-br from-rose-50/30 to-pink-50/30 min-h-[400px] rounded-xl">
                <div className="text-center p-8 text-muted-foreground">
                  <Skull className="h-16 w-16 mx-auto mb-4 opacity-20 animate-float" />
                  <h3 className="text-lg font-medium">Aguardando Dados</h3>
                  <p className="text-sm max-w-xs mx-auto mt-2">
                    Descreva a exposição tóxica para receber o protocolo de tratamento e antídotos.
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

export default Toxicology;
