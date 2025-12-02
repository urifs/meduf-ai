"""
Medical Image/Exam Analysis with VISION
Uses Gemini 2.5 Flash for exam analysis with VISION capabilities
Processes images (X-rays, MRI, CT scans, lab reports in image format)
"""
import os
import asyncio
from typing import Dict, Any, List, Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType
import json
from dotenv import load_dotenv
import base64
from pathlib import Path

# Load environment variables
load_dotenv()

# Get Emergent Universal Key
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
if not EMERGENT_KEY:
    raise ValueError("EMERGENT_LLM_KEY environment variable is required but not set")

# Gemini 2.0 Flash for exam analysis WITH VISION
# Note: gemini-2.0-flash has vision capabilities and is stable
GEMINI_VISION_MODEL = "gemini-2.0-flash"

EXAM_VISION_SYSTEM_PROMPT = """Você é um médico radiologista e patologista especializado auxiliando MÉDICOS PROFISSIONAIS. Analise VISUALMENTE a(s) imagem(ns) médica(s) fornecida(s) e forneça análise técnica detalhada:

1. **Achados Visuais** (descrição detalhada do que você vê na imagem - lesões, opacidades, densidades, padrões, medidas)
2. **Interpretação Radiológica/Laboratorial** (significado clínico dos achados, correlação anatômica/fisiológica)
3. **Hipóteses Diagnósticas** (diagnósticos diferenciais baseados nos achados visuais)
4. **Conduta Proposta** (exames complementares necessários, correlação clínica, seguimento)

**DIRETRIZES PARA ANÁLISE DE IMAGENS:**
- Descreva TUDO que você VÊ na imagem com detalhes técnicos
- Para raio-X: opacidades, densidades, padrões intersticiais, contornos, mediastino, campos pulmonares
- Para exames laboratoriais: valores numéricos, tabelas, gráficos, unidades de medida
- Para ressonância/tomografia: sinal, densidade, realce, medidas, localização anatômica
- Use terminologia médica técnica (não simplifique)
- Correlacione achados com anatomia e fisiopatologia
- Sugira exames complementares quando indicado

**FORMATO DA RESPOSTA:**
```json
{
  "findings": "Descrição VISUAL detalhada de TUDO que você vê na(s) imagem(ns) - seja minucioso",
  "interpretation": "Interpretação radiológica/clínica baseada nos achados VISUAIS",
  "diagnosis": "Diagnósticos diferenciais baseados na ANÁLISE VISUAL",
  "recommendations": [
    "Recomendação técnica 1",
    "Recomendação técnica 2",
    "Recomendação técnica 3"
  ]
}
```

Responda APENAS com JSON válido, sem texto adicional."""


