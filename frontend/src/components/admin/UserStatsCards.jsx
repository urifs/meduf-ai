import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, Shield, FileText, UserX, TrendingUp, MessageSquare } from 'lucide-react';

const UserStatsCards = ({ stats, onlineCount, chatStats }) => {
  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
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

      <Card className="border-l-4 border-l-red-500 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Contas Desativadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-red-600">{stats.totalDeleted}</div>
            <UserX className="h-8 w-8 text-red-100" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Usuários excluídos ou expirados
          </p>
        </CardContent>
      </Card>
    </div>

    {/* Chat Stats - Separate row */}
    {chatStats && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversas com IA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-purple-600">{chatStats.total_conversations}</div>
              <MessageSquare className="h-8 w-8 text-purple-100" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de conversas realizadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Usuários Ativos no Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-violet-600">{chatStats.unique_users}</div>
              <Users className="h-8 w-8 text-violet-100" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Usuários que usaram o chat
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-pink-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Últimas 24h</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-pink-600">{chatStats.last_24h}</div>
              <Activity className="h-8 w-8 text-pink-100" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Conversas nas últimas 24 horas
            </p>
          </CardContent>
        </Card>
      </div>
    )}
    </>
  );
};

export default UserStatsCards;
