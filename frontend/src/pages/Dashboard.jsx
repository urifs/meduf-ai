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
      // Ensure complaint is a string, lowercased, and normalized (no accents)
      const complaint = (formData.queixa || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      // 1. Gynecological / Obstetric (High Priority)
      if (complaint.includes("menstruacao") || complaint.includes("atraso") || complaint.includes("sangramento vaginal") || complaint.includes("colica") || complaint.includes("gestante") || complaint.includes("gravida")) {
        mockResponse = {
          diagnoses: [
            {
              name: "Gravidez (Possível Gestação)",
              justification: "Atraso menstrual em paciente em idade fértil é gravidez até prova em contrário."
            },
            {
              name: "Dismenorreia / Alteração Hormonal",
              justification: "Considerar se houver história de irregularidade menstrual ou SOP."
            },
            {
              name: "Infecção do Trato Urinário (ITU)",
              justification: "Diagnóstico diferencial comum se houver dor pélvica associada."
            }
          ],
          conduct: {
            exams: ["Beta-HCG (Sanguíneo)", "Ultrassom Transvaginal", "EAS (Urina Tipo 1)"],
            procedures: ["Exame especular (se sangramento)", "Palpação abdominal"],
            advice: "Abstinência sexual até definição. Iniciar ácido fólico se desejo de gestar."
          },
          medications: [
            { name: "Ácido Fólico", dosage: "5mg/dia", mechanism: "Prevenção de defeitos do tubo neural." },
            { name: "Buscopan Composto", dosage: "1 cp 8/8h", mechanism: "Sintomático para cólicas." }
          ]
        };
      }
      // 2. Cardiac
      else if (complaint.includes("dor no peito") || complaint.includes("tórax") || complaint.includes("precordial") || complaint.includes("infarto") || complaint.includes("coração")) {
        mockResponse = {
          diagnoses: [
            {
              name: "Síndrome Coronariana Aguda (SCA)",
              justification: "Dor torácica típica ou atípica em paciente com fatores de risco requer exclusão imediata de isquemia miocárdica."
            },
            {
              name: "Dissecção Aórtica",
              justification: "Diagnóstico diferencial importante em dor torácica aguda, especialmente se houver hipertensão não controlada."
            },
            {
              name: "Doença do Refluxo Gastroesofágico (DRGE)",
              justification: "Pode mimetizar dor anginosa. Considerar se houver queimação ou relação com alimentação."
            }
          ],
          conduct: {
            exams: ["Eletrocardiograma (ECG) 12 derivações", "Troponina I/T seriada", "Raio-X de Tórax", "Hemograma Completo", "Creatinina e Eletrólitos"],
            procedures: ["Monitorização cardíaca contínua", "Acesso venoso periférico", "Oxigenoterapia se SatO2 < 90%"],
            advice: "Manter paciente em repouso absoluto. Jejum até definição diagnóstica. Monitorar sinais vitais a cada 15 minutos."
          },
          medications: [
            { name: "Ácido Acetilsalicílico (AAS)", dosage: "300mg VO (ataque)", mechanism: "Antiagregante plaquetário. Inibição irreversível da COX-1." },
            { name: "Nitrato (Isordil)", dosage: "5mg Sublingual (se PAS > 100mmHg)", mechanism: "Vasodilatador coronariano. Alívio sintomático da angina." },
            { name: "Morfina", dosage: "2-4mg IV (se dor refratária)", mechanism: "Analgesia potente e venodilatação leve. Usar com cautela." }
          ]
        };
      } 
      // 3. Abdominal / Gastric
      else if (complaint.includes("barriga") || complaint.includes("abdominal") || complaint.includes("estômago") || complaint.includes("epigastrica") || complaint.includes("epigástrica") || complaint.includes("fígado") || complaint.includes("intestino")) {
        mockResponse = {
          diagnoses: [
            {
              name: "Gastrite Aguda / Dispepsia Funcional",
              justification: "Sintomas dispépticos sugerem irritação da mucosa gástrica ou distúrbio de motilidade."
            },
            {
              name: "Gastroenterite Aguda (GEA)",
              justification: "Considerar se houver diarreia, vômitos ou febre associada."
            },
            {
              name: "Abdome Agudo (Apendicite/Colecistite)",
              justification: "Investigar sinais de irritação peritoneal (Blumberg, Murphy) se a dor for localizada."
            }
          ],
          conduct: {
            exams: ["Hemograma Completo", "PCR", "Amilase/Lipase", "Ultrassom de Abdome (se dor persistente)"],
            procedures: ["Hidratação venosa se houver sinais de desidratação", "Analgesia"],
            advice: "Dieta leve e fracionada. Aumentar ingestão hídrica. Evitar irritantes gástricos."
          },
          medications: [
            { name: "Omeprazol", dosage: "40mg em jejum", mechanism: "Inibidor de bomba de prótons. Reduz acidez gástrica." },
            { name: "Escopolamina (Buscopan)", dosage: "10mg 8/8h", mechanism: "Antiespasmódico. Alívio de cólicas." },
            { name: "Ondansetrona", dosage: "4-8mg 8/8h", mechanism: "Antiemético. Controle de náuseas e vômitos." }
          ]
        };
      }
      // 4. Respiratory / Infection (Covid, Flu)
      else if (complaint.includes("febre") || complaint.includes("tosse") || complaint.includes("ar") || complaint.includes("garganta") || complaint.includes("pulmao") || complaint.includes("respirar") || complaint.includes("covid") || complaint.includes("coronavirus") || complaint.includes("gripe") || complaint.includes("influenza")) {
        if (complaint.includes("covid") || complaint.includes("coronavirus")) {
           mockResponse = {
            diagnoses: [
              {
                name: "Covid-19 (Suspeita/Confirmada)",
                justification: "Menção direta à patologia ou quadro respiratório agudo sugestivo."
              },
              {
                name: "Síndrome Gripal",
                justification: "Diagnóstico diferencial principal."
              }
            ],
            conduct: {
              exams: ["RT-PCR SARS-CoV-2", "Teste Rápido Antígeno", "Oximetria de Pulso", "Tomografia de Tórax (se dessaturação)"],
              procedures: ["Isolamento respiratório (gotículas/aerossóis)", "Notificação compulsória"],
              advice: "Isolamento por 5-7 dias. Uso de máscara. Retorno se falta de ar."
            },
            medications: [
              { name: "Dipirona", dosage: "1g 6/6h", mechanism: "Sintomático para febre e dor." },
              { name: "Xarope (Dropropizina/Acebrofilina)", dosage: "Conforme bula", mechanism: "Alívio da tosse." },
              { name: "Corticoide (Dexametasona)", dosage: "6mg/dia (Apenas se necessidade de O2)", mechanism: "Anti-inflamatório sistêmico (fase inflamatória)." }
            ]
          };
        } else {
          mockResponse = {
            diagnoses: [
              {
                name: "Infecção de Vias Aéreas Superiores (IVAS)",
                justification: "Quadro compatível com etiologia viral (Resfriado/Gripe) ou bacteriana (Amigdalite/Sinusite)."
              },
              {
                name: "Pneumonia Comunitária",
                justification: "Suspeitar se houver febre alta, dispneia, taquipneia ou estertores à ausculta."
              },
              {
                name: "Bronquite Aguda",
                justification: "Tosse persistente com ou sem expectoração, geralmente viral."
              }
            ],
            conduct: {
              exams: ["Raio-X de Tórax (se sinais de gravidade)", "Hemograma", "Teste para Influenza/Covid-19"],
              procedures: ["Oximetria de pulso", "Inalação com broncodilatador se houver sibilos"],
              advice: "Repouso relativo. Hidratação abundante. Lavagem nasal com soro fisiológico."
            },
            medications: [
              { name: "Dipirona", dosage: "500mg-1g 6/6h", mechanism: "Antitérmico e analgésico." },
              { name: "Acebrofilina", dosage: "5-10ml 12/12h", mechanism: "Mucolítico e broncodilatador (sintomático para tosse)." },
              { name: "Amoxicilina", dosage: "500mg 8/8h (Se indicação bacteriana)", mechanism: "Antibiótico beta-lactâmico." }
            ]
          };
        }
      }
      // 5. Tropical Diseases / Infectious (Malaria, Dengue)
      else if (complaint.includes("malaria") || complaint.includes("paludismo") || complaint.includes("dengue") || complaint.includes("zika") || complaint.includes("chikungunya") || complaint.includes("picada") || complaint.includes("mosquito")) {
        if (complaint.includes("malaria") || complaint.includes("paludismo")) {
          mockResponse = {
            diagnoses: [
              {
                name: "Malária (Suspeita Clínica)",
                justification: "Quadro febril com história de exposição/área endêmica ou menção direta sugere infecção por Plasmodium."
              },
              {
                name: "Dengue / Arbovirose",
                justification: "Diagnóstico diferencial obrigatório em febre aguda tropical."
              }
            ],
            conduct: {
              exams: ["Gota Espessa (Padrão Ouro)", "Teste Rápido para Malária", "Hemograma (Plaquetopenia?)", "Notificação Compulsória (SINAN)"],
              procedures: ["Aferição de temperatura", "Hidratação venosa se sinais de gravidade"],
              advice: "Repouso. Uso de repelentes. Retorno imediato se sinais de gravidade (icterícia, dispneia, sangramento)."
            },
            medications: [
              { name: "Artemeter + Lumefantrina", dosage: "Conforme peso/protocolo MS", mechanism: "Antimalárico (Esquema para P. falciparum)." },
              { name: "Cloroquina + Primaquina", dosage: "Conforme peso/protocolo MS", mechanism: "Antimalárico (Esquema para P. vivax)." },
              { name: "Dipirona", dosage: "1g 6/6h", mechanism: "Sintomático para febre." }
            ]
          };
        } else {
          // Dengue/General Arbovirus fallback
          mockResponse = {
            diagnoses: [
              {
                name: "Dengue (Provável)",
                justification: "Febre súbita, mialgia, artralgia e dor retro-orbital."
              },
              {
                name: "Zika / Chikungunya",
                justification: "Diagnósticos diferenciais de arboviroses."
              }
            ],
            conduct: {
              exams: ["Hemograma (Plaquetas/Hematócrito)", "NS1 (até 5º dia) ou Sorologia (após 6º dia)", "Prova do Laço"],
              procedures: ["Hidratação vigorosa (Estadiamento A/B/C/D)", "Notificação"],
              advice: "Hidratação oral (60-80ml/kg/dia). Não usar AAS/Anti-inflamatórios."
            },
            medications: [
              { name: "Dipirona", dosage: "1g 6/6h", mechanism: "Analgesia e antitérmico." },
              { name: "Soro de Reidratação Oral", dosage: "Livre demanda", mechanism: "Prevenção de choque." },
              { name: "Contraindicado", dosage: "AAS e AINEs", mechanism: "Risco de sangramento." }
            ]
          };
        }
      }
      // 6. Neurological
      else if (complaint.includes("cabeça") || complaint.includes("cefaleia") || complaint.includes("enxaqueca") || complaint.includes("tontura")) {
        mockResponse = {
          diagnoses: [
            {
              name: "Cefaleia Tensional",
              justification: "Padrão de dor mais comum, geralmente opressiva, bilateral e leve/moderada."
            },
            {
              name: "Enxaqueca (Migrânea)",
              justification: "Dor pulsátil, unilateral, intensidade moderada/forte, com náuseas ou fotofobia."
            },
            {
              name: "Labirintite / Vertigem",
              justification: "Considerar se a queixa principal for tontura rotatória."
            }
          ],
          conduct: {
            exams: ["Exame neurológico sumário", "Tomografia de Crânio (apenas se sinais de alarme/red flags)"],
            procedures: ["Repouso em ambiente calmo e escuro"],
            advice: "Identificar e evitar gatilhos (alimentos, sono irregular, estresse)."
          },
          medications: [
            { name: "Dipirona", dosage: "1g IV ou VO", mechanism: "Analgesico não-opioide e antipirético." },
            { name: "Sumatriptano", dosage: "50mg VO", mechanism: "Agonista seletivo de receptores 5-HT1B/1D. Abortivo de crise." },
            { name: "Dimenidrinato", dosage: "50mg 6/6h", mechanism: "Antivertiginoso (se houver tontura)." }
          ]
        };
      } 
      // 7. Musculoskeletal / Pain
      else if (complaint.includes("dor") || complaint.includes("costas") || complaint.includes("lombar") || complaint.includes("perna") || complaint.includes("braço") || complaint.includes("muscular")) {
        mockResponse = {
          diagnoses: [
            {
              name: "Lombalgia Mecânica / Dor Muscular",
              justification: "Dor relacionada a esforço, postura ou trauma leve. Ausência de sinais de compressão radicular."
            },
            {
              name: "Fibromialgia",
              justification: "Considerar em quadros de dor crônica difusa."
            }
          ],
          conduct: {
            exams: ["Raio-X de Coluna (se trauma ou red flags)", "Exame físico ortopédico"],
            procedures: ["Compressa morna local", "Repouso relativo (evitar repouso absoluto prolongado)"],
            advice: "Correção postural. Evitar carregar peso. Fisioterapia se persistir."
          },
          medications: [
            { name: "Ciclobenzaprina", dosage: "5-10mg à noite", mechanism: "Relaxante muscular central." },
            { name: "Diclofenaco", dosage: "50mg 8/8h", mechanism: "Anti-inflamatório não esteroidal (AINE)." },
            { name: "Dipirona", dosage: "1g 6/6h", mechanism: "Analgesia." }
          ]
        };
      }
      // 8. Universal Fallback (Guaranteed Response)
      else {
        mockResponse = {
          diagnoses: [
            {
              name: "Investigação Clínica Inicial",
              justification: "Os sintomas relatados são inespecíficos ou requerem maior detalhamento para uma hipótese diagnóstica precisa. A avaliação clínica presencial é fundamental."
            },
            {
              name: "Síndrome Viral Inespecífica",
              justification: "Diagnóstico de exclusão frequente em quadros com sintomas gerais (mal-estar, fadiga) sem foco definido."
            }
          ],
          conduct: {
            exams: ["Hemograma Completo", "PCR (Proteína C Reativa)", "Glicemia de Jejum", "TSH (se fadiga)", "EAS (Urina Tipo 1)"],
            procedures: ["Anamnese detalhada (revisão de sistemas)", "Exame físico completo", "Aferição de sinais vitais (PA, FC, Temp, SatO2)"],
            advice: "Observar evolução dos sintomas por 24-48h. Retornar ao serviço de saúde se houver piora, febre persistente ou surgimento de novos sintomas."
          },
          medications: [
            { name: "Sintomáticos", dosage: "Conforme necessidade", mechanism: "Tratamento direcionado ao alívio dos sintomas apresentados (dor, febre, náusea)." },
            { name: "Polivitamínico", dosage: "1 cp ao dia", mechanism: "Suporte nutricional (se houver suspeita de carência)." }
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
