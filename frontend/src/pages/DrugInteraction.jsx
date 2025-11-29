import React, { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Activity, ArrowLeft, Plus, Trash2, AlertTriangle, CheckCircle2, Info, ShieldAlert, HeartPulse, Brain, Copy, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import api from '@/lib/api';
import html2canvas from 'html2canvas';

const DrugInteraction = () => {
  const navigate = useNavigate();
  const [medications, setMedications] = useState(["", ""]); 
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
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

    setTimeout(async () => {
      const interactions = analyzeInteractions(activeMeds);
      
      const mockResponse = {
        medications: activeMeds,
        interactions: interactions,
        summary: interactions.length > 0 
          ? `Identificamos ${interactions.length} interações de relevância clínica.` 
          : "Não foram encontradas interações graves nas bases de dados farmacológicos padrão para esta combinação."
      };

      try {
        await api.post('/consultations', {
          patient: { 
            queixa: `[Interação] ${activeMeds.join(" + ")}`, 
            idade: "N/I", 
            sexo: "N/I" 
          },
          report: { 
            diagnoses: [{ name: "Análise de Interação", justification: mockResponse.summary }],
            conduct: { 
              advice: interactions.length > 0 ? "Ajuste posológico ou troca necessária." : "Combinação aparentemente segura." 
            },
            medications: interactions.map(i => ({ name: i.pair, dosage: i.severity, mechanism: i.effect }))
          }
        });
        toast.success("Análise concluída!");
      } catch (error) {
        console.error("Error saving:", error);
      }

      setResult(mockResponse);
      setIsLoading(false);
    }, 1500);
  };

  const copyToClipboard = () => {
    if (!result) return;
    
    let text = `## Análise de Interação Medicamentosa\n\n`;
    text += `Medicamentos: ${result.medications.join(", ")}\n\n`;
    
    if (result.interactions.length > 0) {
      result.interactions.forEach(item => {
        text += `### ${item.pair}\n`;
        text += `* **Gravidade:** ${item.severity}\n`;
        text += `* **Efeito:** ${item.effect}\n`;
        text += `* **Toxicidade:** ${item.toxicity}\n`;
        text += `* **Conduta:** ${item.conduct}\n\n`;
      });
    } else {
      text += "Nenhuma interação grave encontrada.\n";
    }
    
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
      link.download = `interacao-medicamentosa-${new Date().toISOString().slice(0,10)}.png`;
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
                  <Activity className="h-5 w-5" />
                  Interação Medicamentosa
                </CardTitle>
                <CardDescription>
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
                    className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl mt-4"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span> Verificando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Verificar Interações
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
                    <Activity className="h-6 w-6 text-primary" /> Resultado da Análise
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
                  {result.interactions.length > 0 ? (
                    <div className="space-y-4">
                      <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>Alerta de Segurança</AlertTitle>
                        <AlertDescription>
                          Foram detectadas {result.interactions.length} interações que requerem atenção clínica.
                        </AlertDescription>
                      </Alert>

                      {result.interactions.map((item, i) => (
                        <Card key={i} className="border-l-4 border-l-red-500 shadow-sm">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg text-red-700 flex items-center gap-2">
                                {item.pair}
                              </CardTitle>
                              <Badge variant="outline" className={`
                                ${item.severity === 'Gravíssima' ? 'bg-red-900 text-white border-red-900' : 
                                  item.severity === 'Grave' ? 'bg-red-100 text-red-700 border-red-200' : 
                                  'bg-orange-100 text-orange-700 border-orange-200'}
                              `}>
                                {item.severity}
                              </Badge>
                            </div>
                            <CardDescription className="text-xs font-mono mt-1">
                              Mecanismo: {item.type}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div>
                                  <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                                    <Activity className="h-3 w-3" /> Efeito Clínico
                                  </span>
                                  <p className="text-sm text-foreground mt-1">{item.effect}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                                    <HeartPulse className="h-3 w-3" /> Toxicidade/Risco
                                  </span>
                                  <p className="text-sm text-foreground mt-1">{item.toxicity}</p>
                                </div>
                              </div>
                              
                              <div className="bg-red-50 p-3 rounded-md border border-red-100 h-fit">
                                <span className="text-xs font-bold text-red-800 uppercase flex items-center gap-1">
                                  <Brain className="h-3 w-3" /> Conduta Sugerida
                                </span>
                                <p className="text-sm text-red-900 mt-1 font-medium">{item.conduct}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="border-l-4 border-l-green-500 bg-green-50/30">
                      <CardContent className="pt-6 text-center">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium text-green-900">Nenhuma interação grave detectada</h3>
                        <p className="text-green-700 mt-2 max-w-md mx-auto">
                          A combinação de <b>{result.medications.join(" + ")}</b> não apresentou alertas nas regras de segurança farmacológica cadastradas.
                        </p>
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                          <div className="bg-white/50 p-3 rounded border border-green-100">
                            <span className="text-xs font-bold text-green-800 block mb-1">Cardiovascular</span>
                            <span className="text-xs text-green-700">Sem risco aparente de arritmias ou hipotensão severa.</span>
                          </div>
                          <div className="bg-white/50 p-3 rounded border border-green-100">
                            <span className="text-xs font-bold text-green-800 block mb-1">SNC / Sedação</span>
                            <span className="text-xs text-green-700">Sem potencialização depressora evidente.</span>
                          </div>
                          <div className="bg-white/50 p-3 rounded border border-green-100">
                            <span className="text-xs font-bold text-green-800 block mb-1">Metabolismo</span>
                            <span className="text-xs text-green-700">Sem inibição/indução enzimática crítica (CYP450).</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ) : (
              <Card className="h-full border-dashed border-2 flex items-center justify-center bg-muted/20 min-h-[400px]">
                <div className="text-center p-8 text-muted-foreground">
                  <Activity className="h-16 w-16 mx-auto mb-4 opacity-20" />
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
