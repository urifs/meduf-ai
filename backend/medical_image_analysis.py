"""
Medical Image Analysis Engine with Vision
Uses Gemini 2.5 Flash for direct image analysis (supports vision)
Supports: Lab exams only
"""
import os
import base64
import io
from typing import Dict, Any, Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContent
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
            # Send with image using FileContent
            file_content = FileContent(
                content_type=image_type,
                file_content_base64=image_base64
            )
            message = UserMessage(
                text=user_prompt,
                file_contents=[file_content]
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



async def analyze_multiple_exam_images(files_data: list, additional_info: str = "", user_id: str = None, user_name: str = None) -> Dict[str, Any]:
    """
    Analyze multiple exam images (for multi-page exams)
    Combines all pages into a single comprehensive analysis
    """
    try:
        print(f"🔍 Analisando {len(files_data)} páginas de exame...")
        
        if len(files_data) == 1:
            # Single file - use regular analysis
            return await analyze_exam_image(
                files_data[0]['data'],
                files_data[0]['type'],
                additional_info
            )
        
        # Multiple files - combine all images/text
        all_text = []
        all_images_base64 = []
        
        for idx, file_data in enumerate(files_data):
            print(f"  Processando página {idx + 1}/{len(files_data)}")
            
            if file_data['type'].startswith('image/'):
                all_images_base64.append({
                    'data': file_data['data'],
                    'type': file_data['type'],
                    'page': idx + 1
                })
            else:
                # Text content
                all_text.append(f"--- Página {idx + 1} ---\n{file_data['data']}\n")
        
        # If we have images, analyze them with Gemini 2.5 Flash
        if all_images_base64:
            print(f"📸 Analisando {len(all_images_base64)} imagens com Gemini 2.5 Flash")
            
            # Build comprehensive prompt
            system_prompt = """Você é um médico especializado em análise de exames laboratoriais.

Você receberá MÚLTIPLAS PÁGINAS de um mesmo exame ou de exames relacionados.

Analise TODAS as páginas fornecidas e:

1. **Tipo de Exame(s)** - Identifique todos os exames presentes em todas as páginas
2. **Valores Alterados** - Liste TODOS os parâmetros fora dos valores de referência de TODAS as páginas
3. **Análise Clínica Integrada** - Interprete o significado clínico combinado de todas as alterações
4. **Gravidade Geral** - Classifique considerando todos os achados
5. **Recomendações Consolidadas** - Sugira condutas baseadas em todas as informações

**IMPORTANTE:**
- Analise TODAS as páginas fornecidas
- Integre os achados de todas as páginas
- Se houver páginas duplicadas, considere apenas uma vez
- Seja preciso e técnico
- Use terminologia médica brasileira

**FORMATO DA RESPOSTA (APENAS JSON, SEM TEXTO EXTRA):**
```json
{
  "exam_type": "Tipo(s) do(s) exame(s) identificado(s) em todas as páginas",
  "pages_analyzed": 2,
  "altered_values": [
    {
      "parameter": "Nome do parâmetro",
      "value": "Valor encontrado",
      "reference": "Valor de referência",
      "status": "Aumentado/Diminuído",
      "severity": "Leve/Moderada/Grave",
      "page": 1
    }
  ],
  "clinical_interpretation": "Interpretação clínica integrada de todas as páginas",
  "overall_severity": "Leve/Moderada/Grave/Normal",
  "recommendations": ["Recomendação 1", "Recomendação 2"],
  "urgent_attention": true/false,
  "additional_notes": "Observações sobre o exame completo"
}
```"""

            additional_context = ""
            if additional_info:
                additional_context = f"\n\n**Informações Adicionais do Paciente:**\n{additional_info}"
            
            user_prompt = f"""Analise TODAS as {len(all_images_base64)} páginas do exame laboratorial fornecidas.
{additional_context}

Por favor, forneça uma análise INTEGRADA em formato JSON considerando TODAS as páginas."""

            print("🤖 Enviando para Gemini 2.5 Flash com visão...")
            
            # Create chat with Gemini 2.5 Flash
            chat = LlmChat(
                api_key=EMERGENT_KEY,
                session_id="meduf-exam-multi-vision",
                system_message=system_prompt
            ).with_model("gemini", "gemini-2.5-flash")

            # Create FileContent for all images
            file_contents = []
            for img_data in all_images_base64:
                file_content = FileContent(
                    content_type=img_data['type'],
                    file_content_base64=img_data['data']
                )
                file_contents.append(file_content)
            
            # Send message with all images
            message = UserMessage(
                text=user_prompt,
                file_contents=file_contents
            )

            response = await chat.send_message(message)
            
            print("📊 Resposta recebida, processando...")
            
            # Parse JSON response
            response_text = response.strip() if isinstance(response, str) else str(response)
            
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            try:
                analysis = json.loads(response_text)
                analysis['pages_analyzed'] = len(files_data)
                print(f"✅ Análise de {len(files_data)} páginas concluída!")
                return analysis
            except json.JSONDecodeError:
                print("⚠️ Resposta não estruturada")
                return {
                    "exam_type": f"Exame Laboratorial ({len(files_data)} páginas)",
                    "pages_analyzed": len(files_data),
                    "altered_values": [],
                    "clinical_interpretation": response_text,
                    "overall_severity": "Avaliar",
                    "recommendations": ["Consulte um médico para interpretação completa"],
                    "urgent_attention": False,
                    "additional_notes": "Resposta em formato texto"
                }
        
        else:
            # Text only - combine and analyze
            combined_text = "\n\n".join(all_text)
            return await analyze_exam_image(combined_text, "text/plain", additional_info)
        
    except Exception as e:
        print(f"❌ Erro na análise de múltiplas páginas: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "exam_type": f"Erro na Análise ({len(files_data)} páginas)",
            "pages_analyzed": len(files_data),
            "altered_values": [],
            "clinical_interpretation": f"Erro ao processar {len(files_data)} páginas: {str(e)}",
            "overall_severity": "Indeterminada",
            "recommendations": [
                "Tente fazer o upload novamente",
                "Verifique se todas as imagens estão legíveis",
                "Consulte um médico para análise presencial"
            ],
            "urgent_attention": False,
            "additional_notes": f"Erro técnico: {str(e)}"
        }
