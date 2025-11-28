import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, LogIn, ExternalLink } from 'lucide-react';
import api from '@/lib/api';

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '', 
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use FormData for OAuth2PasswordRequestForm expected by FastAPI
      const params = new URLSearchParams();
      params.append('username', formData.identifier);
      params.append('password', formData.password);

      const response = await api.post('/auth/login', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token, user_name, user_role, expiration_date } = response.data;

      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('token', access_token);
      localStorage.setItem('userName', user_name);
      localStorage.setItem('userRole', user_role);
      if (expiration_date) {
        localStorage.setItem('userExpiration', expiration_date);
      }
      
      toast.success(`Bem-vindo, ${user_name}!`);
      
      if (user_role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || "Erro ao realizar login. Verifique suas credenciais.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Bem-vindo de volta" 
      subtitle="Acesse sua conta para continuar suas análises clínicas."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="identifier">Email ou Usuário</Label>
          <Input 
            id="identifier" 
            type="text" 
            placeholder="email@exemplo.com ou usuário" 
            value={formData.identifier}
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

        <div className="space-y-3">
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

          <Button 
            type="button"
            variant="outline"
            className="w-full h-11 text-base border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800"
            onClick={() => window.open('https://api.whatsapp.com/send/?phone=551152868823&text&type=phone_number&app_absent=0', '_blank')}
          >
            <ExternalLink className="mr-2 h-4 w-4" /> Adquirir Acesso
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Acesso Restrito
            </span>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Novas contas são criadas apenas por administradores.
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;
