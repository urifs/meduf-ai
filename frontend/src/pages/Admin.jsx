import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Database,
  UserPlus,
  CalendarClock,
  DollarSign,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { CustomLoader } from '@/components/ui/custom-loader';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from '@/lib/api';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ClinicalReport } from '@/components/ClinicalReport';

const Admin = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');
  
  const [users, setUsers] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Usage & Balance State
  const [balance, setBalance] = useState(null);
  const [monthlyUsage, setMonthlyUsage] = useState(null);
  
  // New User Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', days_valid: 30, role: 'USER' });

  // Expiration Update State
  const [isExpirationOpen, setIsExpirationOpen] = useState(false);
  const [isUpdatingExpiration, setIsUpdatingExpiration] = useState(false);
  const [selectedUserForExpiration, setSelectedUserForExpiration] = useState(null);
  const [newDaysValid, setNewDaysValid] = useState(30);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Consultation View State
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  
  // Deleted Users State
  const [deletedUsers, setDeletedUsers] = useState([]);

  // --- Authentication Check & Polling ---
  useEffect(() => {
    if (userRole !== 'ADMIN') {
      toast.error("Acesso negado. Área restrita para administradores.");
      navigate('/'); 
    } else {
      fetchData();
      // Auto-refresh every 3 seconds for real-time updates
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [userRole, navigate]);

  // --- Data Fetching ---
  const fetchData = async () => {
    if (users.length === 0) setIsLoading(true);
    
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const [usersRes, consultsRes, onlineRes, balanceRes, monthlyRes, feedbacksRes] = await Promise.all([
        api.get(`/admin/users?t=${timestamp}`),
        api.get(`/admin/consultations?t=${timestamp}`),
        api.get(`/admin/stats/online?t=${timestamp}`),
        api.get(`/admin/balance?t=${timestamp}`),
        api.get(`/admin/usage-stats/monthly?t=${timestamp}`),
        api.get(`/feedbacks?t=${timestamp}`)
      ]);

      // DIRECT MAPPING: No mock data merging. What you see is what is in the DB.
      // Ensure we map _id to id for frontend consistency
      const mappedUsers = usersRes.data.map(u => ({
        ...u,
        id: u._id || u.id
      }));
      setUsers(mappedUsers);
      
      const realConsultations = consultsRes.data.map(c => ({
        ...c,
        id: c._id || c.id,
        date: c.date || c.created_at 
      }));
      setConsultations(realConsultations);
      
      setOnlineCount(onlineRes.data.online_count);
      
      // Set balance and monthly usage
      setBalance(balanceRes.data);
      setMonthlyUsage(monthlyRes.data);
      
      // Set feedbacks and calculate stats
      const feedbackData = feedbacksRes.data || [];
      setFeedbacks(feedbackData);
      
      const helpful = feedbackData.filter(f => f.is_helpful).length;
      const notHelpful = feedbackData.filter(f => !f.is_helpful).length;
      setFeedbackStats({
        helpful,
        notHelpful,
        total: feedbackData.length
      });
      
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error("Admin Fetch Error:", error);
      if (users.length === 0) {
        toast.error("Erro ao carregar dados. Verifique sua conexão.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Actions ---
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.post('/admin/users', newUser);
      toast.success("Usuário criado com sucesso!");
      setIsCreateOpen(false);
      setNewUser({ name: '', email: '', password: '', days_valid: 30, role: 'USER' });
      fetchData(); // Refresh list immediately
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao criar usuário.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateExpiration = async () => {
    if (!selectedUserForExpiration) return;
    setIsUpdatingExpiration(true);
    try {
      await api.patch(`/admin/users/${selectedUserForExpiration.id}`, {
        days_valid: parseInt(newDaysValid)
      });
      toast.success("Validade da conta atualizada!");
      setIsExpirationOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar validade.");
    } finally {
      setIsUpdatingExpiration(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/status`);
      const newStatus = response.data.status;
      
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      toast.success(`Status atualizado para: ${newStatus}`);
    } catch (error) {
      toast.error("Falha ao atualizar status.");
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
      toast.success("Usuário excluído permanentemente.");
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

  const getDaysRemaining = (expirationDate) => {
    if (!expirationDate) return "∞";
    try {
      const days = differenceInDays(new Date(expirationDate), new Date());
      if (days < 0) return "Expirado";
      return `${days} dias`;
    } catch (e) {
      return "-";
    }
  };

  const getDaysColor = (expirationDate) => {
    if (!expirationDate) return "text-slate-500";
    const days = differenceInDays(new Date(expirationDate), new Date());
    if (days < 0) return "text-red-600 font-bold";
    if (days < 5) return "text-orange-600 font-bold";
    return "text-green-600";
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
    totalAdmins: users.filter(u => u.role === 'ADMIN').length,
    totalNormalUsers: users.filter(u => u.role === 'USER').length,
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
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <UserPlus className="h-4 w-4 mr-2" /> Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Conta</DialogTitle>
                  <DialogDescription>
                    Adicione um novo usuário ao sistema. Defina o período de acesso e permissões.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input 
                      id="name" 
                      placeholder="João Silva" 
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="medico@hospital.com" 
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value.toLowerCase().trim()})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha Provisória</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="******" 
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Tipo de Conta</Label>
                      <Select 
                        value={newUser.role} 
                        onValueChange={(value) => setNewUser({...newUser, role: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">Usuário (Médico)</SelectItem>
                          <SelectItem value="ADMIN">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="days_valid">Dias de Acesso</Label>
                      <Input 
                        id="days_valid" 
                        type="text" 
                        placeholder="30" 
                        value={newUser.days_valid}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          setNewUser({...newUser, days_valid: value ? parseInt(value) : ''});
                        }}
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? <CustomLoader size="sm" /> : "Criar Conta"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
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

          <Card className="border-l-4 border-l-cyan-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Usuários Online</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{onlineCount}</div>
                <Activity className="h-8 w-8 text-cyan-100" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Nos últimos 5 minutos
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-indigo-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Administradores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.totalAdmins}</div>
                <Shield className="h-8 w-8 text-indigo-100" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Contas com acesso total
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
                <FileText className="h-8 w-8 text-green-100" />
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

          <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-lg transition-shadow group">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Gasto deste Mês
                <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">Em tempo real</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-orange-600">
                  ${monthlyUsage ? monthlyUsage.total_cost_usd.toFixed(4) : '0.00'}
                </div>
                <TrendingUp className="h-8 w-8 text-orange-100 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {monthlyUsage ? `${monthlyUsage.total_consultations} consultas (${monthlyUsage.total_tokens.toLocaleString()} tokens)` : 'Nenhuma consulta'}
              </p>
              <p className="text-xs text-blue-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Valores exatos, atualizados a cada 3 segundos
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
                <div className="rounded-md border max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-50 z-10">
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Validade</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            Nenhum usuário encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <button 
                                  onClick={() => {
                                    setSelectedUserProfile(user);
                                    setIsProfileOpen(true);
                                  }}
                                  className="font-medium text-primary hover:underline cursor-pointer text-left"
                                >
                                  {user.name}
                                </button>
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
                            <TableCell>
                              <span className={`text-xs ${getDaysColor(user.expiration_date)}`}>
                                {getDaysRemaining(user.expiration_date)}
                              </span>
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
                                  <DropdownMenuItem onSelect={(e) => {
                                    e.preventDefault();
                                    setSelectedUserForExpiration(user);
                                    setIsExpirationOpen(true);
                                  }}>
                                    <CalendarClock className="mr-2 h-4 w-4" /> Alterar Validade
                                  </DropdownMenuItem>
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

          {/* Right Column (Takes up 1/3 width) */}
          <div className="xl:col-span-1 space-y-8">
            
            {/* Admins List Card */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Administradores</CardTitle>
                <CardDescription>Contas com acesso total ao sistema.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.filter(u => u.role === 'ADMIN').length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Nenhum administrador encontrado.
                    </div>
                  ) : (
                    users.filter(u => u.role === 'ADMIN').map((admin) => (
                      <div key={admin.id} className="flex items-center justify-between pb-2 border-b last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <Shield className="h-4 w-4" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium leading-none">{admin.name}</p>
                            <p className="text-xs text-muted-foreground">{admin.email}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-100">
                          Admin
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Card */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Últimas Consultas</CardTitle>
                <CardDescription>Atividade recente na plataforma.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                  {consultations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Nenhuma consulta registrada ainda.
                    </div>
                  ) : (
                    consultations.map((consult, i) => (
                      <div 
                        key={i} 
                        className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0 cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors"
                        onClick={() => {
                          setSelectedConsultation(consult);
                          setIsConsultationOpen(true);
                        }}
                      >
                        <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mt-0.5">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="space-y-1 flex-1">
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Feedbacks Section */}
        <div className="mt-12">
          <Card className="shadow-lg border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <MessageSquare className="h-6 w-6" />
                    Feedbacks dos Usuários
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Avaliações sobre as análises realizadas pela IA
                  </CardDescription>
                </div>
                {feedbackStats && (
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{feedbackStats.helpful}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        Útil
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">{feedbackStats.notHelpful}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <ThumbsDown className="h-3 w-3" />
                        Não útil
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {feedbackStats.total > 0 
                          ? Math.round((feedbackStats.helpful / feedbackStats.total) * 100) 
                          : 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">Taxa de satisfação</div>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Gráfico de Pizza */}
              {feedbackStats && feedbackStats.total > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Distribuição de Avaliações</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Útil', value: feedbackStats.helpful, color: '#22c55e' },
                          { name: 'Não útil', value: feedbackStats.notHelpful, color: '#ef4444' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Útil', value: feedbackStats.helpful, color: '#22c55e' },
                          { name: 'Não útil', value: feedbackStats.notHelpful, color: '#ef4444' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              <div className="rounded-md border max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Usuário</TableHead>
                      <TableHead>Tipo de Análise</TableHead>
                      <TableHead className="w-[120px] text-center">Feedback</TableHead>
                      <TableHead className="w-[150px]">Data</TableHead>
                      <TableHead className="w-[100px] text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedbacks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhum feedback registrado ainda.
                        </TableCell>
                      </TableRow>
                    ) : (
                      feedbacks.map((feedback, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{feedback.user_email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {feedback.analysis_type === 'diagnosis' && 'Diagnóstico'}
                              {feedback.analysis_type === 'simple-diagnosis' && 'Diagnóstico Simples'}
                              {feedback.analysis_type === 'drug-interaction' && 'Interação'}
                              {feedback.analysis_type === 'medication-guide' && 'Guia Terapêutico'}
                              {feedback.analysis_type === 'toxicology' && 'Toxicologia'}
                              {feedback.analysis_type === 'exam-reader' && 'Leitor de Exames'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {feedback.is_helpful ? (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" />
                                Útil
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 flex items-center gap-1">
                                <ThumbsDown className="h-3 w-3" />
                                Não útil
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(feedback.timestamp)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Set feedback analysis data to show in a dialog
                                setSelectedConsultation({
                                  doctor: feedback.user_email,
                                  date: feedback.timestamp,
                                  patient: {},
                                  report: feedback.analysis_data
                                });
                                setIsConsultationOpen(true);
                              }}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
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

        {/* Expiration Dialog */}
        <Dialog open={isExpirationOpen} onOpenChange={setIsExpirationOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Validade da Conta</DialogTitle>
              <DialogDescription>
                Defina quantos dias de acesso o usuário <b>{selectedUserForExpiration?.name}</b> terá a partir de hoje.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="new_days">Dias de Acesso (a partir de hoje)</Label>
              <Input 
                id="new_days" 
                type="text" 
                placeholder="Ex: 30, 60, 365..."
                value={newDaysValid}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setNewDaysValid(value);
                }}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateExpiration} disabled={isUpdatingExpiration}>
                {isUpdatingExpiration ? <CustomLoader size="sm" /> : "Salvar Alteração"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Consultation Details Dialog */}
        <Dialog open={isConsultationOpen} onOpenChange={setIsConsultationOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Consulta</DialogTitle>
              <DialogDescription>
                Realizada por Dr(a). {selectedConsultation?.doctor} em {formatDate(selectedConsultation?.date)}
              </DialogDescription>
            </DialogHeader>
            
            {selectedConsultation && (
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
            )}
          </DialogContent>
        </Dialog>

        {/* User Profile Dialog */}
        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Perfil do Usuário</DialogTitle>
              <DialogDescription>
                Informações detalhadas da conta
              </DialogDescription>
            </DialogHeader>
            
            {selectedUserProfile && (
              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Nome Completo</Label>
                    <p className="text-sm font-medium">{selectedUserProfile.name}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="text-sm">{selectedUserProfile.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Função</Label>
                    <Badge variant="outline" className={selectedUserProfile.role === 'ADMIN' ? 'border-purple-200 bg-purple-50 text-purple-700' : 'border-slate-200 bg-slate-50 text-slate-700'}>
                      {selectedUserProfile.role}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge className={selectedUserProfile.status === 'Ativo' ? 'bg-green-500' : 'bg-red-500'}>
                      {selectedUserProfile.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Data de Criação</Label>
                    <p className="text-sm">{formatDate(selectedUserProfile.created_at)}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Validade da Conta</Label>
                    <p className={`text-sm ${getDaysColor(selectedUserProfile.expiration_date)}`}>
                      {getDaysRemaining(selectedUserProfile.expiration_date)}
                    </p>
                  </div>
                </div>
                
                {selectedUserProfile.expiration_date && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Data de Expiração</Label>
                    <p className="text-sm">{formatDate(selectedUserProfile.expiration_date)}</p>
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedUserForExpiration(selectedUserProfile);
                        setIsProfileOpen(false);
                        setIsExpirationOpen(true);
                      }}
                    >
                      <CalendarClock className="h-4 w-4 mr-2" />
                      Alterar Validade
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleStatus(selectedUserProfile.id, selectedUserProfile.status)}
                    >
                      {selectedUserProfile.status === 'Ativo' ? (
                        <><Ban className="h-4 w-4 mr-2" /> Bloquear</>
                      ) : (
                        <><Unlock className="h-4 w-4 mr-2" /> Desbloquear</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
};

export default Admin;
