import React, { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Activity, ArrowLeft, Plus, Trash2, AlertTriangle, CheckCircle2, Info, ShieldAlert, HeartPulse, Brain } from 'lucide-react';
import { ResultActions } from '@/components/ResultActions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import api from '@/lib/api';
import { startAITask } from '@/lib/aiPolling';
import { CustomLoader } from '@/components/ui/custom-loader';
import '../styles/animations.css';

const DrugInteraction = () => {
  const navigate = useNavigate();
  const [medications, setMedications] = useState(["", ""]); 
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const reportRef = useRef(null);

  const handleAddfield = () => {
    if (medications.length < 10) {
      setMedications([...medications, ""]);
    } else {
      toast.warning("Máximo de 10 medicamentos atingido.");
    }
  };

  const handleRemoveField = (index) => {
    if (medications.length > 2) {
      const newMeds = [...medications];
      newMeds.splice(index, 1);
      setMedications(newMeds);
    } else {
      toast.warning("Mínimo de 2 medicamentos para análise.");
    }
  };

  const handleChange = (index, value) => {
    const newMeds = [...medications];
    newMeds[index] = value;
    setMedications(newMeds);
  };

  // --- Advanced Interaction Logic Engine ---
  const analyzeInteractions = (meds) => {
    const interactions = [];
    const normalizedMeds = meds.map(m => m.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

    // Helper to check if any drug in the list matches a set of keywords
    const has = (keywords) => normalizedMeds.some(m => keywords.some(k => m.includes(k)));
    const getMatch = (keywords) => normalizedMeds.find(m => keywords.some(k => m.includes(k))) || "Medicamento";

    // Drug Classes Definitions
    const classes = {
      nsaids: ["aspirina", "aas", "ibuprofeno", "diclofenaco", "naproxeno", "cetoprofeno", "celecoxibe", "nimesulida"],
      anticoagulants: ["varfarina", "marevan", "rivaroxabana", "xarelto", "apixabana", "eliquis", "dabigatrana", "enoxaparina", "heparina"],
      antiplatelets: ["clopidogrel", "ticagrelor", "prasugrel"],
      opioids: ["tramadol", "codeina", "morfina", "metadona", "oxicodona", "fentanil"],
      benzos: ["diazepam", "clonazepam", "alprazolam", "midazolam", "lorazepam", "rivotril"],
      ssri: ["fluoxetina", "sertralina", "escitalopram", "citalopram", "paroxetina"], // Antidepressivos
      ace_inhibitors: ["captopril", "enalapril", "ramipril", "lisinopril"], // IECA
      arbs: ["losartana", "valsartana", "candesartana", "olmesartana"], // BRA
      diuretics_k: ["espironolactona", "amilorida"], // Poupadores de K
      diuretics_loop: ["furosemida", "lasix"],
      nitrates: ["isordil", "monocordil", "sustrate", "nitroglicerina", "propatilnitrato"],
      pde5: ["sildenafil", "tadalafila", "vardenafila", "viagra", "cialis"],
      corticosteroids: ["prednisona", "prednisolona", "dexametasona", "hidrocortisona"],
      beta_blockers: ["atenolol", "propranolol", "carvedilol", "bisoprolol", "metoprolol"],
      antibiotics_macro: ["azitromicina", "claritromicina", "eritromicina"],
      antibiotics_quino: ["ciprofloxacino", "levofloxacino"],
      antifungals: ["fluconazol", "cetoconazol", "itraconazol"],
      statins: ["sinvastatina", "atorvastatina", "rosuvastatina"]
    };

    // --- RULE 1: CNS Depression (Sedation) ---
    if ((has(classes.opioids) && has(classes.benzos)) || 
        (has(classes.opioids) && has(["gabapentina", "pregabalina"])) ||
        (has(classes.benzos) && has(["fenobarbital", "zolpidem"]))) {
      interactions.push({
        pair: "Depressores do SNC (Opioide/Benzo/Sedativo)",
        severity: "Grave",
        type: "Sinergismo Farmacológico",
        effect: "Potencialização da sedação, depressão respiratória e risco de coma.",
        toxicity: "Risco elevado de overdose fatal, especialmente em idosos ou renais crônicos.",
        conduct: "Evitar associação. Se necessário, reduzir doses em 50% e monitorar oximetria/nível de consciência."
      });
    }

    // --- RULE 2: Bleeding Risk ---
    if ((has(classes.anticoagulants) && has(classes.nsaids)) || 
        (has(classes.anticoagulants) && has(classes.antiplatelets)) ||
        (has(classes.antiplatelets) && has(classes.nsaids))) {
      interactions.push({
        pair: "Antitrombóticos + AINEs",
        severity: "Alta",
        type: "Farmacodinâmica",
        effect: "Efeito aditivo na inibição da hemostasia. Lesão direta da mucosa gástrica (AINEs).",
        toxicity: "Hemorragia gastrointestinal, hematúria, sangramento intracraniano.",
        conduct: "Suspender AINE. Usar analgésicos simples (Dipirona/Paracetamol). Se uso obrigatório, associar IBP (Omeprazol)."
      });
    }

    // --- RULE 3: Hyperkalemia (Potassium) ---
    if ((has(classes.ace_inhibitors) || has(classes.arbs)) && has(classes.diuretics_k)) {
      interactions.push({
        pair: "Bloqueio RAAS + Espironolactona",
        severity: "Moderada a Grave",
        type: "Metabólica",
        effect: "Retenção cumulativa de potássio.",
        toxicity: "Hipercalemia severa (>6.0), arritmias cardíacas, parada em diástole.",
        conduct: "Monitorar K+ sérico e Creatinina em 1 semana. Ajustar dieta."
      });
    }

    // --- RULE 4: Hypotension / Cardiovascular ---
    if (has(classes.nitrates) && has(classes.pde5)) {
      interactions.push({
        pair: "Nitratos + Inibidor PDE-5",
        severity: "Gravíssima",
        type: "Hemodinâmica",
        effect: "Vasodilatação sistêmica maciça e incontrolável.",
        toxicity: "Choque hipotenso refratário, isquemia miocárdica, óbito.",
        conduct: "CONTRAINDICAÇÃO ABSOLUTA. Intervalo mínimo de 24h (Sildenafil) a 48h (Tadalafila)."
      });
    }

    // --- RULE 5: Serotonin Syndrome ---
    if (has(classes.ssri) && has(classes.opioids)) {
      interactions.push({
        pair: "ISRS + Tramadol/Opioide",
        severity: "Moderada",
        type: "Neurotransmissão",
        effect: "Aumento da serotonina na fenda sináptica.",
        toxicity: "Síndrome Serotoninérgica: tremor, hiperreflexia, agitação, hipertermia.",
        conduct: "Monitorar sinais clínicos. Considerar troca do analgésico."
      });
    }

    // --- RULE 6: Nephrotoxicity (Triple Whammy) ---
    if ((has(classes.ace_inhibitors) || has(classes.arbs)) && has(classes.diuretics_loop) && has(classes.nsaids)) {
      interactions.push({
        pair: "Triple Whammy (IECA/BRA + Diurético + AINE)",
        severity: "Alta",
        type: "Renal",
        effect: "Redução crítica da perfusão glomerular.",
        toxicity: "Insuficiência Renal Aguda (IRA) pré-renal.",
        conduct: "Suspender AINE imediatamente. Hidratação. Monitorar função renal."
      });
    }

    // --- RULE 7: QT Prolongation ---
    if ((has(classes.antibiotics_macro) || has(classes.antibiotics_quino)) && has(["amiodarona", "sotalol", "ondansetrona", "fluoxetina"])) {
      interactions.push({
        pair: "Fármacos que prolongam QT",
        severity: "Moderada",
        type: "Eletrofisiológica",
        effect: "Soma de efeitos no bloqueio de canais de potássio cardíacos.",
        toxicity: "Torsades de Pointes (arritmia ventricular maligna).",
        conduct: "Realizar ECG basal e seriado. Corrigir distúrbios eletrolíticos (K+, Mg++)."
      });
    }

    // --- RULE 8: Myopathy (Statins) ---
    if (has(classes.statins) && (has(classes.antibiotics_macro) || has(classes.antifungals) || has(["gemfibrozila"]))) {
      interactions.push({
        pair: "Estatina + Inibidor CYP3A4",
        severity: "Alta",
        type: "Farmacocinética (Metabolismo)",
        effect: "Aumento da concentração plasmática da estatina.",
        toxicity: "Miopatia grave, Rabdomiólise, Insuficiência Renal.",
        conduct: "Suspender estatina durante o tratamento com antibiótico/antifúngico ou trocar por Rosuvastatina (menor interação)."
      });
    }

    // --- RULE 9: Corticosteroids + NSAIDs ---
    if (has(classes.corticosteroids) && has(classes.nsaids)) {
      interactions.push({
        pair: "Corticoide + AINE",
        severity: "Moderada",
        type: "Gastrointestinal",
        effect: "Sinergismo na agressão à mucosa gástrica.",
        toxicity: "Úlcera péptica, sangramento digestivo alto.",
        conduct: "Associar proteção gástrica (IBP). Preferir analgésicos não-AINE."
      });
    }

    return interactions;
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    
    const activeMeds = medications.filter(m => m.trim() !== "");
    
    if (activeMeds.length < 2) {
      toast.error("Insira pelo menos 2 medicamentos.");
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

      // Call AI Consensus Engine with polling - send ALL medications
      const interactionData = await startAITask(
        '/ai/consensus/drug-interaction',
        {
          medications: activeMeds  // Send all medications as an array
        },
        (task) => {
          if (task.status === 'processing' && task.progress > 0) {
            setProgress(prev => Math.max(prev, task.progress));
          }
        }
      );
      
      // Clear interval and set to 100%
      clearInterval(progressInterval);
      setProgress(100);
      
      // Format for display - include ALL medications
      const mockResponse = {
        medications: activeMeds,  // All medications
        severity: interactionData.severity,
        summary: interactionData.summary,
        details: interactionData.details,
        recommendations: interactionData.recommendations,
        renal_impact: interactionData.renal_impact,
        hepatic_impact: interactionData.hepatic_impact,
        monitoring: interactionData.monitoring
      };

      // Save to consultation history
      try {
        await api.post('/consultations', {
          patient: { 
            queixa: `[Interação] ${activeMeds.join(' + ')}`,  // All medications
            idade: "N/I", 
            sexo: "N/I" 
          },
          report: { 
            diagnoses: [{ name: "Análise de Interação", justification: interactionData.summary }],
            conduct: { 
              advice: interactionData.recommendations
            },
            medications: activeMeds.map(med => ({  // All medications
              name: med, 
              dosage: "Ver impacto", 
              mechanism: "Renal/Hepático analisado"
            }))
          }
        });
        toast.success("Análise completa com perfil renal e hepático!");
      } catch (error) {
        console.error("Error saving:", error);
      }

      setResult(mockResponse);
      
    } catch (error) {
      console.error("Drug interaction error:", error);
      toast.error("Erro ao analisar interação. Tente novamente.");
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-red-400/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
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
            <Card className="h-full glass-card border-2 border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white">
                    <Activity className="h-5 w-5" />
                  </div>
                  <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Interação Medicamentosa</span>
                </CardTitle>
                <CardDescription className="text-base">
                  Adicione até 10 medicamentos para verificar a segurança da associação.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAnalyze} className="space-y-4">
                  <div className="space-y-3">
                    {medications.map((med, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-1">
                          <Label htmlFor={`med-${index}`} className="sr-only">Medicamento {index + 1}</Label>
                          <Input 
                            id={`med-${index}`}
                            placeholder={`Medicamento ${index + 1}`}
                            value={med}
                            onChange={(e) => handleChange(index, e.target.value)}
                          />
                        </div>
                        {medications.length > 2 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveField(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {medications.length < 10 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full border-dashed"
                      onClick={handleAddfield}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Adicionar Medicamento
                    </Button>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl mt-4 text-white text-base font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <CustomLoader size="sm" /> Verificando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" /> Verificar Interações
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
              <Card className="mb-4 glass-card border-2 border-orange-200 shadow-xl animate-pulse-glow">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="flex items-center gap-2 text-orange-700">
                        <CustomLoader size="sm" className="text-orange-600" />
                        Analisando com IA e banco de dados PubMed...
                      </span>
                      <span className="font-bold text-orange-600">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3 bg-orange-100 [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-red-600 shadow-lg" />
                  </div>
                </CardContent>
              </Card>
            )}
            {result ? (
              <div className="space-y-6 animate-scale-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Activity className="h-6 w-6 text-orange-600" /> 
                    <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Resultado da Análise</span>
                  </h2>
                </div>

                <div ref={reportRef} className="space-y-4 p-4 bg-white rounded-lg">
                  {result ? (
                    <div className="space-y-4">
                      {/* Severity Alert */}
                      <Alert variant={result.severity.includes("GRAVE") ? "destructive" : "default"} 
                             className={result.severity.includes("GRAVE") ? "bg-red-50 border-red-200 text-red-900" : "bg-blue-50 border-blue-200 text-blue-900"}>
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>Nível de Interação: {result.severity}</AlertTitle>
                        <AlertDescription>
                          {result.summary}
                        </AlertDescription>
                      </Alert>
                      
                      {/* Interaction Details */}
                      <Card className="border-l-4 border-l-blue-500 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg text-blue-700">
                            {result.medications.join(' + ')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <span className="text-xs font-bold text-muted-foreground uppercase">Detalhes</span>
                              <p className="text-sm text-foreground mt-1">{result.details}</p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                              <span className="text-xs font-bold text-blue-800 uppercase flex items-center gap-1">
                                <Brain className="h-3 w-3" /> Recomendações
                              </span>
                              <p className="text-sm text-blue-900 mt-1 font-medium">{result.recommendations}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* NEW: Renal Impact Section */}
                      <Card className="border-l-4 border-l-amber-500 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg text-amber-700 flex items-center gap-2">
                            Impacto Renal
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm whitespace-pre-line">
                            {result.renal_impact || "Sem informações específicas disponíveis."}
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* NEW: Hepatic Impact Section */}
                      <Card className="border-l-4 border-l-orange-500 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg text-orange-700 flex items-center gap-2">
                            Impacto Hepático
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm whitespace-pre-line">
                            {result.hepatic_impact || "Sem informações específicas disponíveis."}
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* NEW: Monitoring Recommendations */}
                      {result.monitoring && (result.monitoring.renal.length > 0 || result.monitoring.hepatic.length > 0 || result.monitoring.outros.length > 0) && (
                        <Card className="border-l-4 border-l-purple-500 shadow-sm bg-purple-50/30">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-purple-700 flex items-center gap-2">
                              <Activity className="h-5 w-5" />
                              Exames de Monitoramento Recomendados
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid md:grid-cols-3 gap-4">
                              {result.monitoring.renal.length > 0 && (
                                <div className="bg-white p-3 rounded border border-amber-100">
                                  <span className="text-xs font-bold text-amber-800 block mb-2">Função Renal</span>
                                  <ul className="text-xs text-amber-900 space-y-1">
                                    {result.monitoring.renal.map((exam, i) => (
                                      <li key={i}>• {exam}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {result.monitoring.hepatic.length > 0 && (
                                <div className="bg-white p-3 rounded border border-orange-100">
                                  <span className="text-xs font-bold text-orange-800 block mb-2">Função Hepática</span>
                                  <ul className="text-xs text-orange-900 space-y-1">
                                    {result.monitoring.hepatic.map((exam, i) => (
                                      <li key={i}>• {exam}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {result.monitoring.outros.length > 0 && (
                                <div className="bg-white p-3 rounded border border-purple-100">
                                  <span className="text-xs font-bold text-purple-800 block mb-2">Outros</span>
                                  <ul className="text-xs text-purple-900 space-y-1">
                                    {result.monitoring.outros.map((exam, i) => (
                                      <li key={i}>• {exam}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* ResultActions Component */}
                <ResultActions 
                  resultRef={reportRef}
                  resultData={result}
                  analysisType="drug-interaction"
                  fileName={`interacao-medicamentosa-${new Date().toISOString().slice(0,10)}.png`}
                />
              </div>
            ) : (
              <Card className="h-full border-dashed border-2 flex items-center justify-center bg-gradient-to-br from-orange-50/30 to-red-50/30 min-h-[400px] rounded-xl">
                <div className="text-center p-8 text-muted-foreground">
                  <Activity className="h-16 w-16 mx-auto mb-4 opacity-20 animate-float" />
                  <h3 className="text-lg font-medium">Aguardando Medicamentos</h3>
                  <p className="text-sm max-w-xs mx-auto mt-2">
                    Adicione os medicamentos na lista ao lado para verificar possíveis interações e recomendações.
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

export default DrugInteraction;
