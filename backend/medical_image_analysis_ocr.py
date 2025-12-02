"""
Medical Image Analysis Engine - V2 with OCR
Uses Gemini 2.0 Flash for text analysis after OCR extraction
Supports: Lab exams, X-rays, CT scans, MRI, etc.
"""
import os
import base64
import io
from typing import Dict, Any, Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage
from PIL import Image
import pytesseract
import json

# Get Emergent Universal Key from environment
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
if not EMERGENT_KEY:
    raise ValueError("EMERGENT_LLM_KEY environment variable is required but not set")


def extract_text_from_image(image_data: str) -> str:
    """
    Extract text from image using OCR
    
    Args:
        image_data: Base64 encoded image
    
    Returns:
        Extracted text
    """
    try:
        # Decode base64
        image_bytes = base64.b64decode(image_data)
        
        # Open image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Extract text using OCR (Portuguese + English)
        text = pytesseract.image_to_string(image, lang='por+eng')
        
        return text.strip()
    except Exception as e:
        print(f"⚠️ OCR Error: {e}")
        return ""


async def analyze_exam_image(image_data: str, image_type: str, additional_info: str = "") -> Dict[str, Any]:
    """
    Analyze medical exam images (laboratory results)
    """
    try:
        print("🔍 Iniciando análise de exame...")
        
        # Extract text from image using OCR
        if image_type.startswith('image/'):
            print("📸 Extraindo texto da imagem com OCR...")
            extracted_text = extract_text_from_image(image_data)
            
            if not extracted_text:
                return {
                    "exam_type": "Erro na Extração",
                    "altered_values": [],
                    "clinical_interpretation": "Não foi possível extrair texto da imagem. Verifique se a imagem está legível e tente novamente.",
                    "overall_severity": "Indeterminada",
                    "recommendations": [
                        "Tire uma foto mais clara e bem iluminada",
                        "Certifique-se de que o texto está legível",
                        "Evite sombras e reflexos"
                    ],
                    "urgent_attention": False,
                    "additional_notes": "Falha na extração de texto por OCR"
                }
            
            print(f"✅ Texto extraído ({len(extracted_text)} caracteres)")
        else:
            # For text documents, use directly
            extracted_text = image_data
        
        # Create system prompt for lab exam analysis
        system_prompt = """Você é um médico especializado em análise de exames laboratoriais.

Analise o texto do exame fornecido e identifique:

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
  "clinical_interpretation": "Interpretação clínica detalhada",
  "overall_severity": "Leve/Moderada/Grave/Normal",
  "recommendations": ["Recomendação 1", "Recomendação 2"],
  "urgent_attention": true/false,
  "additional_notes": "Observações adicionais"
}"""

        # Build user prompt
        additional_context = ""
        if additional_info:
            additional_context = f"\n\n**Informações Adicionais do Paciente:**\n{additional_info}"
        
        user_prompt = f"""Analise o seguinte texto extraído de um exame laboratorial:

**TEXTO DO EXAME:**
{extracted_text}
{additional_context}

Por favor, forneça uma análise completa em formato JSON identificando alterações e sua relevância clínica."""

        print("🤖 Enviando para análise com Gemini 2.0 Flash...")
        
        # Create chat
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id="meduf-exam-analysis",
            system_message=system_prompt
        ).with_model("gemini", "gemini-2.0-flash")

        # Send message
        response = await chat.send_message(UserMessage(text=user_prompt))
        
        print("📊 Resposta recebida, processando...")
        
        # Parse JSON response
        response_text = response.strip()
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        try:
            analysis = json.loads(response_text)
            print("✅ Análise concluída com sucesso!")
            return analysis
        except json.JSONDecodeError:
            print("⚠️ Resposta não estruturada, retornando texto")
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
        print(f"❌ Erro na análise: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "exam_type": "Erro na Análise",
            "altered_values": [],
            "clinical_interpretation": f"Ocorreu um erro ao processar o exame: {str(e)}",
            "overall_severity": "Indeterminada",
            "recommendations": [
                "Tente fazer o upload novamente",
                "Verifique se a imagem está legível",
                "Consulte um médico para análise presencial"
            ],
            "urgent_attention": False,
            "additional_notes": f"Erro técnico: {str(e)}"
        }


