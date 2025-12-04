import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, Shield, FileText, Database, TrendingUp } from 'lucide-react';

const UserStatsCards = ({ stats, onlineCount, monthlyUsage }) => {
  return (
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
  );
};

export default UserStatsCards;
