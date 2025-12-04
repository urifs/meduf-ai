import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClinicalReport } from '@/components/ClinicalReport';

const ConsultationDialog = ({ 
  isOpen, 
  onOpenChange, 
  selectedConsultation, 
  formatDate 
}) => {
  if (!selectedConsultation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Consulta</DialogTitle>
          <DialogDescription>
            Realizada por Dr(a). {selectedConsultation.doctor} em {formatDate(selectedConsultation.date)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div className="md:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Dados do Paciente</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div><span className="font-semibold">Idade:</span> {selectedConsultation.patient?.idade || 'N/I'}</div>
                <div><span className="font-semibold">Sexo:</span> {selectedConsultation.patient?.sexo || 'N/I'}</div>
                <div><span className="font-semibold">Queixa:</span> {selectedConsultation.patient?.queixa || 'N/I'}</div>
                {selectedConsultation.patient?.historico && (
                  <div><span className="font-semibold">Histórico:</span> {selectedConsultation.patient.historico}</div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2">
            {selectedConsultation.report ? (
              typeof selectedConsultation.report === 'object' && selectedConsultation.report.diagnoses ? (
                <ClinicalReport data={selectedConsultation.report} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Resultado da Análise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md">
                      {JSON.stringify(selectedConsultation.report, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Dados da análise não disponíveis
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConsultationDialog;
