import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Activity, Stethoscope, User, FileText, ClipboardList, Pill, AlertCircle, CheckCircle2, BrainCircuit, LogOut, Shield, Menu, Clock, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { differenceInDays } from 'date-fns';

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = localStorage.getItem('userName') || 'Dr. Silva';
  const userRole = localStorage.getItem('userRole');
  const userExpiration = localStorage.getItem('userExpiration');
  const [daysRemaining, setDaysRemaining] = useState(null);

  useEffect(() => {
    if (userExpiration) {
      const days = differenceInDays(new Date(userExpiration), new Date());
      setDaysRemaining(days);
    }
  }, [userExpiration]);

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logout realizado com sucesso");
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:bg-slate-950/80">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo Section */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Meduf <span className="text-primary">Ai</span>
          </span>
        </div>

        {/* Hamburger Menu */}
        <Sheet>
          <SheetTrigger asChild>
             <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
             </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                Menu de Navegação
              </SheetTitle>
            </SheetHeader>
            
            <div className="flex flex-col gap-6 mt-8">
              {/* User Profile Section in Menu */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{userName}</span>
                  <span className="text-xs text-muted-foreground">{userRole === 'ADMIN' ? 'Administrador' : 'Médico'}</span>
                </div>
              </div>

              {/* Expiration Counter */}
              {daysRemaining !== null && userRole !== 'ADMIN' && (
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${daysRemaining < 5 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                  <Clock className="h-5 w-5" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{daysRemaining} dias restantes</span>
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
                  <Link 
                    to="/admin" 
                    className={`flex items-center gap-2 px-4 py-3 rounded-md transition-colors ${isActive('/admin') ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground/80'}`}
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </Link>
                )}
              </nav>

              {/* Logout Button */}
              <div className="mt-auto pt-4 border-t">
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
    </header>
  );
};