async def analyze_exam_with_vision(
    file_paths: List[str],
    file_types: List[str],
    additional_context: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analisa exames médicos COM VISÃO usando Gemini 2.5 Flash
    
    Args:
        file_paths: Lista de caminhos para arquivos de imagem
        file_types: Lista de tipos MIME dos arquivos
        additional_context: Contexto clínico adicional
        
    Returns:
        Dict com findings, interpretation, diagnosis, recommendations
    """
    try:
        # Create chat instance with Gemini 2.5 Flash (VISION)
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"exam_vision_{os.urandom(8).hex()}",
            system_message=EXAM_VISION_SYSTEM_PROMPT
        ).with_model("gemini", GEMINI_VISION_MODEL)
        
        # Prepare image attachments
        file_contents = []
        for file_path, mime_type in zip(file_paths, file_types):
            if os.path.exists(file_path):
                file_content = FileContentWithMimeType(
                    file_path=file_path,
                    mime_type=mime_type
                )
                file_contents.append(file_content)
        
        # Prepare prompt
        prompt_parts = []
        
        if additional_context:
            prompt_parts.append(f"Contexto Clínico do Paciente:\n{additional_context}\n\n")
        
        prompt_parts.append(f"Analise VISUALMENTE a(s) {len(file_contents)} imagem(ns) médica(s) anexada(s).\n")
        prompt_parts.append("Descreva DETALHADAMENTE tudo que você VÊ nas imagens.\n")
        prompt_parts.append("Forneça análise radiológica/laboratorial completa no formato JSON especificado.")
        
        prompt = "".join(prompt_parts)
        
        # Send message WITH image attachments
        user_message = UserMessage(
            text=prompt,
            file_contents=file_contents
        )
        
        print(f"[VISION] Analyzing {len(file_contents)} medical image(s) with Gemini 2.5 Flash...")
        response = await chat.send_message(user_message)
        print(f"[VISION] Response received: {len(response)} characters")
        
        # Parse JSON response
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif response_text.startswith("```"):
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        result = json.loads(response_text)
        
        # Ensure recommendations is a list
        if isinstance(result.get('recommendations'), str):
            result['recommendations'] = [result['recommendations']]
        elif not result.get('recommendations'):
            result['recommendations'] = ["Correlacionar achados com quadro clínico"]
        
        return result
        
    except json.JSONDecodeError as e:
        print(f"[VISION] JSON Decode Error: {e}")
        print(f"[VISION] Response was: {response}")
        return {
            "findings": "Erro ao processar resposta da análise visual",
            "interpretation": f"Sistema processou a imagem mas houve erro no formato da resposta: {str(e)}",
            "diagnosis": "Análise visual incompleta - revisar imagem manualmente",
            "recommendations": [
                "Visualizar imagem diretamente",
                "Repetir análise",
                "Considerar análise manual por especialista"
            ]
        }
    except Exception as e:
        print(f"[VISION] Error analyzing exam with vision: {e}")
        import traceback
        traceback.print_exc()
        raise


async def analyze_multiple_exam_images(files, additional_info="", user_id=None, user_name=None):
    """
    Analisa múltiplas imagens de exames médicos COM VISÃO
    
    Args:
        files: Lista de dicts com file_path e mime_type
        additional_info: Contexto clínico adicional
        user_id: ID do usuário
        user_name: Nome do usuário
    """
    try:
        if not files:
            return {
                "findings": "Nenhum arquivo fornecido",
                "interpretation": "Não foi possível realizar análise sem imagens de exame",
                "diagnosis": "Análise não realizada",
                "recommendations": ["Anexar imagens de exames médicos"]
            }
        
        # Extract file paths and types
        file_paths = []
        file_types = []
        
        for file_info in files:
            if isinstance(file_info, dict):
                file_path = file_info.get('file_path')
                mime_type = file_info.get('mime_type', 'application/octet-stream')
                
                if file_path and os.path.exists(file_path):
                    file_paths.append(file_path)
                    file_types.append(mime_type)
                    print(f"[VISION] Processing file: {file_path} ({mime_type})")
        
        if not file_paths:
            return {
                "findings": "Arquivos fornecidos mas não foram encontrados no servidor",
                "interpretation": "Erro ao acessar arquivos de exame",
                "diagnosis": "Análise não realizada - erro de upload",
                "recommendations": [
                    "Tentar fazer upload novamente",
                    "Verificar formato do arquivo (PNG, JPG, PDF suportados)",
                    "Verificar tamanho do arquivo"
                ]
            }
        
        # Analyze with vision
        result = await analyze_exam_with_vision(
            file_paths=file_paths,
            file_types=file_types,
            additional_context=additional_info
        )
        
        # Add metadata
        if user_id:
            result["_user_id"] = user_id
        if user_name:
            result["_user_name"] = user_name
        
        return result
        
    except Exception as e:
        print(f"[VISION] Error in analyze_multiple_exam_images: {e}")
        import traceback
        traceback.print_exc()
        return {
            "findings": f"Erro ao processar imagens: {str(e)}",
            "interpretation": "Sistema temporariamente indisponível para análise visual",
            "diagnosis": "Análise não completada - erro técnico",
            "recommendations": [
                "Tentar novamente",
                "Se persistir, análise manual recomendada",
                "Verificar logs do sistema"
            ]
        }


# Backward compatibility alias
async def analyze_exam_image(files, additional_info="", user_id=None, user_name=None):
    """Alias for backward compatibility"""
    return await analyze_multiple_exam_images(files, additional_info, user_id, user_name)
