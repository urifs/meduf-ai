import React, { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import FooterLogo from '@/components/FooterLogo';
import { AnalysisProgress } from '@/components/AnalysisProgress';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Activity, ArrowLeft, Plus, Trash2, AlertTriangle, CheckCircle2, Info, ShieldAlert, HeartPulse, Brain } from 'lucide-react';
import { ResultActions } from '@/components/ResultActions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import api from '@/lib/api';
import { startAITask } from '@/lib/aiPolling';
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
        pair: "Anticoagulante/Antiplaquetário + AINE",
        severity: "Alta",
        type: "Farmacodinâmica",
        effect: "Somação de efeitos antitrombóticos com inibição plaquetária.",
        toxicity: "Risco de hemorragia gastrointestinal, cerebral ou em outros órgãos.",
        conduct: "Evitar AINEs. Preferir paracetamol para analgesia. Monitorar sinais de sangramento."
      });
    }

    // --- RULE 3: Hypotension (PDE5 + Nitrates) ---
    if (has(classes.pde5) && has(classes.nitrates)) {
      interactions.push({
        pair: "Sildenafil/Tadalafila + Nitrato",
        severity: "Contraindicação Absoluta",
        type: "Farmacodinâmica",
        effect: "Vasodilatação severa por sinergismo.",
        toxicity: "Hipotensão grave, choque circulatório, infarto do miocárdio.",
        conduct: "NUNCA associar. Aguardar 24-48h após nitrato para usar PDE5."
      });
    }

    // --- RULE 4: Hyperkalemia (IECA/BRA + Poupadores de K) ---
    if ((has(classes.ace_inhibitors) || has(classes.arbs)) && has(classes.diuretics_k)) {
      interactions.push({
        pair: "IECA/BRA + Espironolactona",
        severity: "Alta",
        type: "Farmacodinâmica",
        effect: "Ambos elevam os níveis de potássio sérico.",
        toxicity: "Hipercalemia grave: arritmias cardíacas, parada cardíaca.",
        conduct: "Monitorar K+ semanal. Se K+ > 5.5, reduzir dose ou suspender."
      });
    }

    // --- RULE 5: Serotonin Syndrome (SSRI + Tramadol) ---
    if (has(classes.ssri) && has(classes.opioids)) {
      interactions.push({
        pair: "Antidepressivo (SSRI) + Tramadol",
        severity: "Moderada a Alta",
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
    setProgress(10);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => prev >= 85 ? prev : prev + 5);
      }, 1500);

      const interactionData = await startAITask(
        '/ai/consensus/drug-interaction',
        { medications: activeMeds },
        (task) => {
          if (task.status === 'processing' && task.progress > 0) {
            setProgress(prev => Math.max(prev, task.progress));
          }
        }
      );
      
      clearInterval(progressInterval);
      setProgress(100);
      
      const mockResponse = {
        medications: activeMeds,
        severity: interactionData.severity,
        summary: interactionData.summary,
        details: interactionData.details,
        recommendations: interactionData.recommendations,
        renal_impact: interactionData.renal_impact,
        hepatic_impact: interactionData.hepatic_impact,
        monitoring: interactionData.monitoring
      };

      try {
        await api.post('/consultations', {
          patient: { 
            queixa: `[Interação] ${activeMeds.join(' + ')}`,
            idade: "N/I", 
            sexo: "N/I" 
          },
          report: { 
            diagnoses: [{ name: "Análise de Interação", justification: interactionData.summary }],
            conduct: { 
              advice: interactionData.recommendations
            },
            medications: activeMeds.map(med => ({
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
      toast.error("Não foi possível completar a análise. Por favor, tente novamente.");
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
                        <span className="animate-spin">⏳</span> Verificando...
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
            {isLoading && progress > 0 && <AnalysisProgress progress={progress} colorScheme="orange" />}
            {result ? (
              <div className="space-y-6 animate-scale-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Activity className="h-6 w-6 text-orange-600" /> 
                    <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Resultado da Análise</span>
                  </h2>
                </div>

                <div ref={reportRef} className="space-y-6">
                  {/* Severity Badge */}
                  <Card className="border-2 border-orange-200 shadow-xl">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <ShieldAlert className="h-6 w-6 text-orange-600" />
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Nível de Interação:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              className={`text-base px-3 py-1 ${
                                result.severity === 'Grave' ? 'bg-red-600 hover:bg-red-700' :
                                result.severity === 'Moderada' ? 'bg-orange-500 hover:bg-orange-600' :
                                'bg-yellow-500 hover:bg-yellow-600'
                              }`}
                            >
                              {result.severity}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Summary */}
                  {result.summary && (
                    <Card className="border-2 border-blue-100">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Info className="h-5 w-5 text-blue-600" />
                          Resumo da Interação
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{result.summary}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Medications List with Recommendations */}
                  <Card className="border-2 border-orange-100">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Info className="h-5 w-5 text-blue-600" />
                        {result.medications.join(' + ')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {result.recommendations && (
                          <div>
                            <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                              📋 RECOMENDAÇÕES
                            </h4>
                            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                              <p className="text-sm text-foreground whitespace-pre-line">{result.recommendations}</p>
                            </div>
                          </div>
                        )}
                        {result.details && (
                          <div>
                            <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                              📄 DETALHES DA INTERAÇÃO
                            </h4>
                            <div className="bg-slate-50 dark:bg-slate-950/20 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                              <p className="text-sm text-muted-foreground whitespace-pre-line">{result.details}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Renal Impact */}
                  <Card className="border-l-4 border-l-yellow-500">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <HeartPulse className="h-5 w-5 text-yellow-600" />
                        Impacto Renal
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{result.renal_impact}</p>
                    </CardContent>
                  </Card>

                  {/* Hepatic Impact */}
                  <Card className="border-l-4 border-l-emerald-500">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Brain className="h-5 w-5 text-emerald-600" />
                        Impacto Hepático
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{result.hepatic_impact}</p>
                    </CardContent>
                  </Card>

                  {/* Monitoring */}
                  {result.monitoring && (
                    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-900 dark:text-amber-300">Monitoramento Necessário</AlertTitle>
                      <AlertDescription className="text-sm text-amber-800 dark:text-amber-400 whitespace-pre-line">
                        {typeof result.monitoring === 'string' 
                          ? result.monitoring 
                          : typeof result.monitoring === 'object' && result.monitoring !== null
                            ? Object.entries(result.monitoring).map(([key, value]) => {
                                const label = key === 'renal' ? 'Renal' : key === 'hepatic' ? 'Hepático' : 'Outros';
                                const items = Array.isArray(value) ? value.join(', ') : value;
                                return `${label}: ${items}`;
                              }).join('\n\n')
                            : 'Monitoramento clínico regular recomendado'
                        }
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

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
        <FooterLogo />
      </main>
      <Toaster />
    </div>
  );
};

export default DrugInteraction;
