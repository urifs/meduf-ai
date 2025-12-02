import React from 'react';
import { BrainCircuit } from 'lucide-react';
import '../styles/animations.css';

export const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 relative overflow-hidden">
      {/* Pulsating Gradient Background behind login card */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Main pulsating gradient circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-40">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-800 to-blue-900 rounded-full animate-pulse-gradient"></div>
        </div>
        
        {/* Secondary floating elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="w-full max-w-[450px] space-y-6 relative z-10">
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-3 text-center animate-fade-in-up">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl animate-pulse-glow">
            <BrainCircuit className="h-9 w-9" />
          </div>
          <span className="text-3xl font-bold tracking-tight">
            Meduf <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Ai</span>
          </span>
        </div>

        {/* Card Container */}
        <div className="glass-card rounded-2xl shadow-2xl p-8 border-2 border-white/50 animate-scale-in backdrop-blur-xl">
          <div className="flex flex-col space-y-2 text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">{title}</h1>
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          </div>
          {children}
        </div>

        {/* Footer */}
        <p className="px-8 text-center text-sm text-slate-600 animate-fade-in" style={{animationDelay: '0.3s'}}>
          © 2025 Meduf Ai. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};
