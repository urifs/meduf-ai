import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Activity, 
  Shield, 
  Search, 
  RefreshCw, 
  Trash2, 
  Ban, 
  Unlock, 
  MoreHorizontal,
  FileText,
  AlertCircle,
  Database
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
import api from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Admin = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');
  
  const [users, setUsers] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // --- Authentication Check ---
  useEffect(() => {
    if (userRole !== 'ADMIN') {
      toast.error("Acesso negado. Área restrita para administradores.");
      navigate('/'); 
    } else {
      fetchData();
    }
  }, [userRole, navigate]);

  // --- Data Fetching ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch Users and Consultations in parallel
      const [usersRes, consultsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/consultations')
      ]);

      setUsers(usersRes.data);
      setConsultations(consultsRes.data);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error("Admin Fetch Error:", error);
      toast.error("Erro ao conectar com o banco de dados.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Actions ---
  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/status`);
      const newStatus = response.data.status;
      
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      toast.success(`Usuário ${newStatus === 'Bloqueado' ? 'bloqueado' : 'desbloqueado'} com sucesso.`);
    } catch (error) {
      toast.error("Falha ao atualizar status.");
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
      toast.success("Usuário e dados associados excluídos.");
    } catch (error) {
      toast.error("Falha ao excluir usuário.");
    }
  };

  // --- Helpers ---
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: ptBR });
    } catch (e) {
      return "Data Inválida";
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Stats Calculation ---
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'Ativo').length,
    totalConsultations: consultations.length,
  };

  if (userRole !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Painel Administrativo</h1>
            <p className="text-slate-500 mt-1">
              Gerenciamento do sistema e monitoramento de usuários.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden md:inline-block">
              Atualizado em: {format(lastUpdated, "HH:mm:ss")}
            </span>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
                <Users className="h-8 w-8 text-blue-100" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeUsers} ativos no momento
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Consultas Realizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.totalConsultations}</div>
                <Activity className="h-8 w-8 text-green-100" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Registradas no banco de dados
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status do Banco de Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-green-600">Online</div>
                <Database className="h-8 w-8 text-purple-100" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Conexão MongoDB estabelecida
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Users Table (Takes up 2/3 width on large screens) */}
          <div className="xl:col-span-2 space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gerenciar Usuários</CardTitle>
                  <CardDescription>Lista completa de contas criadas.</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar nome ou email..." 
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Usuário</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            Nenhum usuário encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{user.name}</span>
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={user.role === 'ADMIN' ? 'border-purple-200 bg-purple-50 text-purple-700' : 'border-slate-200 bg-slate-50 text-slate-700'}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={user.status === 'Ativo' ? 'bg-green-500' : 'bg-red-500'}>
                                {user.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDate(user.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Abrir menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleToggleStatus(user.id, user.status)}>
                                    {user.status === 'Ativo' ? (
                                      <><Ban className="mr-2 h-4 w-4" /> Bloquear Acesso</>
                                    ) : (
                                      <><Unlock className="mr-2 h-4 w-4" /> Desbloquear</>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                        <Trash2 className="mr-2 h-4 w-4" /> Excluir Conta
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir usuário permanentemente?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta ação não pode ser desfeita. Isso excluirá a conta de <b>{user.name}</b> e todo o histórico de consultas.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-red-600 hover:bg-red-700">
                                          Confirmar Exclusão
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity (Takes up 1/3 width) */}
          <div className="xl:col-span-1 space-y-4">
            <Card className="shadow-sm h-full">
              <CardHeader>
                <CardTitle>Últimas Consultas</CardTitle>
                <CardDescription>Atividade recente na plataforma.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {consultations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Nenhuma consulta registrada ainda.
                    </div>
                  ) : (
                    consultations.slice(0, 10).map((consult, i) => (
                      <div key={i} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                        <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mt-0.5">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {consult.diagnosis || "Análise Realizada"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Dr(a). {consult.doctor}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatDate(consult.date)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Admin;
