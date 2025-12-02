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
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react';
import { toast } from "sonner";
import api from '@/lib/api';
import { CustomLoader } from '@/components/ui/custom-loader';
import { ResultActions } from '@/components/ResultActions';

const ExamReader = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const resultRef = useRef(null);
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;

    // Validate files
    const validFiles = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit per file
        toast.error(`${file.name} é muito grande (máx 10MB)`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Create previews for image files
    const newFiles = validFiles.map(file => {
      const fileObj = { file, preview: null };
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          fileObj.preview = reader.result;
          setSelectedFiles(prev => [...prev]); // Force re-render
        };
        reader.readAsDataURL(file);
      }
      
      return fileObj;
    });

    setSelectedFiles(prev => [...prev, ...newFiles]);
    setAnalysis(null);
    toast.success(`${validFiles.length} arquivo(s) adicionado(s)`);
  };

  const handleCameraCapture = (event) => {
    handleFileSelect(event);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    toast.info("Arquivo removido");
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
    setAnalysis(null);
    toast.info("Todos os arquivos removidos");
  };

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Por favor, adicione pelo menos um arquivo");
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    setProgress(0);
    setProgressMessage('Preparando análise...');

    try {
      // Create form data with multiple files
      const formData = new FormData();
      selectedFiles.forEach((fileObj, index) => {
        formData.append('files', fileObj.file);
      });
      formData.append('additional_info', additionalInfo);

      setProgress(10);
      setProgressMessage(`Enviando ${selectedFiles.length} arquivo(s)...`);

      // Upload and start analysis
      const response = await api.post('/ai/analyze-exam', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const taskId = response.data.task_id;
      setProgress(20);
      setProgressMessage('Processando com IA...');
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
            <FileText className="h-5 w-5 inline mr-2" />
            Leitor de Exames
          </h1>
          <p className="text-slate-600">
            Faça upload de exames laboratoriais (foto ou PDF) para análise automática das alterações
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span>
              <strong>Múltiplas páginas:</strong> Você pode adicionar várias fotos/arquivos se o exame tiver várias páginas
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <Card className="shadow-lg border-t-4 border-t-blue-500">
              <CardHeader>
                <CardTitle>Upload do Exame</CardTitle>
                <CardDescription>
                  Adicione uma ou mais fotos/páginas do exame laboratorial
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
                    <div className="text-left">
                      <div>Adicionar Arquivo(s)</div>
                      <div className="text-xs text-slate-500 font-normal">JPG, PNG, PDF, DOC - Múltiplos arquivos permitidos</div>
                    </div>
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    multiple
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

                {/* Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700">
                        <FileText className="h-4 w-4 inline mr-1" />
                        {selectedFiles.length} arquivo(s) selecionado(s)
                      </p>
                      <Button
                        onClick={handleClearAll}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Limpar Todos
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {selectedFiles.map((fileObj, index) => (
                        <div 
                          key={index} 
                          className="p-3 bg-slate-50 rounded-lg border relative group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-700">
                                Página {index + 1}: {fileObj.file.name}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {(fileObj.file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <Button
                              onClick={() => handleRemoveFile(index)}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 -mt-1 -mr-1"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {fileObj.preview && (
                            <img 
                              src={fileObj.preview} 
                              alt={`Preview ${index + 1}`} 
                              className="mt-3 max-h-40 w-full object-contain rounded border bg-white"
                            />
                          )}
                        </div>
                      ))}
                    </div>
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
                  disabled={selectedFiles.length === 0 || isAnalyzing}
                  className="w-full h-12 text-lg"
                >
                  {isAnalyzing ? (
                    <>
                      <CustomLoader className="mr-2" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5 mr-2" />
                      Analisar {selectedFiles.length > 0 ? `(${selectedFiles.length} arquivo${selectedFiles.length > 1 ? 's' : ''})` : 'Exame'}
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
              <div ref={resultRef}>
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

                {/* Result Actions */}
                <ResultActions
                  resultRef={resultRef}
                  resultData={analysis}
                  analysisType="exam-reader"
                  fileName="resultado-exame-meduf-ai.png"
                />
              </div>
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
