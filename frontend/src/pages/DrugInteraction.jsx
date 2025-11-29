import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Activity, ArrowLeft, Plus, Trash2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import api from '@/lib/api';

const DrugInteraction = () => {
  const navigate = useNavigate();
  const [medications, setMedications] = useState(["", ""]); // Start with 2 fields
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleAnalyze = async (e) => {
    e.preventDefault();
    
    // Filter empty fields
    const activeMeds = medications.filter(m => m.trim() !== "");
    
    if (activeMeds.length < 2) {
      toast.error("Insira pelo menos 2 medicamentos para verificar interações.");
      return;
    }

    setIsLoading(true);
    setResult(null);

    // Simulate AI Processing Delay
    setTimeout(async () => {
      const medsLower = activeMeds.map(m => m.toLowerCase());
      let interactions = [];
      
      // Mock Interaction Database (Demo Logic)
      // 1. Warfarin + Aspirin/NSAIDs
      if (medsLower.some(m => m.includes("varfarina") || m.includes("marevan")) && 
          medsLower.some(m => m.includes("aspirina") || m.includes("aas") || m.includes("ibuprofeno") || m.includes("diclofenaco"))) {
        interactions.push({
          pair: "Varfarina + AINEs/AAS",
          severity: "Alta",
          effect: "Aumento significativo do risco de sangramento gastrointestinal.",
          conduct: "Monitorar INR rigorosamente. Considerar proteção gástrica ou substituição do analgésico (ex: Dipirona/Paracetamol)."
        });
      }

      // 2. Sildenafil + Nitrates
      if (medsLower.some(m => m.includes("sildenafil") || m.includes("tadalafila") || m.includes("viagra")) && 
          medsLower.some(m => m.includes("nitrato") || m.includes("isordil") || m.includes("monocordil") || m.includes("sustrate"))) {
        interactions.push({
          pair: "Inibidor da PDE-5 + Nitrato",
          severity: "Grave",
          effect: "Hipotensão arterial severa, refratária e potencialmente fatal.",
          conduct: "CONTRAINDICAÇÃO ABSOLUTA. Não administrar concomitantemente. Aguardar 24-48h entre as doses."
        });
      }

      // 3. Omeprazole + Clopidogrel
      if (medsLower.some(m => m.includes("omeprazol")) && medsLower.some(m => m.includes("clopidogrel"))) {
        interactions.push({
          pair: "Omeprazol + Clopidogrel",
          severity: "Moderada",
          effect: "Redução da eficácia antiagregante do Clopidogrel (inibição do CYP2C19).",
          conduct: "Substituir Omeprazol por Pantoprazol (menor interação) ou espaçar as tomadas em 12h."
        });
      }

      // 4. ACE Inhibitor + Potassium/Spironolactone
      if (medsLower.some(m => m.includes("pril") || m.includes("losartana") || m.includes("valsartana")) && 
          medsLower.some(m => m.includes("espirolactona") || m.includes("potassio"))) {
        interactions.push({
          pair: "IECA/BRA + Espironolactona/K+",
          severity: "Moderada",
          effect: "Risco de Hipercalemia (aumento do potássio sérico).",
          conduct: "Monitorar níveis de potássio e função renal periodicamente."
        });
      }

      // 5. Serotonin Syndrome (SSRI + Tramadol)
      if (medsLower.some(m => m.includes("fluoxetina") || m.includes("sertralina") || m.includes("escitalopram")) && 
          medsLower.some(m => m.includes("tramadol"))) {
        interactions.push({
          pair: "ISRS + Tramadol",
          severity: "Moderada",
          effect: "Risco aumentado de Síndrome Serotoninérgica e convulsões.",
          conduct: "Usar com cautela. Monitorar sinais de agitação, tremor ou hipertermia."
        });
      }

      const mockResponse = {
        medications: activeMeds,
        interactions: interactions,
        summary: interactions.length > 0 
          ? `Foram encontradas ${interactions.length} interações potenciais.` 
          : "Nenhuma interação grave encontrada na base de dados para a combinação informada."
      };

      // Save to Backend
      try {
        await api.post('/consultations', {
          patient: { 
            queixa: `[Interação Medicamentosa] ${activeMeds.join(", ")}`, 
            idade: "N/I", 
            sexo: "N/I" 
          },
          report: { 
            diagnoses: [{ name: "Verificação de Interação", justification: mockResponse.summary }],
            conduct: { 
              advice: interactions.length > 0 ? "Revisar prescrição conforme alertas." : "Manter prescrição e monitorar." 
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
                </div>

                {result.interactions.length > 0 ? (
                  <div className="space-y-4">
                    <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Atenção!</AlertTitle>
                      <AlertDescription>
                        Foram encontradas {result.interactions.length} interações potenciais nesta prescrição.
                      </AlertDescription>
                    </Alert>

                    {result.interactions.map((item, i) => (
                      <Card key={i} className="border-l-4 border-l-red-500 shadow-sm">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg text-red-700">{item.pair}</CardTitle>
                            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                              Gravidade: {item.severity}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <span className="text-xs font-bold text-muted-foreground uppercase">Efeito</span>
                              <p className="text-sm text-foreground">{item.effect}</p>
                            </div>
                            <div className="bg-red-50 p-3 rounded-md border border-red-100">
                              <span className="text-xs font-bold text-red-800 uppercase">Conduta Sugerida</span>
                              <p className="text-sm text-red-900 mt-1">{item.conduct}</p>
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
                      <h3 className="text-lg font-medium text-green-900">Nenhuma interação grave encontrada</h3>
                      <p className="text-green-700 mt-2 max-w-md mx-auto">
                        Com base nos dados disponíveis, a combinação de <b>{result.medications.join(", ")}</b> parece segura.
                      </p>
                      <p className="text-xs text-green-600/80 mt-4">
                        *Sempre avalie as condições clínicas individuais do paciente (função renal, hepática, idade).
                      </p>
                    </CardContent>
                  </Card>
                )}
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
