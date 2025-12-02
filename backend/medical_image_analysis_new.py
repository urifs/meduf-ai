"""
Medical Image/Exam Analysis
Uses Gemini 2.5 Flash for exam analysis with vision capabilities
Production-ready implementation
"""
import os
import asyncio
from typing import Dict, Any, List, Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json
from dotenv import load_dotenv
import base64

# Load environment variables
load_dotenv()

# Get Emergent Universal Key
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
if not EMERGENT_KEY:
    raise ValueError("EMERGENT_LLM_KEY environment variable is required but not set")

# Gemini 2.5 Flash for exam analysis
GEMINI_EXAM_MODEL = "gemini-2.5-flash-preview-04-17"

EXAM_SYSTEM_PROMPT = """Você é um médico radiologista e patologista especializado em análise de exames. Analise o(s) exame(s) fornecido(s) e forneça:

1. **Achados Principais** (observações clínicas importantes)
2. **Interpretação** (significado clínico)
3. **Diagnóstico Sugerido** (hipóteses diagnósticas)
4. **Recomendações** (próximos passos)

**FORMATO DA RESPOSTA:**
```json
{
  "findings": "Descrição detalhada dos achados",
  "interpretation": "Interpretação clínica",
  "diagnosis": "Diagnóstico sugerido",
  "recommendations": "Recomendações clínicas"
}
```

Responda APENAS com JSON válido, sem texto adicional."""


async def analyze_exam(
    exam_texts: List[str],
    exam_images: Optional[List[str]] = None,
    patient_context: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analisa exames médicos (textos e/ou imagens) usando Gemini 2.5 Flash
    
    Args:
        exam_texts: Lista de textos de exames
        exam_images: Lista de URLs ou paths de imagens
        patient_context: Contexto adicional do paciente
        
    Returns:
        Dict com findings, interpretation, diagnosis, recommendations
    """
    try:
        # Create chat instance with Gemini 2.5 Flash
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"exam_{os.urandom(8).hex()}",
            system_message=EXAM_SYSTEM_PROMPT
        ).with_model("gemini", GEMINI_EXAM_MODEL)
        
        # Prepare prompt
        prompt_parts = []
        
        if patient_context:
            prompt_parts.append(f"Contexto do Paciente: {patient_context}\n")
        
        prompt_parts.append("Exames para Análise:\n")
        
        for i, text in enumerate(exam_texts, 1):
            prompt_parts.append(f"\n--- Exame {i} ---\n{text}\n")
        
        if exam_images:
            prompt_parts.append(f"\n{len(exam_images)} imagem(s) de exame anexada(s).")
        
        prompt_parts.append("\nForneça análise completa no formato JSON especificado.")
        
        prompt = "".join(prompt_parts)
        
        # Send message
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif response_text.startswith("```"):
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        result = json.loads(response_text)
        
        return result
        
    except json.JSONDecodeError as e:
        print(f"JSON Decode Error in exam analysis: {e}")
        print(f"Response was: {response}")
        return {
            "findings": "Erro ao processar resposta",
            "interpretation": "Não foi possível analisar o exame. Por favor, tente novamente.",
            "diagnosis": "Análise incompleta",
            "recommendations": "Consulte um médico para interpretação manual do exame."
        }
    except Exception as e:
        print(f"Error in analyze_exam: {e}")
        raise


async def analyze_exam_simple(exam_content: str) -> Dict[str, Any]:
    """
    Versão simplificada para análise rápida de um exame
    """
    return await analyze_exam(
        exam_texts=[exam_content],
        patient_context=None
    )
