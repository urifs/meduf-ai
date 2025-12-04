import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CustomLoader } from '@/components/ui/custom-loader';

export const AnalysisProgress = React.memo(({ progress, colorScheme = "blue" }) => {
  // Always use blue color scheme for consistency
  const colors = {
    text: "text-blue-700",
    loader: "text-blue-600",
    progress: "text-blue-600",
    border: "border-blue-200",
    bg: "bg-blue-50",
    gradient: "from-blue-400 to-blue-600"
  };

  return (
    <Card className={`mb-4 glass-card border-2 ${colors.border} shadow-xl animate-pulse-glow`}>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex justify-between text-sm font-medium">
            <span className={`flex items-center gap-2 ${colors.text}`}>
              <CustomLoader size="sm" className={colors.loader} />
              Analisando com IA e banco de dados PubMed...
            </span>
            <span className={`font-bold ${colors.progress}`}>{progress}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-3 shadow-lg" 
          />
        </div>
      </CardContent>
    </Card>
  );
});

AnalysisProgress.displayName = 'AnalysisProgress';
