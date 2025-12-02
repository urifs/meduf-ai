import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus } from 'lucide-react';
import { CustomLoader } from '@/components/ui/custom-loader';
import api from '@/lib/api';

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/register', {
        email: formData.email,
        name: formData.name,
        password: formData.password
      });

      const { access_token, user_name, user_role, expiration_date } = response.data;

      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('token', access_token);
      localStorage.setItem('userName', user_name);
      localStorage.setItem('userRole', user_role);
      if (expiration_date) {
        localStorage.setItem('userExpiration', expiration_date);
      }

      toast.success("Conta criada com sucesso! Válida por 30 dias.");
      navigate('/');

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || "Erro ao criar conta. Tente novamente.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Crie sua conta" 
      subtitle="Junte-se a milhares de médicos utilizando IA na prática clínica."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input 
            id="name" 
            placeholder="João Silva" 
            value={formData.name}
            onChange={handleChange}
            required
            className="h-11"
          />
        </div>

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
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
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
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              placeholder="••••••••" 
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="h-11"
            />
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Ao criar uma conta, você concorda com nossos <a href="#" className="underline">Termos de Serviço</a> e <a href="#" className="underline">Política de Privacidade</a>.
        </div>

        <Button 
          type="submit" 
          className="w-full h-11 text-base mt-2" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <CustomLoader size="sm" className="mr-2" /> Criando conta...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" /> Criar Conta Gratuita
            </>
          )}
        </Button>

        <div className="text-center text-sm text-muted-foreground mt-4">
          Já possui uma conta?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Faça login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Register;
