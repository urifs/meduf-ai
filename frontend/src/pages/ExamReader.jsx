import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  Camera, 
  FileText, 
  Loader2, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react';
import { toast } from "sonner";
import api from '@/lib/api';

const ExamReader = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
      
      setAnalysis(null);
    }
  };

  const handleCameraCapture = (event) => {
    handleFileSelect(event);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error("Por favor, selecione um arquivo ou tire uma foto");
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    setProgress(0);
    setProgressMessage('Preparando análise...');

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('additional_info', additionalInfo);

      setProgress(10);
      setProgressMessage('Enviando imagem...');

      // Upload and start analysis
      const response = await api.post('/ai/analyze-exam', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const taskId = response.data.task_id;
      setProgress(20);
      setProgressMessage('Processando com IA (Gemini 2.5 Flash)...');
      toast.info("Analisando exame... Aguarde.");

      // Poll for results
      let attempts = 0;
      const maxAttempts = 90; // 90 seconds max
      
      const pollInterval = setInterval(async () => {
        attempts++;
        
        // Update progress based on time
        const progressPercent = Math.min(20 + (attempts * 70 / maxAttempts), 90);
        setProgress(progressPercent);
        
        if (attempts < 15) {
          setProgressMessage('Lendo valores da imagem...');
        } else if (attempts < 30) {
          setProgressMessage('Identificando alterações...');
        } else if (attempts < 60) {
          setProgressMessage('Analisando significado clínico...');
        } else {
          setProgressMessage('Finalizando análise...');
        }
        
        try {
          const taskResponse = await api.get(`/ai/tasks/${taskId}`);
          const task = taskResponse.data;

          if (task.status === 'completed') {
            clearInterval(pollInterval);
            setProgress(100);
            setProgressMessage('Análise concluída!');
            setAnalysis(task.result);
            setTimeout(() => {
              setIsAnalyzing(false);
              setProgress(0);
              setProgressMessage('');
            }, 500);
            toast.success("Análise concluída com sucesso!");
          } else if (task.status === 'failed') {
            clearInterval(pollInterval);
            setIsAnalyzing(false);
            setProgress(0);
            setProgressMessage('');
            toast.error("Erro ao analisar exame: " + (task.error || "Erro desconhecido"));
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setIsAnalyzing(false);
            setProgress(0);
            setProgressMessage('');
            toast.error("Tempo limite excedido. A análise pode estar demorando mais que o esperado. Tente novamente.");
          }
        } catch (error) {
          clearInterval(pollInterval);
          setIsAnalyzing(false);
          setProgress(0);
          setProgressMessage('');
          toast.error("Erro ao verificar status da análise");
        }
      }, 1000);

    } catch (error) {
      console.error("Error analyzing exam:", error);
      setIsAnalyzing(false);
      setProgress(0);
      setProgressMessage('');
      toast.error(error.response?.data?.detail || "Erro ao enviar arquivo");
    }
  };

  const getSeverityColor = (severity) => {
    if (!severity) return 'bg-gray-500';
    const sev = severity.toLowerCase();
    if (sev.includes('grave') || sev.includes('crítica')) return 'bg-red-500';
    if (sev.includes('moderada')) return 'bg-orange-500';
    if (sev.includes('leve')) return 'bg-yellow-500';
    if (sev.includes('normal')) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getSeverityIcon = (severity) => {
    if (!severity) return <Info className="h-5 w-5" />;
    const sev = severity.toLowerCase();
    if (sev.includes('grave') || sev.includes('crítica')) return <XCircle className="h-5 w-5" />;
    if (sev.includes('normal')) return <CheckCircle2 className="h-5 w-5" />;
    return <AlertTriangle className="h-5 w-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
            📋 Leitor de Exames
          </h1>
          <p className="text-slate-600">
            Faça upload de exames laboratoriais (foto ou PDF) para análise automática das alterações
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <Card className="shadow-lg border-t-4 border-t-blue-500">
              <CardHeader>
                <CardTitle>Upload do Exame</CardTitle>
                <CardDescription>
                  Selecione uma foto, PDF ou documento do exame laboratorial
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload Button */}
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full h-20 border-2 border-dashed hover:border-blue-500 transition-colors"
                  >
                    <Upload className="h-6 w-6 mr-2" />
                    Selecionar Arquivo (JPG, PNG, PDF, DOC)
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* Camera Capture Button */}
                  <Button
                    onClick={() => cameraInputRef.current?.click()}
                    variant="outline"
                    className="w-full h-20 border-2 border-dashed hover:border-blue-500 transition-colors"
                  >
                    <Camera className="h-6 w-6 mr-2" />
                    Tirar Foto com a Câmera
                  </Button>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCameraCapture}
                    className="hidden"
                  />
                </div>

                {/* Preview */}
                {selectedFile && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      <FileText className="h-4 w-4 inline mr-1" />
                      Arquivo selecionado:
                    </p>
                    <p className="text-sm text-slate-600">{selectedFile.name}</p>
                    
                    {preview && (
                      <img 
                        src={preview} 
                        alt="Preview" 
                        className="mt-3 max-h-64 w-full object-contain rounded border"
                      />
                    )}
                  </div>
                )}

                {/* Additional Info */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Informações Adicionais (opcional)
                  </label>
                  <Textarea
                    placeholder="Ex: Idade do paciente, sintomas, histórico médico..."
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Progress Bar */}
                {isAnalyzing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-700 font-medium">{progressMessage}</span>
                      <span className="text-blue-600 font-semibold">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 ease-out rounded-full"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="h-full w-full bg-white/30 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Analyze Button */}
                <Button
                  onClick={handleAnalyze}
                  disabled={!selectedFile || isAnalyzing}
                  className="w-full h-12 text-lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5 mr-2" />
                      Analisar Exame
                    </>
                  )}
                </Button>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    ⚠️ Esta análise é auxiliar e não substitui a avaliação médica profissional.
                    Sempre consulte um médico para interpretação definitiva.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Results */}
          <div className="space-y-6">
            {analysis ? (
              <>
                {/* Overview Card */}
                <Card className={`shadow-lg border-l-4 ${analysis.urgent_attention ? 'border-l-red-500' : 'border-l-blue-500'}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Resultado da Análise</CardTitle>
                      <Badge className={getSeverityColor(analysis.overall_severity)}>
                        {analysis.overall_severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1">Tipo de Exame:</p>
                      <p className="text-base">{analysis.exam_type}</p>
                    </div>

                    {analysis.urgent_attention && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Atenção:</strong> Este exame pode requerer avaliação médica urgente.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Altered Values */}
                {analysis.altered_values && analysis.altered_values.length > 0 && (
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle>Valores Alterados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analysis.altered_values.map((item, index) => (
                          <div key={index} className="p-3 bg-slate-50 rounded-lg border">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-slate-900">{item.parameter}</p>
                                <p className="text-sm text-slate-600 mt-1">
                                  Valor: <span className="font-semibold">{item.value}</span>
                                  {item.reference && ` (Ref: ${item.reference})`}
                                </p>
                                <p className="text-sm text-slate-600">
                                  Status: <span className="font-semibold">{item.status}</span>
                                </p>
                              </div>
                              <Badge className={getSeverityColor(item.severity)} variant="outline">
                                {item.severity}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Clinical Interpretation */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Interpretação Clínica</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {analysis.clinical_interpretation}
                    </p>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle>Recomendações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Additional Notes */}
                {analysis.additional_notes && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      {analysis.additional_notes}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <Card className="shadow-lg">
                <CardContent className="pt-6">
                  <div className="text-center py-12 text-slate-400">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Faça upload de um exame para ver a análise</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamReader;
