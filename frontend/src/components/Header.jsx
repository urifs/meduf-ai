import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Activity, Stethoscope, User, FileText, ClipboardList, Pill, AlertCircle, CheckCircle2, BrainCircuit, LogOut, Shield, Menu, Clock, Settings, Database, Bell, HelpCircle, Moon, Sun } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { differenceInDays, intervalToDuration } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/contexts/ThemeContext";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, isDark } = useTheme();
  const userName = localStorage.getItem('userName') || 'Dr. Silva';
  const userRole = localStorage.getItem('userRole');
  const userExpiration = localStorage.getItem('userExpiration');
  const userAvatar = localStorage.getItem('userAvatar');
  const [timeLeft, setTimeLeft] = useState(null);
  const [outbreaks, setOutbreaks] = useState({
    brazil: [],
    world: []
  });
  const [alertsLoading, setAlertsLoading] = useState(true);

  // Helper to resolve avatar URL
  const getAvatarUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${process.env.REACT_APP_BACKEND_URL}${url}`;
  };

  // Fetch real epidemiological alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/epidemiological-alerts`);
        if (response.ok) {
          const data = await response.json();
          setOutbreaks(data.alerts);
          console.log('✅ Alertas epidemiológicos atualizados:', data.cache_info);
        }
      } catch (error) {
        console.error('Erro ao buscar alertas:', error);
        // Fallback to basic data
        setOutbreaks({
          brazil: [
            { state: "São Paulo", disease: "Dengue", level: "Alto", date: "Hoje" },
            { state: "Rio de Janeiro", disease: "Dengue", level: "Médio", date: "Hoje" }
          ],
          world: [
            { country: "Global", disease: "Monitoramento Ativo", level: "Médio", date: "Hoje" }
          ]
        });
      } finally {
        setAlertsLoading(false);
      }
    };

    fetchAlerts();
    
    // Update alerts every hour
    const interval = setInterval(fetchAlerts, 60 * 60 * 1000); // 1 hour
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (userExpiration) {
      const now = new Date();
      const end = new Date(userExpiration);
      
      if (end > now) {
        const duration = intervalToDuration({ start: now, end: end });
        setTimeLeft(duration);
      } else {
        setTimeLeft({ days: 0, hours: 0 });
      }
    }
  }, [userExpiration]);

  const formatTimeLeft = (duration) => {
    if (!duration) return "";
    const { days, hours } = duration;
    if (days > 0) return `${days} dias e ${hours} horas restantes`;
    if (hours > 0) return `${hours} horas restantes`;
    return "Menos de 1 hora restante";
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logout realizado com sucesso");
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-white/90 via-blue-50/90 to-white/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70 dark:from-slate-950/90 dark:via-slate-900/90 dark:to-slate-950/90 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo Section */}
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Meduf <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Ai</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Outbreak Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-600 animate-pulse" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b bg-slate-50">
                <h4 className="font-semibold leading-none flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Alertas Epidemiológicos
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {alertsLoading ? 'Carregando...' : 'Atualização automática a cada hora'}
                </p>
              </div>
              <ScrollArea className="h-[300px]">
                <div className="p-4 space-y-4">
                  {/* Brazil Section */}
                  <div>
                    <h5 className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                      🇧🇷 Brasil (Estados)
                    </h5>
                    <div className="space-y-2">
                      {outbreaks.brazil.map((item, i) => (
                        <div key={i} className="flex items-start justify-between text-sm border-b pb-2 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium text-slate-800">{item.disease}</p>
                            <p className="text-xs text-slate-500">{item.state}</p>
                          </div>
                          <Badge variant="outline" className={
                            item.level === "Alto" ? "text-red-600 border-red-200 bg-red-50" :
                            item.level === "Médio" ? "text-orange-600 border-orange-200 bg-orange-50" :
                            "text-blue-600 border-blue-200 bg-blue-50"
                          }>
                            {item.level}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* World Section */}
                  <div>
                    <h5 className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                      🌍 Mundo
                    </h5>
                    <div className="space-y-2">
                      {outbreaks.world.map((item, i) => (
                        <div key={i} className="flex items-start justify-between text-sm border-b pb-2 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium text-slate-800">{item.disease}</p>
                            <p className="text-xs text-slate-500">{item.country}</p>
                          </div>
                          <Badge variant="outline" className={
                            item.level === "Alto" ? "text-red-600 border-red-200 bg-red-50" :
                            item.level === "Médio" ? "text-orange-600 border-orange-200 bg-orange-50" :
                            "text-blue-600 border-blue-200 bg-blue-50"
                          }>
                            {item.level}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Hamburger Menu */}
          <Sheet>
            <SheetTrigger asChild>
               <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
               </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0 flex flex-col">
              <SheetHeader className="px-6 pt-6 pb-4">
                <SheetTitle className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                  Menu de Navegação
                </SheetTitle>
              </SheetHeader>
              
              <ScrollArea className="flex-1 px-6">
                <div className="flex flex-col gap-6 pb-6">
                {/* User Profile Section in Menu */}
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Avatar className="h-10 w-10 border border-muted">
                    <AvatarImage src={getAvatarUrl(userAvatar)} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{userName}</span>
                    <span className="text-xs text-muted-foreground">{userRole === 'ADMIN' ? 'Administrador' : 'Médico'}</span>
                  </div>
                </div>

                {/* Expiration Counter */}
                {timeLeft !== null && userRole !== 'ADMIN' && (
                  <div className={`flex items-center gap-3 p-3 rounded-lg border ${timeLeft.days < 5 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                    <Clock className="h-5 w-5" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{formatTimeLeft(timeLeft)}</span>
                      <span className="text-xs opacity-80">Sua conta expira em breve</span>
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <nav className="flex flex-col gap-2">
                  <Link 
                    to="/" 
                    className={`flex items-center gap-2 px-4 py-3 rounded-md transition-colors ${isActive('/') && location.pathname === '/' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground/80'}`}
                  >
                    <Activity className="h-4 w-4" />
                    Início
                  </Link>
                  
                  <Link 
                    to="/history" 
                    className={`flex items-center gap-2 px-4 py-3 rounded-md transition-colors ${isActive('/history') ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground/80'}`}
                  >
                    <ClipboardList className="h-4 w-4" />
                    Histórico
                  </Link>

                  <Link 
                    to="/profile" 
                    className={`flex items-center gap-2 px-4 py-3 rounded-md transition-colors ${isActive('/profile') ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground/80'}`}
                  >
                    <Settings className="h-4 w-4" />
                    Meu Perfil
                  </Link>
                  
                  {userRole === 'ADMIN' && (
                    <>
                      <Link 
                        to="/admin" 
                        className={`flex items-center gap-2 px-4 py-3 rounded-md transition-colors ${isActive('/admin') ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground/80'}`}
                      >
                        <Shield className="h-4 w-4" />
                        Admin
                      </Link>
                      <Link 
                        to="/database" 
                        className={`flex items-center gap-2 px-4 py-3 rounded-md transition-colors ${isActive('/database') ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground/80'}`}
                      >
                        <Database className="h-4 w-4" />
                        Banco de Dados
                      </Link>
                    </>
                  )}
                </nav>

                {/* Theme Toggle */}
                <div className="px-4 py-2">
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 w-full px-4 py-3 rounded-md transition-colors hover:bg-muted text-foreground/80"
                  >
                    {isDark ? (
                      <>
                        <Sun className="h-4 w-4" />
                        Modo Claro
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4" />
                        Modo Escuro
                      </>
                    )}
                  </button>
                </div>

                {/* Support Button */}
                <div className="mt-auto pt-4 border-t space-y-2">
                  <a 
                    href="https://api.whatsapp.com/send/?phone=551152868823&text&type=phone_number&app_absent=0" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 rounded-md transition-colors hover:bg-green-50 text-green-700 font-medium"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Suporte (WhatsApp)
                  </a>

                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Sair da Conta
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
