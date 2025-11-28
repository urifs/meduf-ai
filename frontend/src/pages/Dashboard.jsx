import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { PatientForm } from '@/components/PatientForm';
import { ClinicalReport } from '@/components/ClinicalReport';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Activity, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async (formData) => {
    setIsLoading(true);
    setReportData(null);

    // Simulate AI Processing Delay
    setTimeout(async () => {
      
      let mockResponse;
      const complaint = formData.queixa.toLowerCase();

      // 1. Cardiac
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
            { name: "Ácido Acetilsalicílico (AAS)", dosage: "300mg VO (ataque)", mechanism: "Antiagregante plaquetário" },
            { name: "Nitrato (Isordil)", dosage: "5mg SL", mechanism: "Vasodilatador coronariano" },
            { name: "Morfina", dosage: "2-4mg IV", mechanism: "Analgesia potente" }
          ]
        };
      } 
      // 2. Abdominal / Gastric
      else if (complaint.includes("barriga") || complaint.includes("abdominal") || complaint.includes("estômago") || complaint.includes("epigastrica") || complaint.includes("epigástrica")) {
        mockResponse = {
          diagnoses: [
            {
              name: "Gastrite Aguda / Dispepsia",
              justification: "Dor epigástrica associada a sintomas sistêmicos pode indicar processo inflamatório gástrico."
            },
            {
              name: "Pancreatite Aguda",
              justification: "Considerar se a dor for intensa, em faixa, irradiando para o dorso."
            },
            {
              name: "Colecistite Aguda",
              justification: "Se houver dor em hipocôndrio direito ou epigástrio (Sinal de Murphy?)."
            }
          ],
          conduct: {
            exams: ["Hemograma Completo", "Amilase e Lipase", "Ultrassom de Abdome Total", "TGO/TGP e Bilirrubinas"],
            procedures: ["Hidratação venosa", "Analgesia escalonada", "Jejum oral temporário"],
            advice: "Evitar alimentos gordurosos, ácidos ou condimentados. Repouso."
          },
          medications: [
            { name: "Omeprazol", dosage: "40mg IV/VO", mechanism: "Supressão ácida gástrica" },
            { name: "Buscopan Composto", dosage: "1 ampola IV", mechanism: "Antiespasmódico e analgésico" },
            { name: "Ondansetrona", dosage: "8mg IV", mechanism: "Antiemético" }
          ]
        };
      }
      // 3. Respiratory / Infection
      else if (complaint.includes("febre") || complaint.includes("tosse") || complaint.includes("ar") || complaint.includes("garganta")) {
        mockResponse = {
          diagnoses: [
            {
              name: "Infecção de Vias Aéreas Superiores (IVAS)",
              justification: "Quadro febril inespecífico sugere etiologia viral ou bacteriana inicial."
            },
            {
              name: "Pneumonia Adquirida na Comunidade",
              justification: "Considerar se houver dispneia, tosse produtiva ou ausculta pulmonar alterada."
            },
            {
              name: "Influenza / Covid-19",
              justification: "Síndrome gripal com febre e sintomas sistêmicos."
            }
          ],
          conduct: {
            exams: ["Teste Rápido Influenza/Covid", "Raio-X de Tórax (se dispneia)", "Hemograma"],
            procedures: ["Avaliação de sinais vitais", "Hidratação oral vigorosa"],
            advice: "Isolamento respiratório se suspeita de Covid. Repouso e hidratação."
          },
          medications: [
            { name: "Dipirona", dosage: "1g 6/6h", mechanism: "Antitérmico e analgésico" },
            { name: "Xarope Expectorante", dosage: "Conforme necessidade", mechanism: "Sintomático para tosse" }
          ]
        };
      }
      // 4. Neurological
      else if (complaint.includes("cabeça") || complaint.includes("cefaleia")) {
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
            { name: "Dipirona", dosage: "1g IV ou VO", mechanism: "Analgesico não-opioide e antipirético." },
            { name: "Sumatriptano", dosage: "50mg VO", mechanism: "Agonista seletivo de receptores 5-HT1B/1D." }
          ]
        };
      } 
      // 5. Fallback
      else {
        mockResponse = {
          diagnoses: [
            {
              name: "Síndrome Clínica a Esclarecer",
              justification: "Os sintomas apresentados requerem maior detalhamento ou exames complementares para hipótese precisa."
            },
            {
              name: "Virose Inespecífica",
              justification: "Diagnóstico de exclusão comum em quadros agudos com sintomas gerais."
            }
          ],
          conduct: {
            exams: ["Hemograma Completo", "PCR", "Ureia e Creatinina", "EAS (Urina Tipo 1)"],
            procedures: ["Avaliação de sinais vitais", "Hidratação se necessário"],
            advice: "Observação clínica e reavaliação após resultados de exames."
          },
          medications: [
            { name: "Sintomáticos", dosage: "Conforme necessidade", mechanism: "Tratamento direcionado ao alívio dos sintomas apresentados." }
          ]
        };
      }

      try {
        // Save to Backend
        await api.post('/consultations', {
          patient: formData,
          report: mockResponse
        });
        
        setReportData(mockResponse);
        toast.success("Análise concluída e salva no histórico!");
      } catch (error) {
        console.error("Error saving consultation:", error);
        toast.error("Erro ao salvar análise no banco de dados.");
        setReportData(mockResponse); // Show result anyway
      } finally {
        setIsLoading(false);
      }
    }, 2000);
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
