import React from 'react';
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Stethoscope, FileText, History, Activity, Sparkles } from 'lucide-react';

export const PatientForm = ({ onSubmit, isLoading }) => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      idade: "",
      sexo: "",
      queixa: "",
      exame_fisico: "",
      exames_complementares: "",
      historico: ""
    }
  });

  const handleSelectChange = (value) => {
    setValue("sexo", value);
  };

  return (
    <Card className="h-full border-none shadow-md bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl text-primary">
          <Stethoscope className="h-5 w-5" />
          Dados do Paciente
        </CardTitle>
        <CardDescription>
          Preencha os dados clínicos para análise da IA.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Demographics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="idade">Idade</Label>
              <Input 
                id="idade" 
                placeholder="Ex: 45" 
                type="number"
                {...register("idade", { required: true })}
                className={errors.idade ? "border-destructive" : ""}
              />
              {errors.idade && <span className="text-xs text-destructive">Obrigatório</span>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sexo">Sexo</Label>
              <Select onValueChange={handleSelectChange}>
                <SelectTrigger className={errors.sexo ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
              {errors.sexo && <span className="text-xs text-destructive">Obrigatório</span>}
            </div>
          </div>

          <Separator />

          {/* Clinical Data */}
          <div className="space-y-2">
            <Label htmlFor="queixa" className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Queixa Principal
            </Label>
            <Textarea 
              id="queixa" 
              placeholder="Descreva a queixa principal do paciente..." 
              className="min-h-[80px] resize-none"
              {...register("queixa", { required: true })}
            />
            {errors.queixa && <span className="text-xs text-destructive">Obrigatório</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="historico" className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              Histórico
            </Label>
            <Textarea 
              id="historico" 
              placeholder="Comorbidades, cirurgias prévias, alergias..." 
              className="min-h-[80px] resize-none"
              {...register("historico", { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exame_fisico" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Exame Físico (Opcional)
            </Label>
            <Textarea 
              id="exame_fisico" 
              placeholder="Sinais vitais, ausculta, inspeção..." 
              className="min-h-[80px] resize-none"
              {...register("exame_fisico")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exames_complementares" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Exames Complementares (Opcional)
            </Label>
            <Textarea 
              id="exames_complementares" 
              placeholder="Laboratório, imagem..." 
              className="min-h-[80px] resize-none"
              {...register("exames_complementares")}
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
  );
};
