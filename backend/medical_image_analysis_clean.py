"""
Medical Image Analysis Engine with Vision
Uses Gemini 2.5 Flash for direct image analysis (supports vision)
Supports: Lab exams only
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
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY", "sk-emergent-b51Fb1fC8C81f9e13D")


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
