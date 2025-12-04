import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle2, Pill, ClipboardList, BrainCircuit, Activity } from 'lucide-react';
import { ResultActions } from '@/components/ResultActions';

export const ClinicalReport = memo(({ data, analysisType = 'diagnosis' }) => {
  const reportRef = React.useRef(null);

  if (!data) {
    return (
      <Card className="h-full border-dashed border-2 flex items-center justify-center bg-muted/20">
        <div className="text-center p-8 text-muted-foreground">
          <BrainCircuit className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium">Aguardando Dados</h3>
          <p className="text-sm max-w-xs mx-auto mt-2">
            Preencha o formulário ao lado e clique em &quot;Gerar Análise&quot; para receber o raciocínio clínico da IA.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <BrainCircuit className="h-6 w-6" /> Análise Clínica
        </h2>
      </div>

      {/* Report Container to Capture */}
      <div ref={reportRef} className="space-y-6 p-4 bg-white rounded-lg">
        {/* 1. Hipóteses Diagnósticas */}
        {data.diagnoses && data.diagnoses.length > 0 && (
          <Card className="border-l-4 border-l-primary shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                1. Hipóteses Diagnósticas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {data.diagnoses.map((diag, index) => (
                <div key={index} className="relative pl-4 border-l-2 border-muted hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-foreground text-lg">{diag.name}</span>
                    <Badge variant={index === 0 ? "default" : "secondary"} className={index === 0 ? "bg-primary" : ""}>
                      {index === 0 ? "Alta Probabilidade" : "Diferencial"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {diag.justification}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 2. Conduta e Investigação */}
        {data.conduct && (
          <Card className="border-l-4 border-l-secondary shadow-sm overflow-hidden">
            <CardHeader className="bg-secondary/5 pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-secondary" />
                2. Conduta e Investigação
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {data.conduct.exams && data.conduct.exams.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-secondary" /> Exames a Solicitar
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {data.conduct.exams.map((exam, i) => (
                      <Badge key={i} variant="outline" className="bg-background">
                        {exam}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {(data.conduct.exams && (data.conduct.procedures || data.conduct.advice)) && <Separator />}
              
              <div className="grid md:grid-cols-2 gap-4">
                {data.conduct.procedures && data.conduct.procedures.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-secondary" /> Procedimentos
                    </h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {data.conduct.procedures.map((proc, i) => (
                        <li key={i}>{proc}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.conduct.advice && (
                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-secondary" /> Orientações
                    </h4>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border">
                      {data.conduct.advice}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3. Sugestão Farmacológica */}
        {data.medications && data.medications.length > 0 && (
          <Card className="border-l-4 border-l-indigo-500 shadow-sm overflow-hidden">
            <CardHeader className="bg-indigo-50 pb-3 dark:bg-indigo-950/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <Pill className="h-5 w-5 text-indigo-500" />
                3. Sugestão Farmacológica
              </CardTitle>
              <CardDescription className="text-xs">
                *As dosagens são sugestivas e devem ser validadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {data.medications.map((med, index) => (
                <div key={index} className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">{med.name}</span>
                    <Badge variant="outline" className="w-fit">{med.dosage}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground italic mb-2 border-l-2 border-indigo-200 pl-2">
                    {med.mechanism}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Alert variant="destructive" className="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle className="text-red-800 dark:text-red-300">Aviso Médico</AlertTitle>
          <AlertDescription className="text-red-700/80 dark:text-red-400/80 text-xs">
            Esta é uma ferramenta de auxílio à decisão clínica. A responsabilidade final pelo diagnóstico e prescrição é exclusivamente do médico assistente.
          </AlertDescription>
        </Alert>
      </div>

      {/* ResultActions Component */}
      <ResultActions 
        resultRef={reportRef}
        resultData={data}
        analysisType={analysisType}
        fileName={`analise-clinica-${new Date().toISOString().slice(0,10)}.png`}
      />
    </div>
  );
};
