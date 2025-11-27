import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle2, Pill, ClipboardList, BrainCircuit, Copy } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const ClinicalReport = ({ data }) => {
  if (!data) {
    return (
      <Card className="h-full border-dashed border-2 flex items-center justify-center bg-muted/20">
        <div className="text-center p-8 text-muted-foreground">
          <BrainCircuit className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium">Aguardando Dados</h3>
          <p className="text-sm max-w-xs mx-auto mt-2">
            Preencha o formulário ao lado e clique em "Gerar Análise" para receber o raciocínio clínico da IA.
          </p>
        </div>
      </Card>
    );
  }

  const copyToClipboard = () => {
    // Format text for clipboard
    const text = `
## 1. Hipóteses Diagnósticas
${data.diagnoses.map(d => `* **${d.name}:** ${d.justification}`).join('\n')}

## 2. Conduta e Investigação
* **Exames:** ${data.conduct.exams.join(', ')}
* **Procedimentos:** ${data.conduct.procedures.join(', ')}
* **Orientações:** ${data.conduct.advice}

## 3. Sugestão Farmacológica
${data.medications.map(m => `* **${m.name}** - ${m.dosage}\n    * ${m.mechanism}`).join('\n')}
    `;
    navigator.clipboard.writeText(text);
    toast.success("Relatório copiado para a área de transferência");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <BrainCircuit className="h-6 w-6" /> Análise Clínica
        </h2>
        <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2">
          <Copy className="h-4 w-4" /> Copiar
        </Button>
      </div>

      {/* 1. Hipóteses Diagnósticas */}
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

      {/* 2. Conduta e Investigação */}
      <Card className="border-l-4 border-l-secondary shadow-sm overflow-hidden">
        <CardHeader className="bg-secondary/5 pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-secondary" />
            2. Conduta e Investigação
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
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
          
          <Separator />
          
          <div className="grid md:grid-cols-2 gap-4">
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
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-secondary" /> Orientações
              </h4>
              <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border">
                {data.conduct.advice}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Sugestão Farmacológica */}
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

      <Alert variant="destructive" className="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900">
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertTitle className="text-red-800 dark:text-red-300">Disclaimer Médico</AlertTitle>
        <AlertDescription className="text-red-700/80 dark:text-red-400/80 text-xs">
          Esta é uma ferramenta de auxílio à decisão clínica. A responsabilidade final pelo diagnóstico e prescrição é exclusivamente do médico assistente.
        </AlertDescription>
      </Alert>
    </div>
  );
};
