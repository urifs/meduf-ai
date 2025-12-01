import React, { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Pill, Sparkles, ArrowLeft, Syringe, Download, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import api from '@/lib/api';
import html2canvas from 'html2canvas';
import { startAITask } from '@/lib/aiPolling';

const MedicationGuide = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [symptoms, setSymptoms] = useState("");
  const reportRef = useRef(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      toast.error("Por favor, descreva os sintomas.");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // Call AI Consensus Engine (3 AIs + PubMed) with polling
      const progressToast = toast.loading("🔬 Analisando com 3 IAs + PubMed...");
      
      const aiMedications = await startAITask(
        '/api/ai/consensus/medication-guide',
        { symptoms: symptoms },
        (task) => {
          if (task.status === 'processing') {
            toast.loading(`🔬 Processando... ${task.progress}%`, { id: progressToast });
          }
        }
      );
      
      toast.success("✅ Análise concluída!", { id: progressToast });

      // 1. Pain / Fever / Inflammation
      if (text.includes("dor") || text.includes("febre") || text.includes("inflama") || text.includes("quente") || text.includes("algico") || text.includes("doendo")) {
        mockResponse = [
          {
            name: "Dipirona Monoidratada",
            dose: "1g (1 ampola ou 2 comprimidos)",
            frequency: "6/6 horas",
            route: "Endovenosa (IV) ou Oral (VO)",
            notes: "Analgesia potente. Contraindicado em alergia a pirazolonas ou hipotensão grave."
          },
          {
            name: "Cetoprofeno (Profenid)",
            dose: "100mg",
            frequency: "12/12 horas",
            route: "Intravenosa (IV) - Infusão lenta",
            notes: "Anti-inflamatório. Diluir em 100ml de SF 0,9%. Evitar em idosos/renais."
          },
          {
            name: "Tramadol",
            dose: "50mg a 100mg",
            frequency: "8/8 horas",
            route: "Intravenosa (IV) ou Oral (VO)",
            notes: "Opioide fraco. Usar se dor refratária a dipirona/AINE. Pode causar náusea."
          }
        ];
      } 
      // 2. Nausea / Vomiting / Dizziness
      else if (text.includes("vomito") || text.includes("nausea") || text.includes("enjoo") || text.includes("ansia") || text.includes("tontura") || text.includes("vertigem")) {
        mockResponse = [
          {
            name: "Ondansetrona (Zofran)",
            dose: "4mg a 8mg",
            frequency: "8/8 horas",
            route: "Intravenosa (IV) ou Oral (VO)",
            notes: "Antiemético potente. Injeção lenta (2-5 min). Baixo risco de sedação."
          },
          {
            name: "Metoclopramida (Plasil)",
            dose: "10mg",
            frequency: "8/8 horas",
            route: "Intravenosa (IV) ou Intramuscular (IM)",
            notes: "Pró-cinético. Risco de distonia (efeito extrapiramidal). Evitar em jovens/idosos."
          },
          {
            name: "Dimenidrinato (Dramin B6)",
            dose: "1 ampola ou 1 cp",
            frequency: "6/6 horas",
            route: "Intravenosa (IV) ou Oral (VO)",
            notes: "Bom para tontura/labirintite. Causa sonolência."
          }
        ];
      } 
      // 3. Allergy / Itching
      else if (text.includes("alergia") || text.includes("coceira") || text.includes("vermelh") || text.includes("prurido") || text.includes("picada") || text.includes("incha")) {
        mockResponse = [
          {
            name: "Dexclorfeniramina (Polaramine)",
            dose: "2mg a 4mg",
            frequency: "6/6 horas",
            route: "Oral (VO)",
            notes: "Anti-histamínico clássico. Pode causar sonolência."
          },
          {
            name: "Hidrocortisona",
            dose: "100mg a 500mg",
            frequency: "Dose única (ataque)",
            route: "Intravenosa (IV)",
            notes: "Corticosteroide para reações agudas/anafilaxia. Ação anti-inflamatória potente."
          },
          {
            name: "Prometazina (Fenergan)",
            dose: "25mg (1 ampola)",
            frequency: "Dose única",
            route: "Intramuscular (IM) Profunda",
            notes: "Anti-histamínico potente. Sedativo. Não fazer IV (risco de necrose)."
          }
        ];
      } 
      // 4. Respiratory / Cough
      else if (text.includes("tosse") || text.includes("ar") || text.includes("garganta") || text.includes("peito") || text.includes("respir")) {
        mockResponse = [
          {
            name: "Acebrofilina",
            dose: "10mg/ml (Xarope)",
            frequency: "10ml 12/12h",
            route: "Oral (VO)",
            notes: "Broncodilatador e mucolítico. Alívio da tosse produtiva."
          },
          {
            name: "Dipirona",
            dose: "1g",
            frequency: "6/6h",
            route: "Oral (VO)",
            notes: "Para febre ou dor no corpo associada."
          },
          {
            name: "Prednisolona",
            dose: "20mg a 40mg",
            frequency: "1x ao dia (manhã)",
            route: "Oral (VO)",
            notes: "Corticosteroide. Usar se houver broncoespasmo ou inflamação importante (3-5 dias)."
          }
        ];
      }
      // 5. Gastric / Abdominal Pain
      else if (text.includes("barriga") || text.includes("estomago") || text.includes("abdom") || text.includes("gastrit") || text.includes("queima")) {
        mockResponse = [
          {
            name: "Omeprazol",
            dose: "40mg",
            frequency: "1x ao dia (jejum)",
            route: "Endovenosa (IV) ou Oral (VO)",
            notes: "Proteção gástrica. Inibidor de bomba de prótons."
          },
          {
            name: "Escopolamina (Buscopan)",
            dose: "20mg (1 ampola)",
            frequency: "6/6h ou 8/8h",
            route: "Endovenosa (IV)",
            notes: "Antiespasmódico. Alívio de cólicas."
          },
          {
            name: "Simeticona (Luftal)",
            dose: "40mg a 125mg",
            frequency: "6/6h",
            route: "Oral (VO)",
            notes: "Antigases. Alívio de distensão abdominal."
          }
        ];
      }
      // 6. Universal Fallback (Symptomatic Kit)
      else {
        mockResponse = [
          {
            name: "Dipirona",
            dose: "1g",
            frequency: "6/6h",
            route: "Oral ou IV",
            notes: "Analgesia geral e controle térmico."
          },
          {
            name: "Ondansetrona",
            dose: "4mg",
            frequency: "8/8h",
            route: "Oral ou IV",
            notes: "Se houver náusea/vômito associado."
          },
          {
            name: "Hidratação (Soro Fisiológico 0,9%)",
            dose: "500ml a 1000ml",
            frequency: "Correr em 1-2 horas",
            route: "Endovenosa (IV)",
            notes: "Expansão volêmica e hidratação basal."
          }
        ];
      }

      // Save to consultation history
      try {
        await api.post('/consultations', {
          patient: { queixa: `[Guia Terapêutico] ${symptoms}`, idade: "N/I", sexo: "N/I" },
          report: { 
            diagnoses: [{ name: "Consulta Terapêutica com IA", justification: "Consenso de 3 IAs + PubMed" }],
            medications: aiMedications.medications?.map(m => ({ 
              name: m.name, 
              dosage: `${m.dose} ${m.frequency}`, 
              mechanism: m.notes 
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
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    
    let text = `## Guia Terapêutico\n\n`;
    result.forEach(med => {
      text += `* **${med.name}**\n`;
      text += `  - Dose: ${med.dose}\n`;
      text += `  - Frequência: ${med.frequency}\n`;
      text += `  - Via: ${med.route}\n`;
      text += `  - Obs: ${med.notes}\n\n`;
    });
    
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const handleSaveImage = async () => {
    if (!reportRef.current) return;
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Higher quality
        backgroundColor: "#ffffff",
        useCORS: true
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `guia-terapeutico-${new Date().toISOString().slice(0,10)}.png`;
      link.click();
      
      toast.success("Imagem salva com sucesso!");
    } catch (error) {
      console.error("Error saving image:", error);
      toast.error("Erro ao salvar imagem.");
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
          {/* Input Section */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <Card className="h-full border-none shadow-md bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-primary">
                  <Syringe className="h-5 w-5" />
                  Guia Terapêutico
                </CardTitle>
                <CardDescription>
                  Descreva os sintomas para receber sugestões de prescrição detalhadas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAnalyze} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="symptoms">Sintomas / Quadro Clínico</Label>
                    <Textarea 
                      id="symptoms" 
                      placeholder="Ex: Dor lombar aguda intensa, náuseas..." 
                      className="min-h-[300px] resize-none text-base leading-relaxed"
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span> Buscando Protocolos...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Pill className="h-4 w-4" /> Gerar Prescrição
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-7 xl:col-span-8">
            {result ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Pill className="h-6 w-6 text-green-600" /> Sugestão Terapêutica
                  </h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2">
                      <Copy className="h-4 w-4" /> Copiar
                    </Button>
                    <Button variant="default" size="sm" onClick={handleSaveImage} className="gap-2">
                      <Download className="h-4 w-4" /> Salvar Imagem
                    </Button>
                  </div>
                </div>
                
                <div ref={reportRef} className="space-y-4 p-4 bg-white rounded-lg">
                  <div className="grid gap-4">
                    {result.map((med, index) => (
                      <Card key={index} className="border-l-4 border-l-green-500 shadow-sm overflow-hidden">
                        <CardContent className="pt-6">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                            <div>
                              <h3 className="text-lg font-bold text-green-800 dark:text-green-400">{med.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{med.notes}</p>
                            </div>
                            <Badge variant="outline" className="w-fit h-fit text-base px-3 py-1 border-green-200 bg-green-50 text-green-700">
                              {med.route}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
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
              <Card className="h-full border-dashed border-2 flex items-center justify-center bg-muted/20 min-h-[400px]">
                <div className="text-center p-8 text-muted-foreground">
                  <Syringe className="h-16 w-16 mx-auto mb-4 opacity-20" />
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
