import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Pill, Sparkles, ArrowLeft, Syringe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import api from '@/lib/api';

const MedicationGuide = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [symptoms, setSymptoms] = useState("");

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      toast.error("Por favor, descreva os sintomas.");
      return;
    }

    setIsLoading(true);
    setResult(null);

    // Simulate AI Processing Delay
    setTimeout(async () => {
      let mockResponse;
      const text = symptoms.toLowerCase();

      // Logic focused purely on therapeutics
      if (text.includes("dor") || text.includes("febre") || text.includes("inflamação")) {
        mockResponse = [
          {
            name: "Dipirona Monoidratada",
            dose: "1g (1 ampola ou 2 comprimidos)",
            frequency: "6/6 horas",
            route: "Endovenosa (IV) ou Oral (VO)",
            notes: "Diluir em 10ml de AD se IV. Contraindicado em alergia a pirazolonas."
          },
          {
            name: "Cetoprofeno (Profenid)",
            dose: "100mg",
            frequency: "12/12 horas",
            route: "Intravenosa (IV) - Infusão lenta",
            notes: "Diluir em 100ml de SF 0,9%. Correr em 20-30 min. Cuidado em renais crônicos."
          }
        ];
      } else if (text.includes("vômito") || text.includes("náusea") || text.includes("enjoo")) {
        mockResponse = [
          {
            name: "Ondansetrona (Zofran)",
            dose: "4mg a 8mg",
            frequency: "8/8 horas",
            route: "Intravenosa (IV) ou Oral (VO)",
            notes: "Injeção lenta (2-5 min). Pode causar cefaleia."
          },
          {
            name: "Metoclopramida (Plasil)",
            dose: "10mg",
            frequency: "8/8 horas",
            route: "Intravenosa (IV) ou Intramuscular (IM)",
            notes: "Risco de efeitos extrapiramidais (distonia). Evitar em idosos."
          }
        ];
      } else if (text.includes("alergia") || text.includes("coceira") || text.includes("vermelhidão")) {
        mockResponse = [
          {
            name: "Dexclorfeniramina (Polaramine)",
            dose: "2mg a 4mg",
            frequency: "6/6 horas",
            route: "Oral (VO)",
            notes: "Pode causar sonolência."
          },
          {
            name: "Hidrocortisona",
            dose: "100mg a 500mg (dependendo da gravidade)",
            frequency: "Dose única ou 8/8h",
            route: "Intravenosa (IV)",
            notes: "Corticosteroide de ação rápida para reações agudas."
          }
        ];
      } else {
        mockResponse = [
          {
            name: "Sintomáticos Gerais",
            dose: "Avaliar caso a caso",
            frequency: "Conforme necessidade",
            route: "Oral ou Parenteral",
            notes: "Sintomas inespecíficos. Reavaliar sinais vitais e história clínica."
          }
        ];
      }

      // Save to Backend (as a consultation type 'medication')
      try {
        await api.post('/consultations', {
          patient: { queixa: `[Guia Terapêutico] ${symptoms}`, idade: "N/I", sexo: "N/I" },
          report: { 
            diagnoses: [{ name: "Consulta Terapêutica", justification: "Solicitação de conduta medicamentosa." }],
            medications: mockResponse.map(m => ({ name: m.name, dosage: `${m.dose} ${m.frequency}`, mechanism: m.notes }))
          }
        });
        toast.success("Sugestão gerada com sucesso!");
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
                <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Pill className="h-6 w-6 text-green-600" /> Sugestão Terapêutica
                </h2>
                
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
