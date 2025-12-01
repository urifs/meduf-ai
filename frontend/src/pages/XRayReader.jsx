import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Info,
  Activity
} from 'lucide-react';
import { toast } from "sonner";
import api from '@/lib/api';

const XRayReader = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [bodyRegion, setBodyRegion] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Verify it's an image
      if (!file.type.startsWith('image/')) {
        toast.error("Por favor, selecione uma imagem (JPG ou PNG)");
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      setAnalysis(null);
    }
  };

  const handleCameraCapture = (event) => {
    handleFileSelect(event);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error("Por favor, selecione uma imagem ou tire uma foto");
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('body_region', bodyRegion);
      formData.append('additional_info', additionalInfo);

      // Upload and start analysis
      const response = await api.post('/ai/analyze-xray', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const taskId = response.data.task_id;
      toast.info("Analisando raio-X... Isso pode levar alguns segundos.");

      // Poll for results
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds max
      
      const pollInterval = setInterval(async () => {
        attempts++;
        
        try {
          const taskResponse = await api.get(`/ai/tasks/${taskId}`);
          const task = taskResponse.data;

          if (task.status === 'completed') {
            clearInterval(pollInterval);
            setAnalysis(task.result);
            setIsAnalyzing(false);
            toast.success("Análise concluída!");
          } else if (task.status === 'failed') {
            clearInterval(pollInterval);
            setIsAnalyzing(false);
            toast.error("Erro ao analisar raio-X: " + (task.error || "Erro desconhecido"));
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setIsAnalyzing(false);
            toast.error("Tempo limite excedido. Tente novamente.");
          }
        } catch (error) {
          clearInterval(pollInterval);
          setIsAnalyzing(false);
          toast.error("Erro ao verificar status da análise");
        }
      }, 1000);

    } catch (error) {
      console.error("Error analyzing X-ray:", error);
      setIsAnalyzing(false);
      toast.error(error.response?.data?.detail || "Erro ao enviar arquivo");
    }
  };

  const getSeverityColor = (severity) => {
    if (!severity) return 'bg-gray-500';
    const sev = severity.toLowerCase();
    if (sev.includes('crítica') || sev.includes('grave')) return 'bg-red-500';
    if (sev.includes('moderada')) return 'bg-orange-500';
    if (sev.includes('leve')) return 'bg-yellow-500';
    if (sev.includes('normal')) return 'bg-green-500';
    return 'bg-blue-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
            🩻 Leitor de Raio-X
          </h1>
          <p className="text-slate-600">
            Faça upload de imagens de raio-X para análise radiológica automatizada
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <Card className="shadow-lg border-t-4 border-t-indigo-500">
              <CardHeader>
                <CardTitle>Upload do Raio-X</CardTitle>
                <CardDescription>
                  Selecione uma imagem de raio-X (JPG ou PNG)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload Button */}
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full h-20 border-2 border-dashed hover:border-indigo-500 transition-colors"
                  >
                    <Upload className="h-6 w-6 mr-2" />
                    Selecionar Imagem (JPG, PNG)
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* Camera Capture Button */}
                  <Button
                    onClick={() => cameraInputRef.current?.click()}
                    variant="outline"
                    className="w-full h-20 border-2 border-dashed hover:border-indigo-500 transition-colors"
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
                {selectedFile && preview && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      <Activity className="h-4 w-4 inline mr-1" />
                      Imagem selecionada:
                    </p>
                    <p className="text-sm text-slate-600 mb-3">{selectedFile.name}</p>
                    
                    <img 
                      src={preview} 
                      alt="X-ray preview" 
                      className="w-full rounded border bg-black"
                      style={{ maxHeight: '400px', objectFit: 'contain' }}
                    />
                  </div>
                )}

                {/* Body Region Input */}
                <div>
                  <Label htmlFor="body-region" className="text-sm font-medium text-slate-700">
                    Região do Corpo (opcional)
                  </Label>
                  <Input
                    id="body-region"
                    placeholder="Ex: Tórax, Abdome, Mão direita, Joelho esquerdo..."
                    value={bodyRegion}
                    onChange={(e) => setBodyRegion(e.target.value)}
                    className="mt-2"
                  />
                </div>

                {/* Additional Info */}
                <div>
                  <Label htmlFor="additional-info" className="text-sm font-medium text-slate-700">
                    Informações Clínicas (opcional)
                  </Label>
                  <Textarea
                    id="additional-info"
                    placeholder="Ex: Histórico de trauma, sintomas, suspeita diagnóstica..."
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    rows={4}
                    className="resize-none mt-2"
                  />
                </div>

                {/* Analyze Button */}
                <Button
                  onClick={handleAnalyze}
                  disabled={!selectedFile || isAnalyzing}
                  className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Activity className="h-5 w-5 mr-2" />
                      Analisar Raio-X
                    </>
                  )}
                </Button>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    ⚠️ Esta análise é auxiliar e não substitui a avaliação de um radiologista.
                    Sempre consulte um médico especialista para interpretação definitiva.
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
                <Card className={`shadow-lg border-l-4 ${analysis.urgent_attention ? 'border-l-red-500' : 'border-l-indigo-500'}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Laudo Radiológico</CardTitle>
                      <Badge className={getSeverityColor(analysis.overall_severity)}>
                        {analysis.overall_severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1">Região Anatômica:</p>
                      <p className="text-base">{analysis.body_region}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1">Qualidade Técnica:</p>
                      <p className="text-base">{analysis.technical_quality}</p>
                    </div>

                    {analysis.urgent_attention && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Atenção:</strong> Achados que podem requerer avaliação médica urgente.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Normal Findings */}
                {analysis.normal_findings && analysis.normal_findings.length > 0 && (
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                        Achados Normais
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.normal_findings.map((finding, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            <span className="text-slate-700">{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Abnormal Findings */}
                {analysis.abnormal_findings && analysis.abnormal_findings.length > 0 && (
                  <Card className="shadow-lg border-l-4 border-l-orange-500">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                        Alterações Identificadas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysis.abnormal_findings.map((finding, index) => (
                          <div key={index} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="flex items-start justify-between mb-2">
                              <p className="font-semibold text-slate-900">{finding.finding}</p>
                              <Badge className={getSeverityColor(finding.severity)} variant="outline">
                                {finding.severity}
                              </Badge>
                            </div>
                            {finding.location && (
                              <p className="text-sm text-slate-600 mb-1">
                                <strong>Localização:</strong> {finding.location}
                              </p>
                            )}
                            {finding.clinical_significance && (
                              <p className="text-sm text-slate-700 mt-2">
                                <strong>Significado Clínico:</strong> {finding.clinical_significance}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Diagnostic Impression */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Impressão Diagnóstica</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 font-medium mb-4">
                      {analysis.diagnostic_impression}
                    </p>

                    {analysis.differential_diagnosis && analysis.differential_diagnosis.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-slate-700 mb-2">Diagnóstico Diferencial:</p>
                        <ul className="space-y-1">
                          {analysis.differential_diagnosis.map((dx, index) => (
                            <li key={index} className="text-sm text-slate-600 flex items-start">
                              <span className="text-indigo-500 mr-2">{index + 1}.</span>
                              {dx}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
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
                            <CheckCircle2 className="h-5 w-5 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
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
                    <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Faça upload de um raio-X para ver a análise</p>
                    <p className="text-sm mt-2">Imagens suportadas: JPG, PNG</p>
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

export default XRayReader;
