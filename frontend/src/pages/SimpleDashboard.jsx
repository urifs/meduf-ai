import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { ClinicalReport } from '@/components/ClinicalReport';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Activity, Sparkles, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

const SimpleDashboard = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [anamnese, setAnamnese] = useState("");

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!anamnese.trim()) {
      toast.error("Por favor, descreva o caso clínico.");
      return;
    }

    setIsLoading(true);
    setReportData(null);

    try {
      // Call AI Consensus Engine (3 AIs + PubMed)
      toast.info("🔬 Consultando 3 IAs + bases médicas (PubMed)...", { duration: 8000 });
      
      const response = await api.post('/ai/consensus/diagnosis', {
        queixa: anamnese,
        idade: "N/I",
        sexo: "N/I",
        historia: anamnese
      });
      
      const aiReport = response.data;

      // 1. Gynecological / Obstetric (High Priority)
      if (text.includes("menstruacao") || text.includes("atraso") || text.includes("sangramento vaginal") || text.includes("colica") || text.includes("gestante") || text.includes("gravida")) {
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
      // 2. Cardiac / Chest Pain
      else if (text.includes("dor no peito") || text.includes("tórax") || text.includes("precordial") || text.includes("infarto") || text.includes("coração")) {
        mockResponse = {
          diagnoses: [
            {
              name: "Síndrome Coronariana Aguda (SCA)",
              justification: "Dor torácica descrita sugere isquemia. Necessário descartar IAM com urgência."
            },
            {
              name: "Dissecção Aórtica",
              justification: "Diagnóstico diferencial crítico, especialmente se houver hipertensão ou dor transfixante."
            },
            {
              name: "Embolia Pulmonar (TEP)",
              justification: "Considerar se houver dispneia súbita ou fatores de risco para TVP."
            }
          ],
          conduct: {
            exams: ["Eletrocardiograma (ECG) 12 derivações", "Troponina I/T", "Raio-X de Tórax", "Dímero-D"],
            procedures: ["Monitorização cardíaca", "Acesso venoso", "Oximetria"],
            advice: "Encaminhar para emergência hospitalar imediatamente."
          },
          medications: [
            { name: "AAS", dosage: "300mg VO", mechanism: "Antiagregante plaquetário" },
            { name: "Nitrato", dosage: "5mg SL", mechanism: "Vasodilatador (se PAS > 100mmHg)" }
          ]
        };
      } 
      // 2. Abdominal Pain / Gastric
      else if (text.includes("barriga") || text.includes("abdominal") || text.includes("estômago") || text.includes("epigastrica") || text.includes("epigástrica") || text.includes("fígado") || text.includes("intestino")) {
        mockResponse = {
          diagnoses: [
            {
              name: "Gastrite Aguda / Dispepsia",
              justification: "Dor epigástrica associada a sintomas sistêmicos pode indicar processo inflamatório gástrico."
            },
            {
              name: "Pancreatite Aguda",
              justification: "Considerar se a dor for intensa, em faixa, irradiando para o dorso, especialmente com febre."
            },
            {
              name: "Colecistite Aguda",
              justification: "Se houver dor em hipocôndrio direito ou epigástrio, associada a febre (Sinal de Murphy?)."
            }
          ],
          conduct: {
            exams: ["Hemograma Completo", "Amilase e Lipase", "Ultrassom de Abdome Total", "TGO/TGP e Bilirrubinas"],
            procedures: ["Hidratação venosa", "Analgesia escalonada", "Jejum oral temporário"],
            advice: "Evitar alimentos gordurosos, ácidos ou condimentados. Repouso."
          },
          medications: [
            { name: "Inibidor de Bomba de Prótons (Omeprazol)", dosage: "40mg IV/VO", mechanism: "Supressão ácida gástrica" },
            { name: "Buscopan Composto", dosage: "1 ampola IV", mechanism: "Antiespasmódico e analgésico" },
            { name: "Ondansetrona", dosage: "8mg IV", mechanism: "Antiemético (se náuseas)" }
          ]
        };
      }
      // 3. Respiratory / Infection (Covid, Flu)
      else if (text.includes("febre") || text.includes("tosse") || text.includes("ar") || text.includes("garganta") || text.includes("pulmao") || text.includes("respirar") || text.includes("covid") || text.includes("coronavirus") || text.includes("gripe") || text.includes("influenza")) {
        if (text.includes("covid") || text.includes("coronavirus")) {
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
      }
      // 4. Tropical Diseases / Infectious (Malaria, Dengue)
      else if (text.includes("malaria") || text.includes("paludismo") || text.includes("dengue") || text.includes("zika") || text.includes("chikungunya") || text.includes("picada") || text.includes("mosquito")) {
        if (text.includes("malaria") || text.includes("paludismo")) {
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
      // 5. Neurological / Headache
      else if (text.includes("cabeça") || text.includes("cefaleia") || text.includes("enxaqueca") || text.includes("tontura")) {
        mockResponse = {
          diagnoses: [
            {
              name: "Cefaleia Tensional",
              justification: "Dor opressiva, bilateral, intensidade leve a moderada."
            },
            {
              name: "Enxaqueca (Migrânea)",
              justification: "Dor pulsátil, unilateral, com fotofobia/fonofobia."
            },
            {
              name: "Labirintite / Vertigem",
              justification: "Considerar se a queixa principal for tontura rotatória."
            }
          ],
          conduct: {
            exams: ["Exame neurológico sumário", "Fundo de olho (se sinais de alarme)"],
            procedures: ["Repouso em local escuro"],
            advice: "Evitar gatilhos alimentares e estresse."
          },
          medications: [
            { name: "Dipirona", dosage: "1g IV/VO", mechanism: "Analgesia simples" },
            { name: "Sumatriptano", dosage: "50mg VO", mechanism: "Abortivo de crise de enxaqueca" }
          ]
        };
      }
      // 5. Musculoskeletal / Pain
      else if (text.includes("dor") || text.includes("costas") || text.includes("lombar") || text.includes("perna") || text.includes("braço") || text.includes("muscular")) {
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
      // 6. Universal Fallback (Guaranteed Response)
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

      // Save to consultation history
      try {
        await api.post('/consultations', {
          patient: {
            idade: "N/I",
            sexo: "N/I",
            queixa: anamnese
          },
          report: aiReport
        });
      } catch (error) {
        console.error("Error saving:", error);
      }
      
      setReportData(aiReport);
      
      // Save to localStorage for history
      const historyEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        patient: { queixa: anamnese },
        report: aiReport
      };
      
      const existingHistory = JSON.parse(localStorage.getItem('meduf_history') || '[]');
      existingHistory.unshift(historyEntry);
      localStorage.setItem('meduf_history', JSON.stringify(existingHistory.slice(0, 50)));
      
      toast.success("✅ Análise completa! Consenso de 3 IAs + literatura médica");
      
    } catch (error) {
      console.error("AI Consensus Error:", error);
      toast.error("Erro ao processar análise. Tente novamente.");
    } finally {
      setIsLoading(false);
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
          {/* Left Column: Input */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <Card className="h-full border-none shadow-md bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-primary">
                  <Sparkles className="h-5 w-5" />
                  Diagnóstico Simples
                </CardTitle>
                <CardDescription>
                  Descreva o caso livremente. A IA identificará os padrões.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAnalyze} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="anamnese">Anamnese Completa</Label>
                    <Textarea 
                      id="anamnese" 
                      placeholder="Ex: Paciente 38 anos com febre de 38 graus e dor epigástrica..." 
                      className="min-h-[300px] resize-none text-base leading-relaxed"
                      value={anamnese}
                      onChange={(e) => setAnamnese(e.target.value)}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span> Analisando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" /> Gerar Análise Clínica
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
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

export default SimpleDashboard;
