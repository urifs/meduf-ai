import React, { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Activity, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/lib/api';

const OnlineUsersSection = memo(({ onUserClick }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOnlineUsers = async () => {
    try {
      const response = await api.get('/admin/online-users');
      setOnlineUsers(response.data || []);
    } catch (error) {
      console.error("Error fetching online users:", error);
      setOnlineUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOnlineUsers();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchOnlineUsers();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getAvatarUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${process.env.REACT_APP_BACKEND_URL}${url}`;
  };

  const formatLastActivity = (dateString) => {
    if (!dateString) return "Agora";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      
      if (diffSecs < 60) return "Agora mesmo";
      if (diffMins === 1) return "1 minuto atrás";
      if (diffMins < 60) return `${diffMins} minutos atrás`;
      
      return format(date, "HH:mm", { locale: ptBR });
    } catch (error) {
      return "Agora";
    }
  };

  return (
    <Card className="border-green-200 dark:border-green-900/30">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-b border-green-100 dark:border-green-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center relative">
              <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </div>
            <div>
              <CardTitle className="text-xl">Usuários Online</CardTitle>
              <CardDescription>
                {onlineUsers.length} {onlineUsers.length === 1 ? 'usuário ativo' : 'usuários ativos'} nos últimos 5 minutos
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Atualizado em tempo real
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando usuários online...</p>
          </div>
        ) : onlineUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-slate-100 dark:bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-muted-foreground">Nenhum usuário online no momento</p>
          </div>
        ) : (
          <div className="space-y-3">
            {onlineUsers.map((user) => (
              <div 
                key={user.id || user.email}
                onClick={() => onUserClick && onUserClick(user)}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50/30 dark:hover:bg-green-950/10 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative">
                    <Avatar className="h-10 w-10 border-2 border-green-400 dark:border-green-600">
                      {user.avatar_url ? (
                        <AvatarImage src={getAvatarUrl(user.avatar_url)} alt={user.name} />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-green-400 to-emerald-500 text-white">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white dark:border-slate-900"></span>
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      {formatLastActivity(user.last_activity)}
                    </div>
                    {user.role === 'ADMIN' && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OnlineUsersSection;
