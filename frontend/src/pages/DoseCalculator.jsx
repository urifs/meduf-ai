import React, { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/Header';
import FooterLogo from '@/components/FooterLogo';
import { AnalysisProgress } from '@/components/AnalysisProgress';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Calculator, ArrowLeft, Plus, X, Pill } from 'lucide-react';
import { ResultActions } from '@/components/ResultActions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from '@/lib/api';
import { startAITask } from '@/lib/aiPolling';
import '../styles/animations.css';

const DoseCalculator = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const reportRef = useRef(null);

  // Patient data (optional)
  const [patientData, setPatientData] = useState({
    weight: '',
    age: '',
    height: '',
    sex: '',
    specialConditions: ''
  });

  // Medications list (up to 10)
  const [medications, setMedications] = useState([
    { id: 1, name: '', route: '', indication: '' }
  ]);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const addMedication = () => {
    if (medications.length < 10) {
      setMedications([...medications, {
        id: medications.length + 1,
        name: '',
        route: '',
        indication: ''
      }]);
    } else {
      toast.error("Máximo de 10 medicações permitido");
    }
  };

  const removeMedication = (id) => {
    if (medications.length > 1) {
      setMedications(medications.filter(med => med.id !== id));
    } else {
      toast.error("É necessário pelo menos uma medicação");
    }
  };

  const updateMedication = (id, field, value) => {
    setMedications(medications.map(med =>
      med.id === id ? { ...med, [field]: value } : med
    ));
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    
    // Validate at least one medication with name
    const validMedications = medications.filter(med => med.name.trim());
    if (validMedications.length === 0) {
      toast.error("Por favor, informe pelo menos uma medicação");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setProgress(10);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => prev >= 85 ? prev : prev + 5);
      }, 1500);

      const requestData = {
        patient: patientData,
        medications: validMedications
      };

      const aiResponse = await startAITask(
        '/ai/consensus/dose-calculator',
        requestData,
        (task) => {
          if (task.status === 'processing' && task.progress > 0) {
            setProgress(prev => Math.max(prev, task.progress));
          }
        }
      );
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Save to history
      try {
        await api.post('/consultations', {
          patient: { 
            queixa: `[Cálculo de Doses] ${validMedications.map(m => m.name).join(', ')}`,
            idade: patientData.age || "N/I",
            peso: patientData.weight || "N/I",
            altura: patientData.height || "N/I"
          },
          report: aiResponse
        });
        toast.success("Cálculo realizado e salvo no histórico");
      } catch (error) {
        console.error("Error saving:", error);
        toast.success("Cálculo realizado (não salvo no histórico)");
      }

      setResult(aiResponse);
    } catch (error) {
      console.error("Calculation error:", error);
      toast.error("Não foi possível completar o cálculo. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-96 h-96 bg-red-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-rose-400/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
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
            <Card className="glass-card border-2 border-red-200 shadow-xl hover:shadow-2xl transition-all duration-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 text-white">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <span className="bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">Prescrição / Cálculo de Doses</span>
                </CardTitle>
                <CardDescription className="text-base">
                  Calculadora farmacológica com dosagem, diluição e modo de administração
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCalculate} className="space-y-6">
                  {/* Patient Data (Optional) */}
                  <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Opcional</Badge>
                      Detalhes do Paciente
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Input
                          placeholder="Peso (kg)"
                          value={patientData.weight}
                          onChange={(e) => setPatientData({...patientData, weight: e.target.value})}
                          className="border-slate-200"
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Idade"
                          value={patientData.age}
                          onChange={(e) => setPatientData({...patientData, age: e.target.value})}
                          className="border-slate-200"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Input
                          placeholder="Altura (cm)"
                          value={patientData.height}
                          onChange={(e) => setPatientData({...patientData, height: e.target.value})}
                          className="border-slate-200"
                        />
                      </div>
                      <div>
                        <Select value={patientData.sex} onValueChange={(value) => setPatientData({...patientData, sex: value})}>
                          <SelectTrigger className="border-slate-200">
                            <SelectValue placeholder="Sexo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="feminino">Feminino</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Textarea
                      placeholder="Condições especiais (gestação, lactação, insuficiências...)"
                      value={patientData.specialConditions}
                      onChange={(e) => setPatientData({...patientData, specialConditions: e.target.value})}
                      className="min-h-[80px] resize-none border-slate-200"
                    />
                  </div>

                  {/* Medications List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold">Medicações</Label>
                      <Badge variant="secondary" className="text-xs">
                        {medications.length}/10
                      </Badge>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {medications.map((med, index) => (
                        <div key={med.id} className="p-4 bg-white dark:bg-slate-900 rounded-lg border-2 border-red-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-red-600 flex items-center gap-2">
                              <Pill className="h-4 w-4" />
                              Medicação {index + 1}
                            </span>
                            {medications.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMedication(med.id)}
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          
                          <Input
                            placeholder="Nome da medicação *"
                            value={med.name}
                            onChange={(e) => updateMedication(med.id, 'name', e.target.value)}
                            className="border-red-100 focus:border-red-400"
                            required
                          />
                          
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                              <Badge variant="outline" className="text-xs px-1">Opcional</Badge>
                              Via de administração
                            </Label>
                            <Input
                              placeholder="Ex: Oral, EV, IM, SC..."
                              value={med.route}
                              onChange={(e) => updateMedication(med.id, 'route', e.target.value)}
                              className="border-slate-200"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                              <Badge variant="outline" className="text-xs px-1">Opcional</Badge>
                              Indicação / Patologia
                            </Label>
                            <Textarea
                              placeholder="Ex: Hipertensão, dor, infecção..."
                              value={med.indication}
                              onChange={(e) => updateMedication(med.id, 'indication', e.target.value)}
                              className="min-h-[60px] resize-none border-slate-200"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {medications.length < 10 && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-2 border-dashed border-red-300 hover:border-red-400 hover:bg-red-50 text-red-600"
                        onClick={addMedication}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Medicação
                      </Button>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 transition-all duration-300 shadow-lg hover:shadow-xl text-white text-base font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span> Calculando Doses...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" /> Calcular Prescrição
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6 animate-slide-in-right">
            {isLoading && <AnalysisProgress progress={progress} />}
            
            {result && (
              <Card ref={reportRef} className="glass-card border-2 border-red-200 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-b border-red-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white">
                        <Calculator className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                          Prescrição Farmacológica
                        </CardTitle>
                        <CardDescription>Cálculo de doses e orientações</CardDescription>
                      </div>
                    </div>
                    <ResultActions reportRef={reportRef} />
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: result.prescription }} />
                  </div>
                </CardContent>
              </Card>
            )}

            {!isLoading && !result && (
              <Card className="glass-card border-2 border-dashed border-red-200">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 rounded-full bg-red-50 dark:bg-red-950/20 mb-4">
                    <Calculator className="h-12 w-12 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Aguardando cálculo
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Preencha os dados do paciente (opcional) e adicione as medicações para calcular as doses, diluições e orientações farmacológicas.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      
      <FooterLogo />
      <Toaster position="top-right" />
    </div>
  );
};

export default DoseCalculator;
