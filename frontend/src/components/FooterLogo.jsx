import React, { memo } from 'react';
import { BrainCircuit } from 'lucide-react';

const FooterLogo = memo(() => {
  return (
    <div className="mt-16 mb-12 flex justify-center animate-fade-in">
      <div className="flex items-center gap-3 animate-pulse-slow">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl">
          <BrainCircuit className="h-9 w-9" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-3xl font-bold tracking-tight text-foreground">
            Meduf <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Ai</span>
          </span>
          <span className="text-xs text-muted-foreground font-medium tracking-wider uppercase ml-0.5">2.5 Clinic</span>
        </div>
      </div>
    </div>
  );
});

export default FooterLogo;
