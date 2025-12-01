import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Sparkles, Syringe, Activity, Skull, ArrowRight, Zap } from 'lucide-react';
import '../styles/animations.css';

const Selection = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      title: "Diagnóstico Simples",
      description: "Análise rápida com IA",
      detail: "Digite a anamnese em texto livre. IA estrutura e analisa automaticamente.",
      icon: Sparkles,
      gradient: "from-violet-500 to-purple-600",
      hoverGradient: "hover:from-violet-600 hover:to-purple-700",
      iconBg: "bg-gradient-to-br from-violet-400/20 to-purple-500/20",
      iconColor: "text-violet-600",
      path: "/simple",
      glow: "hover:shadow-[0_0_40px_rgba(139,92,246,0.3)]"
    },
    {
      title: "Diagnóstico Detalhado",
      description: "Campos estruturados",
      detail: "Preencha Queixa, Histórico e Exames separadamente para maior precisão diagnóstica.",
      icon: FileText,
      gradient: "from-blue-500 to-cyan-600",
      hoverGradient: "hover:from-blue-600 hover:to-cyan-700",
      iconBg: "bg-gradient-to-br from-blue-400/20 to-cyan-500/20",
      iconColor: "text-blue-600",
      path: "/detailed",
      glow: "hover:shadow-[0_0_40px_rgba(59,130,246,0.3)]"
    },
    {
      title: "Guia Terapêutico",
      description: "Prescrição medicamentosa",
      detail: "Recomendações de medicamentos, doses, vias e contraindicações baseadas em evidências.",
      icon: Syringe,
      gradient: "from-emerald-500 to-teal-600",
      hoverGradient: "hover:from-emerald-600 hover:to-teal-700",
      iconBg: "bg-gradient-to-br from-emerald-400/20 to-teal-500/20",
      iconColor: "text-emerald-600",
      path: "/medication",
      glow: "hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]"
    },
    {
      title: "Interação Medicamentosa",
      description: "Análise farmacocinética",
      detail: "Avalie interações, impacto renal/hepático e ajustes posológicos necessários.",
      icon: Activity,
      gradient: "from-orange-500 to-red-600",
      hoverGradient: "hover:from-orange-600 hover:to-red-700",
      iconBg: "bg-gradient-to-br from-orange-400/20 to-red-500/20",
      iconColor: "text-orange-600",
      path: "/interaction",
      glow: "hover:shadow-[0_0_40px_rgba(249,115,22,0.3)]"
    },
    {
      title: "Toxicologia",
      description: "Protocolo de intoxicação",
      detail: "ABCDE, descontaminação, antídotos específicos e suporte avançado para intoxicações.",
      icon: Skull,
      gradient: "from-rose-500 to-pink-600",
      hoverGradient: "hover:from-rose-600 hover:to-pink-700",
      iconBg: "bg-gradient-to-br from-rose-400/20 to-pink-500/20",
      iconColor: "text-rose-600",
      path: "/toxicology",
      glow: "hover:shadow-[0_0_40px_rgba(244,63,94,0.3)]"
    },
    {
      title: "Leitor de Exames",
      description: "Análise de exames laboratoriais",
      detail: "Upload de exames para identificar alterações e interpretar resultados automaticamente.",
      icon: FileText,
      gradient: "from-blue-500 to-cyan-600",
      hoverGradient: "hover:from-blue-600 hover:to-cyan-700",
      iconBg: "bg-gradient-to-br from-blue-400/20 to-cyan-500/20",
      iconColor: "text-blue-600",
      path: "/exam-reader",
      glow: "hover:shadow-[0_0_40px_rgba(59,130,246,0.3)]"
    },
    {
      title: "Leitor de Raio-X",
      description: "Análise de imagens radiológicas",
      detail: "Upload de raios-X para análise radiológica automatizada e identificação de alterações.",
      icon: Activity,
      gradient: "from-indigo-500 to-purple-600",
      hoverGradient: "hover:from-indigo-600 hover:to-purple-700",
      iconBg: "bg-gradient-to-br from-indigo-400/20 to-purple-500/20",
      iconColor: "text-indigo-600",
      path: "/xray-reader",
      glow: "hover:shadow-[0_0_40px_rgba(99,102,241,0.3)]"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-gradient" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bS00IDB2Mmgydi0yaC0yem0tNCAwdjJoMnYtMmgtMnptLTQgMHYyaDJ2LTJoLTJ6bS00IDB2Mmgydi0yaC0yem0tNCAwdjJoMnYtMmgtMnptLTQgMHYyaDJ2LTJoLTJ6bS00IDB2Mmgydi0yaC0yem0tNCAwdjJoMnYtMmgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        
        <main className="container relative mx-auto px-4 py-12 md:px-8">
          {/* Title */}
          <div className={`text-center mb-12 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Powered by Meduf AI + PubMed</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Assistente Clínico Inteligente
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Selecione a ferramenta clínica para análise com IA e suporte à decisão baseado em evidências
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-[1600px] mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.path}
                  className={`group cursor-pointer border-2 border-transparent hover:border-white/50 transition-all duration-500 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 overflow-hidden relative ${
                    mounted ? 'animate-fade-in-up' : 'opacity-0'
                  } ${feature.glow}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => navigate(feature.path)}
                >
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  <CardHeader className="relative">
                    {/* Icon */}
                    <div className={`h-14 w-14 rounded-xl ${feature.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 relative overflow-hidden`}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                      <Icon className={`h-7 w-7 ${feature.iconColor} group-hover:text-white relative z-10 transition-colors duration-300`} />
                    </div>

                    <CardTitle className="text-xl font-bold group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-sm font-medium">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="relative">
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {feature.detail}
                    </p>

                    {/* Action Button */}
                    <div className={`flex items-center justify-between text-sm font-medium bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent group-hover:opacity-100 opacity-70 transition-opacity`}>
                      <span>Acessar</span>
                      <ArrowRight className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>

                  {/* Bottom Accent */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />
                </Card>
              );
            })}
          </div>

          {/* Bottom Info */}
          <div className={`mt-16 text-center ${mounted ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '600ms' }}>
            <p className="text-sm text-muted-foreground">
              💡 Todas as análises utilizam consenso de múltiplas IAs e base de dados PubMed
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Selection;