"""
Medical Image Analysis Engine
Uses Gemini 2.0 Flash for analyzing medical images and exam reports
Supports: Lab exams, X-rays, CT scans, MRI, etc.
"""
import os
import base64
from typing import Dict, Any, Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json

# Get Emergent Universal Key from environment
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
if not EMERGENT_KEY:
    raise ValueError("EMERGENT_LLM_KEY environment variable is required but not set")


async def analyze_exam_image(image_data: str, image_type: str, additional_info: str = "") -> Dict[str, Any]:
    """
    Analyze medical exam images (laboratory results)
    
    Args:
        image_data: Base64 encoded image or file content
        image_type: Type of file (image/jpeg, image/png, application/pdf, etc)
        additional_info: Additional patient information or context
    
    Returns:
        Dict with analysis results
    """
    try:
        # Create system prompt for lab exam analysis
        system_prompt = """Você é um médico especializado em análise de exames laboratoriais.
        
Analise a imagem/documento do exame fornecido e identifique:

1. **Tipo de Exame** - Identifique qual(is) exame(s) está(ão) presente(s)
2. **Valores Alterados** - Liste TODOS os parâmetros fora dos valores de referência
3. **Análise Clínica** - Interprete o significado clínico das alterações
4. **Gravidade** - Classifique a gravidade das alterações (Leve/Moderada/Grave)
5. **Recomendações** - Sugira condutas, exames complementares ou avaliações necessárias

**IMPORTANTE:**
- Seja preciso e técnico
- Destaque valores críticos ou muito alterados
- Use terminologia médica brasileira
- Indique se há necessidade de avaliação urgente
- Compare com valores de referência quando disponíveis

**FORMATO DA RESPOSTA (JSON):**
```json
{
  "exam_type": "Tipo do exame identificado",
  "altered_values": [
    {
      "parameter": "Nome do parâmetro",
      "value": "Valor encontrado",
      "reference": "Valor de referência",
      "status": "Aumentado/Diminuído",
      "severity": "Leve/Moderada/Grave"
    }
  ],
  "clinical_interpretation": "Interpretação clínica detalhada das alterações",
  "overall_severity": "Leve/Moderada/Grave/Normal",
  "recommendations": [
    "Recomendação 1",
    "Recomendação 2"
  ],
  "urgent_attention": true/false,
  "additional_notes": "Observações adicionais importantes"
}
```"""

        # Create prompt with additional context
        additional_context = f"**Informações Adicionais do Paciente:**\n{additional_info}\n" if additional_info else ""
        
        user_prompt = f"""Analise o exame laboratorial fornecido na imagem/documento.

{additional_context}

Por favor, forneça uma análise completa identificando alterações e sua relevância clínica."""

        # Create chat with image support
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"meduf-exam-analysis",
            system_message=system_prompt
        ).with_model("gemini", "gemini-2.0-flash")

        # Send message with image
        if image_type.startswith('image/'):
            # For images, send as base64
            message = UserMessage(
                text=user_prompt,
                images=[image_data]  # Gemini can handle base64 images
            )
        else:
            # For text documents (extracted text from PDF/DOC)
            message = UserMessage(text=f"{user_prompt}\n\n**Conteúdo do Documento:**\n{image_data}")

        response = await chat.send_message(message)
        
        # Parse JSON response
        response_text = response.strip()
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        try:
            analysis = json.loads(response_text)
            return analysis
        except json.JSONDecodeError:
            # If JSON parsing fails, return structured fallback
            return {
                "exam_type": "Exame Laboratorial",
                "altered_values": [],
                "clinical_interpretation": response_text,
                "overall_severity": "Avaliar",
                "recommendations": ["Consulte um médico para interpretação completa"],
                "urgent_attention": False,
                "additional_notes": "Resposta em formato não estruturado"
            }
        
    except Exception as e:
        print(f"⚠️ Error analyzing exam: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "exam_type": "Erro na Análise",
            "altered_values": [],
            "clinical_interpretation": f"Não foi possível processar a imagem do exame. Erro: {str(e)}",
            "overall_severity": "Indeterminada",
            "recommendations": [
                "Tente fazer o upload novamente",
                "Verifique se a imagem está legível",
                "Consulte um médico para análise presencial"
            ],
            "urgent_attention": False,
            "additional_notes": "Erro no processamento da imagem"
        }


