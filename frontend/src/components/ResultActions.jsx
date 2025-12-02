import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Copy, Download, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { toast } from "sonner";
import html2canvas from 'html2canvas';
import api from '@/lib/api';

export const ResultActions = ({ 
  resultRef, 
  resultData, 
  analysisType,
  fileName = "resultado-meduf-ai.png" 
}) => {
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackType, setFeedbackType] = useState(null); // 'helpful' or 'not-helpful'
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const handleCopy = async () => {
    try {
      // Get text content from the result element
      const resultElement = resultRef.current;
      if (!resultElement) {
        toast.error("Nenhum resultado para copiar");
        return;
      }

      // Extract text content
      const textContent = resultElement.innerText;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(textContent);
      toast.success("Resultado copiado para a área de transferência!");
    } catch (error) {
      console.error("Error copying:", error);
      toast.error("Erro ao copiar resultado");
    }
  };

  const handleSaveAsImage = async () => {
    try {
      setIsSaving(true);
      const resultElement = resultRef.current;
      
      if (!resultElement) {
        toast.error("Nenhum resultado para salvar");
        return;
      }

      toast.info("Gerando imagem... Por favor, aguarde.");

      // Generate canvas from the element
      const canvas = await html2canvas(resultElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success("Imagem salva com sucesso!");
      }, 'image/png');

    } catch (error) {
      console.error("Error saving as image:", error);
      toast.error("Erro ao salvar imagem");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFeedback = async (isHelpful) => {
    try {
      await api.post('/feedback', {
        analysis_type: analysisType,
        is_helpful: isHelpful,
        result_data: resultData
      });

      setFeedbackSent(true);
      toast.success(
        isHelpful 
          ? "Obrigado! Ficamos felizes que ajudou!" 
          : "Obrigado pelo feedback! Vamos melhorar."
      );
    } catch (error) {
      console.error("Error sending feedback:", error);
      toast.error("Erro ao enviar feedback");
    }
  };

  return (
    <div className="mt-8 space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button
          onClick={handleCopy}
          variant="outline"
          className="gap-2"
        >
          <Copy className="h-4 w-4" />
          Copiar Resultado
        </Button>

        <Button
          onClick={handleSaveAsImage}
          variant="outline"
          className="gap-2"
          disabled={isSaving}
        >
          <Download className="h-4 w-4" />
          {isSaving ? "Salvando..." : "Salvar como Imagem"}
        </Button>
      </div>

      {/* Feedback Section */}
      <div className="flex flex-col items-center gap-3 p-6 bg-slate-50 dark:bg-slate-800 rounded-lg border">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Este resultado foi útil para você?
        </p>
        
        {feedbackSent ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <Check className="h-5 w-5" />
            <span className="text-sm font-medium">Feedback enviado! Obrigado.</span>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              onClick={() => handleFeedback(true)}
              variant="outline"
              className="gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-300 dark:hover:bg-green-900/20"
            >
              <ThumbsUp className="h-4 w-4" />
              Sim, me ajudou
            </Button>

            <Button
              onClick={() => handleFeedback(false)}
              variant="outline"
              className="gap-2 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:hover:bg-red-900/20"
            >
              <ThumbsDown className="h-4 w-4" />
              Não me ajudou
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
