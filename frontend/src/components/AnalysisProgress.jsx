import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CustomLoader } from '@/components/ui/custom-loader';

export const AnalysisProgress = React.memo(({ progress, colorScheme = "blue" }) => {
  const colorClasses = {
    blue: {
      text: "text-blue-700",
      loader: "text-blue-600",
      progress: "text-blue-600",
      border: "border-blue-200",
      bg: "bg-blue-100",
      gradient: "from-blue-500 to-purple-600"
    },
    orange: {
      text: "text-orange-700",
      loader: "text-orange-600",
      progress: "text-orange-600",
      border: "border-orange-200",
      bg: "bg-orange-100",
      gradient: "from-orange-500 to-red-600"
    },
    purple: {
      text: "text-purple-700",
      loader: "text-purple-600",
      progress: "text-purple-600",
      border: "border-purple-200",
      bg: "bg-purple-100",
      gradient: "from-purple-500 to-pink-600"
    },
    emerald: {
      text: "text-emerald-700",
      loader: "text-emerald-600",
      progress: "text-emerald-600",
      border: "border-emerald-200",
      bg: "bg-emerald-100",
      gradient: "from-emerald-500 to-teal-600"
    },
    rose: {
      text: "text-rose-700",
      loader: "text-rose-600",
      progress: "text-rose-600",
      border: "border-rose-200",
      bg: "bg-rose-100",
      gradient: "from-rose-500 to-pink-600"
    }
  };

  const colors = colorClasses[colorScheme] || colorClasses.blue;

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
            className={`h-3 ${colors.bg} [&>div]:bg-gradient-to-r [&>div]:${colors.gradient} shadow-lg`} 
          />
        </div>
      </CardContent>
    </Card>
  );
});

AnalysisProgress.displayName = 'AnalysisProgress';
