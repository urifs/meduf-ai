import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Activity, Database, ShieldAlert, Search, Lock, Shield, Ban, Trash2, Unlock } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

const Admin = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');

  // Helper to format date to Brazil/Brasilia time
  const getBrazilDate = (dateString) => {
    const date = dateString ? new Date(dateString) : new Date();
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Initial Mock Data
  const initialUsers = [
    { id: 999, name: localStorage.getItem('userName') || 'Usuário Atual', email: localStorage.getItem('userEmail') || 'atual@meduf.ai', role: 'Administrador (Você)', status: 'Online', joined: getBrazilDate() },
    { id: 1, name: "Dr. Silva", email: "silva@meduf.ai", role: "Admin", status: "Ativo", joined: "15/01/2025 09:30" },
    { id: 2, name: "Dra. Santos", email: "santos@hospital.com", role: "Médico", status: "Ativo", joined: "10/02/2025 14:15" },
    { id: 3, name: "Dr. Oliveira", email: "oliveira@clinica.com", role: "Médico", status: "Pendente", joined: "05/03/2025 11:45" },
    { id: 4, name: "Dr. Malicioso", email: "spam@fake.com", role: "Médico", status: "Bloqueado", joined: "01/03/2025 08:00" },
  ];

  const [users, setUsers] = useState(initialUsers);

  // Security Check
  useEffect(() => {
    if (userRole !== 'ADMIN') {
      navigate('/'); // Redirect non-admins to dashboard
    }
  }, [userRole, navigate]);

  if (userRole !== 'ADMIN') {
    return null; // Prevent flash of content
  }

  const handleToggleBlock = (userId) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        const newStatus = user.status === 'Bloqueado' ? 'Ativo' : 'Bloqueado';
        toast.success(`Usuário ${user.name} foi ${newStatus === 'Bloqueado' ? 'bloqueado' : 'desbloqueado'}.`);
        return { ...user, status: newStatus };
      }
      return user;
    }));
  };

  const handleDelete = (userId) => {
    setUsers(users.filter(user => user.id !== userId));
    toast.success("Usuário excluído com sucesso.");
  };

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
              <p className="text-xs text-muted-foreground">Atualizado agora</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Análises Realizadas</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">+15% em relação ao mês anterior</p>
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
                  <TableHead>Data de Cadastro (Brasília)</TableHead>
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
                    <TableCell>{user.joined}</TableCell>
                    <TableCell className="text-right">
                      {user.id !== 999 && ( // Prevent actions on self
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
      </main>
    </div>
  );
};

export default Admin;
