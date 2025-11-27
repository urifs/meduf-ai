import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Activity, Stethoscope, User, FileText, ClipboardList, Pill, AlertCircle, CheckCircle2, BrainCircuit, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = localStorage.getItem('userName') || 'Dr. Silva';

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    toast.success("Logout realizado com sucesso");
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:bg-slate-950/80">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Meduf <span className="text-primary">Ai</span>
          </span>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link 
            to="/" 
            className={`transition-colors hover:text-foreground hidden md:block ${isActive('/') ? 'text-foreground font-bold' : 'text-foreground/60'}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/history" 
            className={`transition-colors hover:text-foreground hidden md:block ${isActive('/history') ? 'text-foreground font-bold' : 'text-foreground/60'}`}
          >
            Histórico
          </Link>
          
          <div className="flex items-center gap-4 ml-4 pl-4 border-l">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary-foreground">
                <User className="h-4 w-4 text-secondary" />
              </div>
              <span className="hidden md:inline-block text-xs text-muted-foreground">{userName}</span>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
};
