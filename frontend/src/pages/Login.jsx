import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { LogIn, ExternalLink } from 'lucide-react';
import api from '@/lib/api';
import { CustomLoader } from '@/components/ui/custom-loader';

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isCardFading, setIsCardFading] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '', 
    password: ''
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    let processedValue = value;
    
    // Para o campo identifier (email/usuário)
    if (id === 'identifier') {
      // Remove espaços e converte para minúsculas
      processedValue = value.replace(/\s/g, '').toLowerCase();
    }
    
    setFormData({
      ...formData,
      [id]: processedValue
    });
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

      const { access_token, user_name, user_role, expiration_date, avatar_url } = response.data;

      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('token', access_token);
      localStorage.setItem('userName', user_name);
      localStorage.setItem('userRole', user_role);
      if (expiration_date) {
        localStorage.setItem('userExpiration', expiration_date);
      }
      if (avatar_url) {
        localStorage.setItem('userAvatar', avatar_url);
      }
      
      toast.success(`Bem-vindo, ${user_name}!`);
      
      // Sequência de animações:
      // 1. Fade out da caixa de login (400ms)
      setIsCardFading(true);
      
      setTimeout(() => {
        // 2. Zoom da logo (800ms)
        setIsZooming(true);
        
        setTimeout(() => {
          // 3. Navegar para plataforma
          if (user_role === 'ADMIN') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }, 800); // Duração do zoom
      }, 400); // Duração do fade da caixa

    } catch (error) {
      console.error(error);
      
      // Specific Error Handling
      if (error.response) {
        const status = error.response.status;
        const detail = error.response.data?.detail;

        if (status === 404) {
          toast.error("Usuário não encontrado. Verifique o email ou nome de usuário.");
        } else if (status === 401) {
          toast.error("Senha incorreta. Tente novamente.");
        } else if (status === 403) {
          // Tratamento para contas excluídas ou expiradas
          if (detail === "Account deleted" || detail?.includes("excluída") || detail?.includes("expirou")) {
            toast.error("Sua conta está inativa ou expirou. Para renovar seu acesso, clique no botão 'Adquirir Acesso' abaixo.", {
              duration: 10000,
              action: {
                label: 'Adquirir Acesso',
                onClick: () => window.open('https://api.whatsapp.com/send/?phone=551152868823&text=Gostaria%20de%20renovar%20meu%20acesso%20ao%20Meduf%20AI', '_blank')
              }
            });
          } else {
            toast.error(detail || "Acesso negado.");
          }
        } else if (status === 400 && detail === "User account is blocked") {
          toast.error("Esta conta foi bloqueada pelo administrador.");
        } else {
          toast.error("Erro ao realizar login. Tente novamente mais tarde.");
        }
      } else {
        toast.error("Erro de conexão. Verifique sua internet.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Bem-vindo" 
      subtitle="Acesse sua conta para continuar suas análises clínicas."
      isCardFading={isCardFading}
      isZooming={isZooming}
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
            <a 
              href="https://api.whatsapp.com/send/?phone=551152868823&text&type=phone_number&app_absent=0" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              Esqueceu a senha?
            </a>
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
                <CustomLoader size="sm" className="mr-2" /> Entrando...
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
            className="w-full h-11 text-base border-blue-400 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
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
      <Toaster />
    </AuthLayout>
  );
};

export default Login;
