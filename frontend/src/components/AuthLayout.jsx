import React from 'react';
import { BrainCircuit } from 'lucide-react';

export const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      {/* Left Side - Image & Branding */}
      <div className="hidden lg:flex flex-col relative bg-slate-900 text-white">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop" 
            alt="Medical Professional" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        </div>
        
        <div className="relative z-10 p-12 flex flex-col h-full justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              Meduf <span className="text-primary-foreground/80">Ai</span>
            </span>
          </div>
          
          <div className="space-y-4 max-w-lg">
            <h1 className="text-4xl font-bold leading-tight">
              Inteligência Artificial para Apoio à Decisão Clínica
            </h1>
            <p className="text-lg text-slate-300">
              Auxiliamos médicos com raciocínio clínico avançado, hipóteses diagnósticas baseadas em evidências e sugestões terapêuticas precisas.
            </p>
          </div>
          
          <div className="text-sm text-slate-400">
            © 2024 Meduf Ai. Todos os direitos reservados.
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">{title}</h2>
            <p className="mt-2 text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
