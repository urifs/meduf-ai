import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { PatientForm } from '@/components/PatientForm';
import { ClinicalReport } from '@/components/ClinicalReport';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const Dashboard = () => {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async (formData) => {
    setIsLoading(true);
    setReportData(null);

    // Simulate AI Processing Delay
    setTimeout(() => {
      // Mock Logic based on input (Simple keyword matching for demo purposes)
      // In a real app, this would send data to the backend
      
      let mockResponse;
      const complaint = formData.queixa.toLowerCase();

      if (complaint.includes("dor no peito") || complaint.includes("tórax") || complaint.includes("precordial")) {
        mockResponse = {
          diagnoses: [
            {
              name: "Síndrome Coronariana Aguda (SCA)",
              justification: "Dor torácica típica, idade > 40 anos, fatores de risco cardiovasculares presentes no histórico."
            },
            {
              name: "Dissecção Aórtica",
              justification: "Diagnóstico diferencial importante em dor torácica aguda, especialmente se houver hipertensão não controlada."
            },
            {
              name: "Refluxo Gastroesofágico",
              justification: "Considerar se houver associação com alimentação ou decúbito, mas SCA deve ser descartada primeiro."
            }
          ],
          conduct: {
            exams: ["Eletrocardiograma (ECG) 12 derivações", "Troponina I/T seriada", "Raio-X de Tórax", "Hemograma Completo", "Creatinina e Eletrólitos"],
            procedures: ["Monitorização cardíaca contínua", "Acesso venoso periférico", "Oxigenoterapia se SatO2 < 90%"],
            advice: "Manter paciente em repouso absoluto. Jejum até definição diagnóstica. Monitorar sinais vitais a cada 15 minutos."
          },
          medications: [
            {
              name: "Ácido Acetilsalicílico (AAS)",
              dosage: "300mg VO (ataque)",
              mechanism: "Antiagregante plaquetário. Inibição irreversível da COX-1."
            },
            {
              name: "Nitrato (Isordil)",
              dosage: "5mg Sublingual (se PAS > 100mmHg)",
              mechanism: "Vasodilatador coronariano. Alívio sintomático da angina."
            },
            {
              name: "Morfina",
              dosage: "2-4mg IV (se dor refratária)",
              mechanism: "Analgesia potente e venodilatação leve. Usar com cautela."
            }
          ]
        };
      } else if (complaint.includes("cabeça") || complaint.includes("cefaleia")) {
        mockResponse = {
          diagnoses: [
            {
              name: "Enxaqueca (Migrânea)",
              justification: "Cefaleia pulsátil, unilateral, associada a fotofobia/fonofobia."
            },
            {
              name: "Cefaleia Tensional",
              justification: "Dor em pressão/aperto, bilateral, leve a moderada intensidade."
            }
          ],
          conduct: {
            exams: ["Tomografia de Crânio (se sinais de alarme)", "Exame neurológico completo"],
            procedures: ["Repouso em ambiente escuro e silencioso"],
            advice: "Evitar gatilhos alimentares. Manter diário de cefaleia."
          },
          medications: [
            {
              name: "Dipirona",
              dosage: "1g IV ou VO",
              mechanism: "Analgesico não-opioide e antipirético."
            },
            {
              name: "Sumatriptano",
              dosage: "50mg VO",
              mechanism: "Agonista seletivo de receptores 5-HT1B/1D. Abortivo de crise enxaquecosa."
            }
          ]
        };
      } else {
        // Default Generic Response
        mockResponse = {
          diagnoses: [
            {
              name: "Investigação Clínica Inespecífica",
              justification: "Sintomas apresentados requerem maior detalhamento ou exames complementares para hipótese precisa."
            }
          ],
          conduct: {
            exams: ["Hemograma Completo", "PCR", "Ureia e Creatinina", "EAS (Urina Tipo 1)"],
            procedures: ["Avaliação de sinais vitais", "Hidratação se necessário"],
            advice: "Observação clínica e reavaliação após resultados de exames."
          },
          medications: [
            {
              name: "Sintomáticos",
              dosage: "Conforme necessidade",
              mechanism: "Tratamento direcionado ao alívio dos sintomas apresentados (dor, febre, náusea)."
            }
          ]
        };
      }

      setReportData(mockResponse);
      setIsLoading(false);
      toast.success("Análise concluída com sucesso!");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Input */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <PatientForm onSubmit={handleAnalyze} isLoading={isLoading} />
            
            {/* Quick Tips Card */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4" /> Dica Clínica
              </h4>
              <p className="text-xs text-blue-700/80 dark:text-blue-400">
                Sempre descreva o histórico de forma detalhada. A IA utiliza comorbidades prévias para refinar a probabilidade pré-teste das hipóteses diagnósticas.
              </p>
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-7 xl:col-span-8">
            <ClinicalReport data={reportData} />
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
};

export default Dashboard;