async def analyze_xray_image(image_data: str, image_type: str, body_region: str = "", additional_info: str = "") -> Dict[str, Any]:
    """
    Analyze X-ray images
    
    Args:
        image_data: Base64 encoded image
        image_type: Type of file (image/jpeg, image/png, etc)
        body_region: Region of the body (chest, abdomen, limbs, etc)
        additional_info: Additional patient information or clinical context
    
    Returns:
        Dict with analysis results
    """
    try:
        # Create system prompt for X-ray analysis
        system_prompt = """Você é um médico radiologista especializado em análise de raios-X.

Analise a imagem radiográfica fornecida e identifique:

1. **Região Anatômica** - Identifique a região do corpo radiografada
2. **Qualidade Técnica** - Avalie a qualidade da imagem (posicionamento, penetração, etc)
3. **Achados Normais** - Descreva estruturas anatômicas visualizadas normais
4. **Alterações Identificadas** - Liste TODAS as alterações ou anormalidades detectadas
5. **Impressão Diagnóstica** - Forneça hipóteses diagnósticas baseadas nos achados
6. **Gravidade** - Classifique a gravidade dos achados
7. **Recomendações** - Sugira exames complementares ou condutas

**IMPORTANTE:**
- Seja preciso na descrição radiológica
- Use terminologia médica padronizada (padrão Fleischner quando aplicável)
- Destaque achados críticos ou suspeitos
- Indique se há necessidade de correlação clínica
- Mencione limitações da radiografia simples quando relevante

**FORMATO DA RESPOSTA (JSON):**
```json
{
  "body_region": "Região anatômica identificada",
  "technical_quality": "Boa/Adequada/Limitada - descrição",
  "normal_findings": ["Achado normal 1", "Achado normal 2"],
  "abnormal_findings": [
    {
      "finding": "Descrição do achado anormal",
      "location": "Localização específica",
      "severity": "Leve/Moderada/Grave",
      "clinical_significance": "Significado clínico"
    }
  ],
  "diagnostic_impression": "Impressão diagnóstica principal",
  "differential_diagnosis": ["Hipótese 1", "Hipótese 2"],
  "overall_severity": "Normal/Leve/Moderada/Grave/Crítica",
  "recommendations": [
    "Recomendação 1",
    "Recomendação 2"
  ],
  "urgent_attention": true/false,
  "additional_notes": "Observações ou limitações do exame"
}
```"""

        # Create prompt with context
        region_text = f"**Região do Corpo:** {body_region}\n" if body_region else ""
        clinical_info = f"**Informações Clínicas:**\n{additional_info}\n" if additional_info else ""
        
        user_prompt = f"""Analise a imagem de raio-X fornecida.

{region_text}{clinical_info}

Por favor, forneça uma análise radiológica completa identificando alterações e sua relevância clínica."""

        # Create chat with image support
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"meduf-xray-analysis",
            system_message=system_prompt
        ).with_model("gemini", "gemini-2.0-flash")

        # Send message with image
        message = UserMessage(
            text=user_prompt,
            images=[image_data]  # Gemini 2.0 Flash supports vision
        )

        response = await chat.send_message(message)
        
        # Parse JSON response
        response_text = response.strip()
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        try:
            analysis = json.loads(response_text)
            return analysis
        except json.JSONDecodeError:
            # If JSON parsing fails, return structured fallback
            return {
                "body_region": body_region or "Não especificada",
                "technical_quality": "Avaliar",
                "normal_findings": [],
                "abnormal_findings": [],
                "diagnostic_impression": response_text,
                "differential_diagnosis": [],
                "overall_severity": "Avaliar",
                "recommendations": ["Correlação clínica recomendada"],
                "urgent_attention": False,
                "additional_notes": "Resposta em formato não estruturado"
            }
        
    except Exception as e:
        print(f"⚠️ Error analyzing X-ray: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "body_region": body_region or "Não especificada",
            "technical_quality": "Não avaliada",
            "normal_findings": [],
            "abnormal_findings": [],
            "diagnostic_impression": f"Não foi possível processar a imagem. Erro: {str(e)}",
            "differential_diagnosis": [],
            "overall_severity": "Indeterminada",
            "recommendations": [
                "Tente fazer o upload novamente",
                "Verifique se a imagem está legível e em formato correto",
                "Consulte um radiologista para análise presencial"
            ],
            "urgent_attention": False,
            "additional_notes": "Erro no processamento da imagem"
        }