async def analyze_xray_image(image_data: str, image_type: str, body_region: str = "", additional_info: str = "") -> Dict[str, Any]:
    """
    Analyze X-ray images using OCR + text analysis
    """
    try:
        print("🔍 Iniciando análise de raio-X...")
        
        # Extract text from image if available
        extracted_text = ""
        if image_type.startswith('image/'):
            print("📸 Extraindo texto da imagem com OCR...")
            extracted_text = extract_text_from_image(image_data)
            print(f"📝 Texto extraído: {len(extracted_text)} caracteres")
        
        # Create system prompt
        system_prompt = """Você é um médico radiologista especializado.

Para raios-X, analise a descrição/informações disponíveis e forneça:

1. **Região Anatômica** - Identifique a região do corpo
2. **Achados** - Liste achados normais e anormais quando possível
3. **Impressão Diagnóstica** - Forneça hipóteses diagnósticas
4. **Recomendações** - Sugira exames complementares ou condutas

**NOTA:** Como estou analisando informações textuais (não a imagem diretamente), fornecerei uma análise baseada nos dados disponíveis e orientações gerais.

**FORMATO DA RESPOSTA (JSON):**
{
  "body_region": "Região anatômica",
  "technical_quality": "Avaliação baseada em informações disponíveis",
  "normal_findings": ["Achado normal esperado 1"],
  "abnormal_findings": [
    {
      "finding": "Descrição",
      "location": "Localização",
      "severity": "Leve/Moderada/Grave",
      "clinical_significance": "Significado clínico"
    }
  ],
  "diagnostic_impression": "Impressão diagnóstica",
  "differential_diagnosis": ["Hipótese 1"],
  "overall_severity": "Normal/Leve/Moderada/Grave",
  "recommendations": ["Recomendação 1"],
  "urgent_attention": false,
  "additional_notes": "Observações"
}"""

        # Build prompt
        region_text = f"Região do Corpo: {body_region}\n" if body_region else ""
        clinical_text = f"Informações Clínicas: {additional_info}\n" if additional_info else ""
        ocr_text = f"\nTexto Extraído da Imagem:\n{extracted_text}\n" if extracted_text else ""
        
        user_prompt = f"""Analise o raio-X com as seguintes informações:

{region_text}{clinical_text}{ocr_text}

**IMPORTANTE:** Estou fornecendo uma análise assistida. Para interpretação radiológica definitiva, é essencial a avaliação da imagem por um radiologista qualificado.

Por favor, forneça uma análise em formato JSON com orientações clínicas gerais."""

        print("🤖 Enviando para análise com Gemini 2.0 Flash...")
        
        # Create chat
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id="meduf-xray-analysis",
            system_message=system_prompt
        ).with_model("gemini", "gemini-2.0-flash")

        # Send message
        response = await chat.send_message(UserMessage(text=user_prompt))
        
        print("📊 Resposta recebida, processando...")
        
        # Parse response
        response_text = response.strip()
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        try:
            analysis = json.loads(response_text)
            print("✅ Análise concluída com sucesso!")
            return analysis
        except json.JSONDecodeError:
            print("⚠️ Resposta não estruturada")
            return {
                "body_region": body_region or "Não especificada",
                "technical_quality": "Análise textual",
                "normal_findings": [],
                "abnormal_findings": [],
                "diagnostic_impression": response_text,
                "differential_diagnosis": [],
                "overall_severity": "Avaliar",
                "recommendations": ["Avaliação radiológica presencial recomendada"],
                "urgent_attention": False,
                "additional_notes": "Resposta em formato texto"
            }
        
    except Exception as e:
        print(f"❌ Erro na análise: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "body_region": body_region or "Não especificada",
            "technical_quality": "Erro no processamento",
            "normal_findings": [],
            "abnormal_findings": [],
            "diagnostic_impression": f"Erro ao processar: {str(e)}",
            "differential_diagnosis": [],
            "overall_severity": "Indeterminada",
            "recommendations": [
                "Tente novamente com uma imagem mais clara",
                "Consulte um radiologista para análise presencial"
            ],
            "urgent_attention": False,
            "additional_notes": f"Erro técnico: {str(e)}"
        }
