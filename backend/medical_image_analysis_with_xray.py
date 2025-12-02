"""
Medical Image Analysis Engine with Vision
Uses Gemini 2.5 Flash for direct image analysis (supports vision)
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
    Extract text from image using OCR (fallback)
    """
    try:
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        text = pytesseract.image_to_string(image, lang='por+eng')
        return text.strip()
    except Exception as e:
        print(f"⚠️ OCR Error: {e}")
        return ""


async def analyze_exam_image(image_data: str, image_type: str, additional_info: str = "") -> Dict[str, Any]:
    """
    Analyze medical exam images (laboratory results) using Gemini 2.5 Flash with vision
    """
    try:
        print("🔍 Iniciando análise de exame com Gemini 2.5 Flash (Vision)...")
        
        # Prepare image data
        if image_type.startswith('image/'):
            # Use image directly for vision model
            image_base64 = image_data
            print("📸 Usando análise visual direta com Gemini 2.5 Flash")
        else:
            # For non-images, use OCR
            print("📄 Extraindo texto com OCR...")
            image_base64 = None
            extracted_text = image_data
        
        # Create system prompt for lab exam analysis
        system_prompt = """Você é um médico especializado em análise de exames laboratoriais.

Analise a IMAGEM do exame fornecido e identifique:

1. **Tipo de Exame** - Identifique qual(is) exame(s) está(ão) presente(s)
2. **Valores Alterados** - Liste TODOS os parâmetros fora dos valores de referência
3. **Análise Clínica** - Interprete o significado clínico das alterações
4. **Gravidade** - Classifique a gravidade das alterações (Leve/Moderada/Grave)
5. **Recomendações** - Sugira condutas, exames complementares ou avaliações necessárias

**IMPORTANTE:**
- Leia TODOS os valores visíveis na imagem
- Seja preciso e técnico
- Destaque valores críticos ou muito alterados
- Use terminologia médica brasileira
- Indique se há necessidade de avaliação urgente
- Compare com valores de referência quando disponíveis no exame

**FORMATO DA RESPOSTA (APENAS JSON, SEM TEXTO EXTRA):**
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

        # Build user prompt
        additional_context = ""
        if additional_info:
            additional_context = f"\n\n**Informações Adicionais do Paciente:**\n{additional_info}"
        
        if image_base64:
            user_prompt = f"""Analise a IMAGEM do exame laboratorial fornecido.
{additional_context}

Por favor, leia todos os valores visíveis na imagem e forneça uma análise completa em formato JSON identificando todas as alterações e sua relevância clínica."""
        else:
            user_prompt = f"""Analise o seguinte texto de exame laboratorial:

**TEXTO DO EXAME:**
{extracted_text}
{additional_context}

Por favor, forneça uma análise completa em formato JSON."""

        print("🤖 Enviando para Gemini 2.5 Flash com suporte a visão...")
        
        # Create chat with Gemini 2.5 Flash (supports vision)
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id="meduf-exam-vision",
            system_message=system_prompt
        ).with_model("gemini", "gemini-2.5-flash")

        # Send message with image if available
        if image_base64:
            # Send with image
            message = UserMessage(
                text=user_prompt,
                image_url=f"data:{image_type};base64,{image_base64}"
            )
        else:
            # Send text only
            message = UserMessage(text=user_prompt)

        response = await chat.send_message(message)
        
        print("📊 Resposta recebida do Gemini, processando...")
        
        # Parse JSON response
        response_text = response.strip() if isinstance(response, str) else str(response)
        
        # Extract JSON from markdown code blocks
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        try:
            analysis = json.loads(response_text)
            print("✅ Análise concluída com sucesso!")
            return analysis
        except json.JSONDecodeError:
            print("⚠️ Resposta não estruturada, retornando como texto")
            return {
                "exam_type": "Exame Laboratorial",
                "altered_values": [],
                "clinical_interpretation": response_text,
                "overall_severity": "Avaliar",
                "recommendations": ["Consulte um médico para interpretação completa"],
                "urgent_attention": False,
                "additional_notes": "Resposta em formato texto - análise manual recomendada"
            }
        
    except Exception as e:
        print(f"❌ Erro na análise: {e}")
        import traceback
        traceback.print_exc()
        
        # Try fallback with OCR if image analysis failed
        if image_type.startswith('image/'):
            print("🔄 Tentando fallback com OCR...")
            try:
                extracted_text = extract_text_from_image(image_data)
                if extracted_text:
                    print("📝 OCR bem-sucedido, reprocessando...")
                    # Retry with extracted text
                    return await analyze_exam_image(extracted_text, "text/plain", additional_info)
            except:
                pass
        
        return {
            "exam_type": "Erro na Análise",
            "altered_values": [],
            "clinical_interpretation": f"Ocorreu um erro ao processar o exame: {str(e)}",
            "overall_severity": "Indeterminada",
            "recommendations": [
                "Tente fazer o upload novamente",
                "Verifique se a imagem está legível",
                "Tire uma foto mais clara e bem iluminada",
                "Consulte um médico para análise presencial"
            ],
            "urgent_attention": False,
            "additional_notes": f"Erro técnico: {str(e)}"
        }


async def analyze_xray_image(image_data: str, image_type: str, body_region: str = "", additional_info: str = "") -> Dict[str, Any]:
    """
    Analyze X-ray images using Gemini 2.5 Flash with vision
    """
    try:
        print("🔍 Iniciando análise de raio-X com Gemini 2.5 Flash (Vision)...")
        
        if not image_type.startswith('image/'):
            return {
                "body_region": body_region or "Não especificada",
                "technical_quality": "Formato não suportado",
                "normal_findings": [],
                "abnormal_findings": [],
                "diagnostic_impression": "Por favor, envie uma imagem (JPG ou PNG) do raio-X.",
                "differential_diagnosis": [],
                "overall_severity": "Indeterminada",
                "recommendations": ["Envie uma imagem válida do raio-X"],
                "urgent_attention": False,
                "additional_notes": "Apenas imagens são aceitas para análise de raio-X"
            }
        
        print("📸 Usando análise visual direta com Gemini 2.5 Flash")
        
        # Create system prompt for X-ray analysis
        system_prompt = """Você é um médico radiologista especializado em análise de raios-X.

