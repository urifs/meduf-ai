import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import FooterLogo from '@/components/FooterLogo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClinicalReport } from '@/components/ClinicalReport';
import { History as HistoryIcon, Search, Calendar, User, FileText, Trash2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from "sonner";
import api from '@/lib/api';

const History = () => {
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/consultations');
      // Ensure response.data is always an array
      setHistory(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Erro ao carregar histórico.");
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/consultations/${id}`);
      setHistory(history.filter(item => item.id !== id));
      toast.success("Registro removido do histórico.");
    } catch (error) {
      console.error("Error deleting consultation:", error);
      toast.error("Erro ao excluir registro.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (error) {
      return "-";
    }
  };

  const filteredHistory = Array.isArray(history) ? history.filter(item => {
    // Ensure all required fields exist
    if (!item.patient || !item.report || !item.report.diagnoses || item.report.diagnoses.length === 0) {
      return false;
    }
    return (
      (item.patient?.queixa && item.patient.queixa.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.report?.diagnoses && item.report.diagnoses[0]?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }) : [];

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <HistoryIcon className="h-8 w-8 text-primary" /> Histórico de Análises
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize e gerencie todas as análises clínicas realizadas anteriormente.
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por queixa ou diagnóstico..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">Carregando histórico...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-foreground">Nenhum registro encontrado</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                  As análises que você realizar aparecerão aqui automaticamente.
                </p>
                <Button className="mt-6" asChild>
                  <a href="/">Nova Análise</a>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Data</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead className="hidden md:table-cell">Queixa Principal</TableHead>
                    <TableHead>Diagnóstico Principal</TableHead>
                    <TableHead className="hidden sm:table-cell">Modelo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((entry) => (
                    <TableRow key={entry.id} className="group">
                      <TableCell className="font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(entry.timestamp || entry.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium flex items-center gap-1">
                            <User className="h-3 w-3" /> {entry.patient?.sexo || 'N/I'}, {entry.patient?.idade || 'N/I'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs truncate" title={entry.patient?.queixa}>
                        {entry.patient?.queixa || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10">
                          {entry.report?.diagnoses?.[0]?.name || entry.report?.prescription ? 'Prescrição/Doses' : 'Análise'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary" className="text-xs">
                          {entry.model || 'Meduf 2.5 Clinic'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedEntry(entry)}>
                                Ver Detalhes
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center justify-between">
                                  <span>Detalhes da Análise</span>
                                  <Badge variant="secondary">
                                    {entry.model || 'Meduf 2.5 Clinic'}
                                  </Badge>
                                </DialogTitle>
                                <DialogDescription>
                                  Realizada em {(entry.timestamp || entry.created_at) ? (() => {
                                    try {
                                      const date = new Date(entry.timestamp || entry.created_at);
                                      return !isNaN(date.getTime()) ? format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) : "-";
                                    } catch (e) {
                                      return "-";
                                    }
                                  })() : "-"}
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                {entry.patient && Object.keys(entry.patient).length > 0 && (
                                  <div className="md:col-span-1 space-y-4">
                                    <Card>
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Dados do Paciente</CardTitle>
                                      </CardHeader>
                                      <CardContent className="text-sm space-y-2">
                                        {entry.patient.idade && <div><span className="font-semibold">Idade:</span> {entry.patient.idade}</div>}
                                        {entry.patient.sexo && <div><span className="font-semibold">Sexo:</span> {entry.patient.sexo}</div>}
                                        {entry.patient.peso && <div><span className="font-semibold">Peso:</span> {entry.patient.peso}</div>}
                                        {entry.patient.altura && <div><span className="font-semibold">Altura:</span> {entry.patient.altura}</div>}
                                        {entry.patient.queixa && <div><span className="font-semibold">Queixa:</span> {entry.patient.queixa}</div>}
                                        {entry.patient.historico && (
                                          <div><span className="font-semibold">Histórico:</span> {entry.patient.historico}</div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  </div>
                                )}
                                <div className={entry.patient && Object.keys(entry.patient).length > 0 ? "md:col-span-2" : "md:col-span-3"}>
                                  {entry.report?.prescription ? (
                                    <Card>
                                      <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-b border-red-100">
                                        <CardTitle className="text-xl bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                                          Prescrição Farmacológica
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="p-6">
                                        <div 
                                          className="prose prose-slate dark:prose-invert max-w-none"
                                          dangerouslySetInnerHTML={{ __html: entry.report.prescription }}
                                        />
                                      </CardContent>
                                    </Card>
                                  ) : (
                                    <ClinicalReport data={entry.report} />
                                  )}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDelete(entry.id, e)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <FooterLogo />
      </main>
    </div>
  );
};

export default History;
