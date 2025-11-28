import React from 'react';
import { BrainCircuit } from 'lucide-react';

export const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <BrainCircuit className="h-7 w-7" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">
            Meduf <span className="text-primary">Ai</span>
          </span>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-xl border shadow-sm p-8">
          <div className="flex flex-col space-y-2 text-center mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          </div>
          {children}
        </div>

        {/* Footer */}
        <p className="px-8 text-center text-sm text-muted-foreground">
          © 2025 Meduf Ai. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};