Analise a IMAGEM de raio-X fornecida e identifique:

1. **Região Anatômica** - Identifique a região do corpo radiografada
2. **Qualidade Técnica** - Avalie a qualidade da imagem (posicionamento, penetração, etc)
3. **Achados Normais** - Descreva estruturas anatômicas visualizadas normais
4. **Alterações Identificadas** - Liste TODAS as alterações ou anormalidades detectadas
5. **Impressão Diagnóstica** - Forneça hipóteses diagnósticas baseadas nos achados
6. **Gravidade** - Classifique a gravidade dos achados
7. **Recomendações** - Sugira exames complementares ou condutas

**IMPORTANTE:**
- Analise CUIDADOSAMENTE a imagem radiográfica
- Seja preciso na descrição radiológica
- Use terminologia médica padronizada
- Destaque achados críticos ou suspeitos
- Indique se há necessidade de correlação clínica
- Mencione limitações quando relevante

**FORMATO DA RESPOSTA (APENAS JSON, SEM TEXTO EXTRA):**
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

        # Build prompt
        region_text = f"Região do Corpo Informada: {body_region}\n" if body_region else ""
        clinical_text = f"Informações Clínicas: {additional_info}\n" if additional_info else ""
        
        user_prompt = f"""Analise a IMAGEM de raio-X fornecida.

{region_text}{clinical_text}

Por favor, forneça uma análise radiológica completa em formato JSON identificando todas as alterações visíveis e sua relevância clínica."""

        print("🤖 Enviando para Gemini 2.5 Flash com suporte a visão...")
        
        # Create chat with Gemini 2.5 Flash (supports vision)
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id="meduf-xray-vision",
            system_message=system_prompt
        ).with_model("gemini", "gemini-2.5-flash")

        # Send message with image
        message = UserMessage(
            text=user_prompt,
            image_url=f"data:{image_type};base64,{image_data}"
        )

        response = await chat.send_message(message)
        
        print("📊 Resposta recebida do Gemini, processando...")
        
        # Parse response
        response_text = response.strip() if isinstance(response, str) else str(response)
        
        # Extract JSON
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        try:
            analysis = json.loads(response_text)
            print("✅ Análise de raio-X concluída com sucesso!")
            return analysis
        except json.JSONDecodeError:
            print("⚠️ Resposta não estruturada")
            return {
                "body_region": body_region or "Não especificada",
                "technical_quality": "Análise visual realizada",
                "normal_findings": [],
                "abnormal_findings": [],
                "diagnostic_impression": response_text,
                "differential_diagnosis": [],
                "overall_severity": "Avaliar",
                "recommendations": ["Correlação clínica recomendada"],
                "urgent_attention": False,
                "additional_notes": "Resposta em formato texto - avaliação radiológica presencial recomendada"
            }
        
    except Exception as e:
        print(f"❌ Erro na análise de raio-X: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "body_region": body_region or "Não especificada",
            "technical_quality": "Erro no processamento",
            "normal_findings": [],
            "abnormal_findings": [],
            "diagnostic_impression": f"Erro ao processar imagem: {str(e)}",
            "differential_diagnosis": [],
            "overall_severity": "Indeterminada",
            "recommendations": [
                "Tente novamente com uma imagem mais clara",
                "Verifique se a imagem está em formato JPG ou PNG",
                "Consulte um radiologista para análise presencial"
            ],
            "urgent_attention": False,
            "additional_notes": f"Erro técnico: {str(e)}"
        }
