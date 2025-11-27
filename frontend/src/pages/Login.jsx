import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, LogIn } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock Authentication
    setTimeout(() => {
      if (formData.email && formData.password) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', formData.email);
        toast.success("Login realizado com sucesso!");
        navigate('/');
      } else {
        toast.error("Por favor, preencha todos os campos.");
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <AuthLayout 
      title="Bem-vindo de volta" 
      subtitle="Acesse sua conta para continuar suas análises clínicas."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email Profissional</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="doutor@hospital.com" 
            value={formData.email}
            onChange={handleChange}
            required
            className="h-11"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link to="#" className="text-sm font-medium text-primary hover:underline">
              Esqueceu a senha?
            </Link>
          </div>
          <Input 
            id="password" 
            type="password" 
            placeholder="••••••••" 
            value={formData.password}
            onChange={handleChange}
            required
            className="h-11"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="remember" />
          <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
            Lembrar deste dispositivo por 30 dias
          </Label>
        </div>

        <Button 
          type="submit" 
          className="w-full h-11 text-base" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" /> Entrar na Plataforma
            </>
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Ou continue com
            </span>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Não tem uma conta?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Cadastre-se gratuitamente
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;
