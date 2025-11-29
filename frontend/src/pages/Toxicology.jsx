import React, { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Skull, Sparkles, ArrowLeft, AlertTriangle, Copy, Download, Activity, HeartPulse, Brain, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import api from '@/lib/api';
import html2canvas from 'html2canvas';

const Toxicology = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [substance, setSubstance] = useState("");
  const reportRef = useRef(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!substance.trim()) {
      toast.error("Por favor, informe a substância ou descreva o quadro.");
      return;
    }

    setIsLoading(true);
    setResult(null);

    // Simulate AI Processing Delay
    setTimeout(async () => {
      let mockResponse;
      const text = substance.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      // --- KNOWLEDGE BASE ---

      // 1. Stimulants (Cocaine, Meth, Amphetamines)
      if (text.includes("cocaina") || text.includes("crack") || text.includes("metanfetamina") || text.includes("anfetamina") || text.includes("ecstasy") || text.includes("mdma")) {
        mockResponse = {
          agent: "Estimulantes (Cocaína/Anfetaminas)",
          antidote: "Benzodiazepínicos (Sintomático)",
          mechanism: "Bloqueio da recaptação de catecolaminas (Dopamina/Noradrenalina). Hiperestimulação simpática.",
          conduct: [
            "Monitorização cardíaca contínua (risco de arritmias/infarto).",
            "Controle da agitação/convulsões com Benzodiazepínicos (Diazepam/Midazolam).",
            "Resfriamento agressivo se hipertermia (>39°C).",
            "NÃO usar Beta-bloqueadores puros (risco de 'efeito alfa sem oposição')."
          ],
          protocol: "Diazepam: 10mg IV a cada 5-10 min até sedação leve. \nNitroglicerina: Se dor torácica isquêmica. \nBicarbonato de Sódio: Se rabdomiólise/acidose."
        };
      }
      // 2. Paracetamol (Acetaminophen)
      else if (text.includes("paracetamol") || text.includes("tylenol") || text.includes("acetaminofeno")) {
        mockResponse = {
          agent: "Paracetamol (Acetaminofeno)",
          antidote: "N-Acetilcisteína (NAC)",
          mechanism: "Hepatotoxicidade por metabólito NAPQI. Depleção de glutationa hepática.",
          conduct: [
            "Dosagem sérica de paracetamol (Nomograma de Rumack-Matthew) se ingestão > 4h.",
            "Lavagem gástrica se ingestão < 1h.",
            "Carvão ativado (1g/kg) se ingestão < 4h.",
            "Iniciar NAC imediatamente se ingestão tóxica provável (>7.5g em adultos ou 150mg/kg em crianças)."
          ],
          protocol: "NAC Oral: Ataque 140mg/kg + 17 doses de 70mg/kg a cada 4h. \nNAC Venosa: Ataque 150mg/kg em 1h + 50mg/kg em 4h + 100mg/kg em 16h."
        };
      }
      // 3. Opioids
      else if (text.includes("opioide") || text.includes("morfina") || text.includes("fentanil") || text.includes("tramadol") || text.includes("codeina") || text.includes("heroina") || text.includes("metadona")) {
        mockResponse = {
          agent: "Opioide",
          antidote: "Naloxona",
          mechanism: "Depressão do SNC e respiratória por agonismo de receptores mi/kappa.",
          conduct: [
            "Garantir via aérea (ABCDE).",
            "Ventilação assistida se bradipneia/apneia.",
            "Administrar antídoto se depressão respiratória significativa (FR < 10)."
          ],
          protocol: "Naloxona: 0.4mg a 2mg IV/IM/SC. Repetir a cada 2-3 min se necessário (até 10mg). \nObservar por 2h após última dose (risco de renarcotização, especialmente com Metadona/Tramadol)."
        };
      }
      // 4. Benzodiazepines
      else if (text.includes("benzo") || text.includes("diazepam") || text.includes("clonazepam") || text.includes("alprazolam") || text.includes("rivotril") || text.includes("midazolam") || text.includes("lexotan")) {
        mockResponse = {
          agent: "Benzodiazepínico",
          antidote: "Flumazenil (Lanexat)",
          mechanism: "Potencialização do GABA. Sedação, ataxia, depressão respiratória leve.",
          conduct: [
            "Suporte ventilatório e monitorização.",
            "Carvão ativado se ingestão < 1h e via aérea protegida.",
            "Uso de antídoto APENAS em casos selecionados (risco de convulsão em usuários crônicos)."
          ],
          protocol: "Flumazenil: 0.2mg IV em 15s. Repetir 0.1mg a cada 60s até 1mg total. \nCONTRAINDICADO se suspeita de ingestão de tricíclicos ou história de epilepsia."
        };
      }
      // 5. Tricyclic Antidepressants
      else if (text.includes("amitriptilina") || text.includes("nortriptilina") || text.includes("clomipramina") || text.includes("triciclico")) {
        mockResponse = {
          agent: "Antidepressivo Tricíclico",
          antidote: "Bicarbonato de Sódio",
          mechanism: "Bloqueio de canais de Sódio cardíacos (efeito quinidina-like). Arritmias graves.",
          conduct: [
            "ECG imediato (QRS > 100ms indica risco de convulsão/arritmia).",
            "Carvão ativado se ingestão < 2h.",
            "Alcalinização sérica se QRS alargado ou hipotensão."
          ],
          protocol: "Bicarbonato de Sódio 8.4%: 1-2 mEq/kg em bolus IV. Repetir até pH 7.45-7.55. \nTratar convulsões com Benzodiazepínicos. Evitar Flumazenil."
        };
      }
      // 6. Dipirona / NSAIDs
      else if (text.includes("dipirona") || text.includes("ibuprofeno") || text.includes("diclofenaco") || text.includes("nimesulida") || text.includes("aine")) {
        mockResponse = {
          agent: "AINEs / Dipirona",
          antidote: "Suporte / Sintomático",
          mechanism: "Inibição da COX (AINEs). Dipirona: mecanismo incerto, risco de hipotensão/choque em altas doses.",
          conduct: [
            "Carvão ativado se ingestão < 1-2h.",
            "Proteção gástrica (IBP) para AINEs.",
            "Hidratação venosa para prevenir insuficiência renal.",
            "Monitorar função renal e coagulograma."
          ],
          protocol: "Não há antídoto específico. \nSe hipotensão por Dipirona: Expansão volêmica + Vasopressores se refratário. \nSe sangramento digestivo: Endoscopia."
        };
      }
      // 7. Organophosphates / Carbamates (Pesticides)
      else if (text.includes("chumbinho") || text.includes("veneno") || text.includes("agrotoxico") || text.includes("organofosforado") || text.includes("carbamato")) {
        mockResponse = {
          agent: "Inibidor da Colinesterase (Organofosforado/Carbamato)",
          antidote: "Atropina + Pralidoxima",
          mechanism: "Síndrome Colinérgica (Muscarínica + Nicotínica). Miose, sialorreia, bradicardia, fasciculações.",
          conduct: [
            "Descontaminação cutânea imediata (remover roupas, lavar com água e sabão).",
            "Oxigenoterapia (risco de broncorreia).",
            "Atropinização precoce."
          ],
          protocol: "Atropina: 1-5mg IV a cada 5-10 min até secar secreções (pulmão limpo). \nPralidoxima: 1-2g IV em 30 min (para organofosforados, idealmente < 48h)."
        };
      }
      // 8. Caustics (Bleach, Soda)
      else if (text.includes("soda") || text.includes("caustica") || text.includes("agua sanitaria") || text.includes("cloro") || text.includes("acido") || text.includes("base")) {
        mockResponse = {
          agent: "Cáusticos (Ácidos/Bases)",
          antidote: "Contraindicado neutralizar",
          mechanism: "Necrose de liquefação (álcalis) ou coagulação (ácidos). Perfuração esofágica/gástrica.",
          conduct: [
            "NÃO provocar vômito (risco de nova queimadura).",
            "NÃO passar sonda nasogástrica às cegas.",
            "NÃO dar carvão ativado (não adsorve e atrapalha endoscopia).",
            "Jejum absoluto."
          ],
          protocol: "Endoscopia Digestiva Alta nas primeiras 12-24h para estadiamento da lesão. \nAnalgesia potente. Avaliação cirúrgica se sinais de perfuração."
        };
      }
      // 9. Carbon Monoxide
      else if (text.includes("monoxido") || text.includes("fumaca") || text.includes("incendio") || text.includes("gas")) {
        mockResponse = {
          agent: "Monóxido de Carbono (CO)",
          antidote: "Oxigênio 100% (Normobárico ou Hiperbárico)",
          mechanism: "Formação de Carboxiemoglobina (HbCO), deslocando O2 e inibindo respiração celular.",
          conduct: [
            "Remover da fonte de exposição.",
            "Máscara não-reinalante com reservatório (15L/min).",
            "Avaliar necessidade de Câmara Hiperbárica (gestantes, síncope, isquemia cardíaca, HbCO > 25%)."
          ],
          protocol: "Manter O2 a 100% até HbCO < 5% (ou assintomático). Meia-vida do CO cai de 320min (ar ambiente) para 80min (O2 100%)."
        };
      }
      // 10. Alcohol (Ethanol)
      else if (text.includes("alcool") || text.includes("etanol") || text.includes("bebida") || text.includes("embriaguez")) {
        mockResponse = {
          agent: "Etanol (Intoxicação Aguda)",
          antidote: "Suporte (Glicose + Tiamina)",
          mechanism: "Depressão do SNC. Risco de hipoglicemia e broncoaspiração.",
          conduct: [
            "Decúbito lateral (prevenir aspiração).",
            "Glicemia capilar (HGT) imediata.",
            "Hidratação venosa."
          ],
          protocol: "Glicose 50% se hipoglicemia. \nTiamina (Vit B1) 100mg IM/IV ANTES da glicose (prevenir Encefalopatia de Wernicke em etilistas crônicos)."
        };
      }
      // 11. Universal Fallback
      else {
        mockResponse = {
          agent: "Agente Desconhecido / Outros",
          antidote: "Suporte Clínico (ABCDE)",
          mechanism: "Mecanismo a esclarecer. Priorizar estabilização.",
          conduct: [
            "A: Vias aéreas (proteger se Glasgow < 8).",
            "B: Ventilação (O2 suplementar).",
            "C: Circulação (Acesso venoso, monitorização, volume).",
            "D: Neurológico (Glicemia, pupilas).",
            "E: Exposição (controle de temperatura)."
          ],
          protocol: "Considerar descontaminação (Carvão Ativado 1g/kg) se ingestão < 1h. \nContatar Centro de Informação Toxicológica (CEATOX: 0800 722 6001)."
        };
      }

      // Save to Backend
      try {
        await api.post('/consultations', {
          patient: { 
            queixa: `[Toxicologia] ${substance}`, 
            idade: "N/I", 
            sexo: "N/I" 
          },
          report: { 
            diagnoses: [{ name: `Intoxicação: ${mockResponse.agent}`, justification: mockResponse.mechanism }],
            conduct: { 
              advice: `Protocolo: ${mockResponse.protocol}`,
              procedures: mockResponse.conduct
            },
            medications: [{ name: mockResponse.antidote, dosage: "Ver protocolo", mechanism: "Antídoto/Suporte" }]
          }
        });
        toast.success("Protocolo gerado com sucesso!");
      } catch (error) {
        console.error("Error saving:", error);
      }

      setResult(mockResponse);
      setIsLoading(false);
    }, 1500);
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
                  <Skull className="h-5 w-5" />
                  Toxicologia
                </CardTitle>
                <CardDescription>
                  Informe a substância ingerida ou o quadro clínico para obter o protocolo de desintoxicação.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAnalyze} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="substance">Substância / Agente Tóxico</Label>
                    <Textarea 
                      id="substance" 
                      placeholder="Ex: Ingestão de cocaína, paracetamol, chumbinho..." 
                      className="min-h-[300px] resize-none text-base leading-relaxed"
                      value={substance}
                      onChange={(e) => setSubstance(e.target.value)}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span> Buscando Protocolo...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Skull className="h-4 w-4" /> Gerar Conduta
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
                    <Activity className="h-6 w-6 text-orange-600" /> Protocolo de Manejo
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
                
                <div ref={reportRef} className="space-y-4 p-6 bg-white rounded-lg border shadow-sm">
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
              <Card className="h-full border-dashed border-2 flex items-center justify-center bg-muted/20 min-h-[400px]">
                <div className="text-center p-8 text-muted-foreground">
                  <Skull className="h-16 w-16 mx-auto mb-4 opacity-20" />
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
