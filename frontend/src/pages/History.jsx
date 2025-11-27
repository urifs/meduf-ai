import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
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

const History = () => {
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('meduf_history') || '[]');
    setHistory(savedHistory);
  }, []);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('meduf_history', JSON.stringify(updatedHistory));
    toast.success("Registro removido do histórico.");
  };

  const filteredHistory = history.filter(item => 
    item.patient.queixa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.report.diagnoses[0].name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            {history.length === 0 ? (
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
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((entry) => (
                    <TableRow key={entry.id} className="group">
                      <TableCell className="font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(entry.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium flex items-center gap-1">
                            <User className="h-3 w-3" /> {entry.patient.sexo}, {entry.patient.idade} anos
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs truncate" title={entry.patient.queixa}>
                        {entry.patient.queixa}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10">
                          {entry.report.diagnoses[0].name}
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
                                <DialogTitle>Detalhes da Análise</DialogTitle>
                                <DialogDescription>
                                  Realizada em {format(new Date(entry.date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                <div className="md:col-span-1 space-y-4">
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm font-medium text-muted-foreground">Dados do Paciente</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm space-y-2">
                                      <div><span className="font-semibold">Idade:</span> {entry.patient.idade}</div>
                                      <div><span className="font-semibold">Sexo:</span> {entry.patient.sexo}</div>
                                      <div><span className="font-semibold">Queixa:</span> {entry.patient.queixa}</div>
                                      {entry.patient.historico && (
                                        <div><span className="font-semibold">Histórico:</span> {entry.patient.historico}</div>
                                      )}
                                    </CardContent>
                                  </Card>
                                </div>
                                <div className="md:col-span-2">
                                  <ClinicalReport data={entry.report} />
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
      </main>
    </div>
  );
};

export default History;
