import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Activity, Database, ShieldAlert, Search, Lock, Shield } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Admin = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');

  // Security Check
  useEffect(() => {
    if (userRole !== 'ADMIN') {
      navigate('/'); // Redirect non-admins to dashboard
    }
  }, [userRole, navigate]);

  if (userRole !== 'ADMIN') {
    return null; // Prevent flash of content
  }

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

  // Mock data to simulate a database view - Updated to 2025
  const mockUsers = [
    { id: 1, name: "Dr. Silva", email: "silva@meduf.ai", role: "Admin", status: "Ativo", joined: "15/01/2025 09:30" },
    { id: 2, name: "Dra. Santos", email: "santos@hospital.com", role: "Médico", status: "Ativo", joined: "10/02/2025 14:15" },
    { id: 3, name: "Dr. Oliveira", email: "oliveira@clinica.com", role: "Médico", status: "Pendente", joined: "05/03/2025 11:45" },
  ];

  // Get current user from local storage to add to the list
  const currentUser = {
    id: 999,
    name: localStorage.getItem('userName') || 'Usuário Atual',
    email: localStorage.getItem('userEmail') || 'atual@meduf.ai',
    role: 'Administrador (Você)',
    status: 'Online',
    joined: getBrazilDate() // Current date in Brasilia time
  };

  const allUsers = [currentUser, ...mockUsers];

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
              <div className="text-2xl font-bold">{allUsers.length}</div>
              <p className="text-xs text-muted-foreground">+2 novos esta semana</p>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'Ativo' || user.status === 'Online' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.joined}</TableCell>
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
