import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Activity, Database, ShieldAlert, Search, Lock, Shield, Ban, Trash2, Unlock, Stethoscope, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import api from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Admin = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');
  const [users, setUsers] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Security Check
  useEffect(() => {
    if (userRole !== 'ADMIN') {
      navigate('/'); // Redirect non-admins to dashboard
    } else {
      // Set up polling for real-time updates
      fetchData();
      const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [userRole, navigate]);

  const fetchData = async () => {
    try {
      const [usersRes, consultsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/consultations')
      ]);
      
      setUsers(usersRes.data);
      
      // Map real consultations to match the structure if needed
      const realConsultations = consultsRes.data.map(c => ({
        ...c,
        // Ensure date field consistency
        date: c.date || c.created_at 
      }));

      setConsultations(realConsultations);

    } catch (error) {
      console.error("Error fetching admin data:", error);
      // Only show toast on initial load failure to avoid spamming
      if (isLoading) {
        toast.error("Erro ao carregar dados do servidor.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (userRole !== 'ADMIN') {
    return null; // Prevent flash of content
  }

  const handleToggleBlock = async (userId) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/status`);
      const newStatus = response.data.status;
      
      setUsers(users.map(user => {
        if (user.id === userId) {
          return { ...user, status: newStatus };
        }
        return user;
      }));
      
      toast.success(`Status do usuário atualizado para: ${newStatus}`);
    } catch (error) {
      toast.error("Erro ao atualizar status do usuário.");
    }
  };

  const handleDelete = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(user => user.id !== userId));
      toast.success("Usuário excluído com sucesso.");
    } catch (error) {
      toast.error("Erro ao excluir usuário.");
    }
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background font-sans flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" /> Painel Administrativo
            </h1>
            <p className="text-muted-foreground mt-1">
              Acesso restrito: Gerenciamento de usuários e monitoramento do sistema.
            </p>
          </div>
          <Badge variant="outline" className="w-fit h-fit py-1 px-3 border-primary text-primary gap-2">
            <Lock className="h-3 w-3" /> Modo Seguro Ativo
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Análises Realizadas</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{consultations.length}</div>
              <p className="text-xs text-muted-foreground">Total de consultas registradas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
              <ShieldAlert className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Operacional</div>
              <p className="text-xs text-muted-foreground">Latência média: 45ms</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
            <TabsTrigger value="users">Gerenciar Usuários</TabsTrigger>
            <TabsTrigger value="consultations">Últimas Consultas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Usuários Cadastrados</CardTitle>
                <CardDescription>
                  Lista de profissionais de saúde com acesso à plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data de Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          <Badge variant={
                            user.status === 'Ativo' || user.status === 'Online' ? 'default' : 
                            user.status === 'Bloqueado' ? 'destructive' : 'secondary'
                          }>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell className="text-right">
                          {user.role !== 'ADMIN' && ( // Prevent actions on admins for safety in this demo
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleToggleBlock(user.id)}
                                title={user.status === 'Bloqueado' ? "Desbloquear" : "Bloquear"}
                                className={user.status === 'Bloqueado' ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-orange-500 hover:text-orange-600 hover:bg-orange-50"}
                              >
                                {user.status === 'Bloqueado' ? <Unlock className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    title="Excluir Usuário"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita. Isso excluirá permanentemente a conta de <b>{user.name}</b> e removerá seus dados de nossos servidores.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(user.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Sim, excluir conta
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consultations">
            <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Consultas Recentes</CardTitle>
                <CardDescription>
                  Monitoramento em tempo real das análises realizadas pelos médicos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Médico Responsável</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Queixa Principal</TableHead>
                      <TableHead>Diagnóstico Gerado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consultations.map((consult) => (
                      <TableRow key={consult.id}>
                        <TableCell className="font-medium text-muted-foreground">
                          {formatDate(consult.date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-primary" />
                            {consult.doctor}
                          </div>
                        </TableCell>
                        <TableCell>
                          {consult.patient?.sexo || 'N/I'} ({consult.patient?.idade || 'N/I'})
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={consult.patient?.queixa || consult.complaint}>
                          {consult.patient?.queixa || consult.complaint}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {consult.report?.diagnoses?.[0]?.name || consult.diagnosis || 'N/A'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
