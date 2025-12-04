"""
AI Medical Consensus Engine
Uses Gemini 2.0 Flash for medical diagnosis
Production-ready implementation with Emergent Universal Key
"""
import os
import asyncio
from typing import Dict, List, Any, Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Emergent Universal Key from environment
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
if not EMERGENT_KEY:
    raise ValueError("EMERGENT_LLM_KEY environment variable is required but not set")

# Gemini 2.0 Flash model
GEMINI_MODEL = "gemini-2.0-flash"

MEDICAL_SYSTEM_PROMPT = """Você é um assistente clínico especializado para MÉDICOS PROFISSIONAIS. Este sistema é usado por médicos durante consultas. Forneça análise técnica detalhada:

1. **Diagnósticos Diferenciais** (3-5 hipóteses mais prováveis)
2. **Justificativas Clínicas** baseadas em fisiopatologia
3. **Conduta Proposta** (exames complementares, scores clínicos)
4. **Terapêutica Sugerida** (medicações com doses, esquemas terapêuticos)

**DIRETRIZES TÉCNICAS:**
- Use terminologia médica técnica (não simplifique para leigos)
- Baseie-se em guidelines atualizados (UpToDate, Diretrizes Brasileiras)
- Considere diagnósticos diferenciais por ordem de probabilidade
- Sugira exames laboratoriais e de imagem específicos
- Forneça doses, vias e esquemas terapêuticos completos
- Indique critérios de gravidade e necessidade de internação quando aplicável

**ESTRUTURA DA RESPOSTA:**
```json
{
  "diagnoses": [
    {
      "name": "Nome do Diagnóstico",
      "justification": "Justificativa clínica detalhada"
    }
  ],
  "conduct": {
    "advice": "Conduta geral e recomendações",
    "procedures": ["Procedimento 1", "Procedimento 2"]
  },
  "medications": [
    {
      "name": "Nome do medicamento",
      "dosage": "Dose e via de administração",
      "mechanism": "Mecanismo de ação"
    }
  ]
}
```

Responda APENAS com o JSON, sem texto adicional."""


async def analyze_diagnosis(queixa: str, idade: str = "N/I", sexo: str = "N/I") -> Dict[str, Any]:
    """
    Gera diagnóstico usando Gemini 2.0 Flash
    
    Args:
        queixa: Descrição do caso clínico
        idade: Idade do paciente
        sexo: Sexo do paciente
        
    Returns:
        Dict com diagnoses, conduct e medications
    """
    try:
        # Create chat instance with Gemini 2.0 Flash
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"diagnosis_{os.urandom(8).hex()}",
            system_message=MEDICAL_SYSTEM_PROMPT
        ).with_model("gemini", GEMINI_MODEL)
        
        # Prepare prompt
        user_prompt = f"""
Paciente: {idade} anos, sexo {sexo}
Queixa Principal: {queixa}

Forneça análise clínica completa no formato JSON especificado.
"""
        
        # Send message
        user_message = UserMessage(text=user_prompt)
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
        print(f"JSON Decode Error: {e}")
        print(f"Response was: {response}")
        # Fallback response
        return {
            "diagnoses": [
                {
                    "name": "Análise Incompleta",
                    "justification": "Não foi possível processar a resposta completa. Por favor, tente novamente."
                }
            ],
            "conduct": {
                "advice": "Consulte um médico para avaliação completa.",
                "procedures": []
            },
            "medications": []
        }
    except Exception as e:
        print(f"Error in analyze_diagnosis: {e}")
        raise


async def analyze_drug_interaction(medications: List[str], patient_info: Optional[str] = None) -> Dict[str, Any]:
    """
    Analisa interação medicamentosa de múltiplos medicamentos usando Gemini 2.0 Flash
    Aceita de 2 a 10 medicamentos para análise completa
    """
    try:
        if not medications or len(medications) < 2:
            raise ValueError("Mínimo de 2 medicamentos necessários")
        
        medications_list = "\n".join([f"{i+1}. {med}" for i, med in enumerate(medications)])
        
        system_prompt = """Você é um farmacêutico clínico especializado auxiliando MÉDICOS PROFISSIONAIS. Analise a interação medicamentosa de TODOS os medicamentos fornecidos com detalhes técnicos:

**IMPORTANTE**: Analise TODAS as interações possíveis entre os medicamentos listados, não apenas pares isolados.

1. **Classificação de Severidade Global** (Leve/Moderada/Grave/Contraindicada) - considere a interação mais grave
2. **Farmacocinética e Farmacodinâmica** (impacto renal, hepático, interações CYP450)
3. **Mecanismo Molecular** das interações
4. **Protocolo de Monitoramento** (parâmetros laboratoriais, timing, valores críticos)

Responda APENAS com JSON:
```json
{
  "severity": "Leve|Moderada|Grave|Contraindicada",
  "summary": "Resumo breve das principais interações encontradas entre TODOS os medicamentos",
  "details": "Explicação detalhada de TODAS as interações medicamentosas identificadas (liste cada par problemático e seu impacto)",
  "recommendations": "Recomendações práticas para o médico prescritor considerando TODA a prescrição",
  "renal_impact": "Descrição do impacto renal CUMULATIVO de todos os medicamentos",
  "hepatic_impact": "Descrição do impacto hepático CUMULATIVO de todos os medicamentos",
  "mechanism": "Mecanismos das principais interações (CYP450, transportadores, farmacodinâmica)",
  "monitoring": "Texto descritivo do monitoramento necessário para TODOS os medicamentos (exames, frequência, valores críticos)"
}
```"""
        
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"interaction_{os.urandom(8).hex()}",
            system_message=system_prompt
        ).with_model("gemini", GEMINI_MODEL)
        
        prompt = f"""
MEDICAMENTOS A ANALISAR ({len(medications)} no total):
{medications_list}

{f"Informações do Paciente: {patient_info}" if patient_info else ""}

Analise TODAS as interações medicamentosas possíveis entre estes {len(medications)} medicamentos. Não analise apenas pares isolados - considere o efeito cumulativo e todas as combinações relevantes.
"""
        
        response = await chat.send_message(UserMessage(text=prompt))
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif response_text.startswith("```"):
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        result = json.loads(response_text)
        
        # Validate that severity is not an error message
        if "erro" in result.get("severity", "").lower():
            raise ValueError("Invalid severity returned")
        
        return result
        
    except Exception as e:
        print(f"Error in analyze_drug_interaction: {e}")
        # Re-raise to let task_manager retry instead of returning error response
        raise Exception(f"Falha na análise de interação medicamentosa: {str(e)}")


async def analyze_medication_guide(condition: str, patient_age: str = "N/I", contraindications: Optional[str] = None) -> Dict[str, Any]:
    """
    Gera guia terapêutico usando Gemini 2.0 Flash
    """
    try:
        system_prompt = """Você é um médico clínico especializado auxiliando MÉDICOS PROFISSIONAIS. Forneça guia terapêutico técnico:

1. **Opções Terapêuticas** (primeira linha, alternativas, adjuvantes)
2. **Posologia Completa** (dose, via, intervalo, duração, ajustes)
3. **Farmacologia Clínica** (mecanismo, farmacocinética, interações)
4. **Precauções e Contraindicações** (absolutas e relativas, ajustes especiais)

Responda APENAS com JSON contendo um objeto com a chave "medications":
```json
{
  "medications": [
    {
      "name": "Nome do medicamento",
      "dose": "Dose exata (ex: 500mg, 10mg/kg)",
      "frequency": "Frequência (ex: 8/8h, 12/12h, 1x/dia)",
      "route": "Via de administração (ex: VO, IV, IM, SC)",
      "notes": "Indicações, precauções e contraindicações importantes"
    }
  ]
}
```

Forneça 3-5 medicamentos mais adequados para o tratamento."""
        
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"medguide_{os.urandom(8).hex()}",
            system_message=system_prompt
        ).with_model("gemini", GEMINI_MODEL)
        
        prompt = f"""
Condição: {condition}
Idade do Paciente: {patient_age}
{f"Contraindicações Conhecidas: {contraindications}" if contraindications else ""}

Forneça guia terapêutico.
"""
        
        response = await chat.send_message(UserMessage(text=prompt))
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif response_text.startswith("```"):
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        result = json.loads(response_text)
        
        # Return the medications array directly, or wrap in expected format
        if isinstance(result, dict) and "medications" in result:
            return result
        elif isinstance(result, list):
            return {"medications": result}
        else:
            return {"medications": []}
        
    except Exception as e:
        print(f"Error in analyze_medication_guide: {e}")
        return {
            "medications": [{
                "name": "Sistema temporariamente indisponível",
                "dose": "N/A",
                "frequency": "N/A",
                "route": "Consultar protocolo",
                "notes": f"Consultar protocolos clínicos e guidelines atualizados. Erro: {str(e)}"
            }]
        }


async def analyze_toxicology(agent: str, exposure_route: Optional[str] = None, symptoms: Optional[str] = None) -> Dict[str, Any]:
    """
    Analisa caso toxicológico usando Gemini 2.0 Flash
    """
    try:
        system_prompt = """Você é um toxicologista clínico auxiliando MÉDICOS PROFISSIONAIS em emergências. Forneça protocolo técnico:

1. **Identificação do Agente** tóxico e classificação
2. **Antídoto Específico** (dose, via, timing, disponibilidade)
3. **Fisiopatologia da Intoxicação** (mecanismo, cinética, órgãos-alvo)
4. **Protocolo de Tratamento** (ABC, descontaminação, suporte, monitoramento, critérios de alta)

Responda APENAS com JSON:
```json
{
  "agent": "Nome do agente tóxico",
  "antidote": "Antídoto específico",
  "mechanism": "Mecanismo de toxicidade",
  "protocol": "Protocolo detalhado de tratamento específico para este agente (doses, timing, critérios)",
  "conduct": ["Passo 1", "Passo 2", "Passo 3"]
}
```"""
        
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"tox_{os.urandom(8).hex()}",
            system_message=system_prompt
        ).with_model("gemini", GEMINI_MODEL)
        
        prompt = f"""
Agente: {agent}
{f"Via de Exposição: {exposure_route}" if exposure_route else ""}
{f"Sintomas: {symptoms}" if symptoms else ""}

Analise o caso toxicológico.
"""
        
        response = await chat.send_message(UserMessage(text=prompt))
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif response_text.startswith("```"):
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        return json.loads(response_text)
        
    except Exception as e:
        print(f"Error in analyze_toxicology: {e}")
        return {
            "agent": agent,
            "antidote": "Sistema indisponível - consultar CIATOX ou protocolos locais",
            "mechanism": f"Erro: {str(e)}",
            "protocol": "Consultar protocolos específicos do CIATOX e diretrizes institucionais. Contato: 0800 722 6001 (Nacional) ou 0800 014 8110 (SP).",
            "conduct": [
                "Estabilização ABC (via aérea, respiração, circulação)",
                "Descontaminação conforme via de exposição e tempo",
                "Contato com Centro de Informações Toxicológicas: 0800 722 6001",
                "Monitoramento de sinais vitais e função orgânica",
                "Suporte específico baseado em toxidrome",
                "Considerar hemodiálise se indicado"
            ]
        }


# Consensus functions for background task system
async def get_ai_consensus_diagnosis(patient_data):
    """Consensus diagnosis using Gemini 2.0 Flash"""
    return await analyze_diagnosis(
        patient_data.get("queixa", ""),
        patient_data.get("idade", "N/I"),
        patient_data.get("sexo", "N/I")
    )

async def get_ai_consensus_medication_guide(symptoms):
    """Consensus medication guide using Gemini 2.0 Flash"""
    medications = await analyze_medication_guide(symptoms)
    return {"medications": medications}

async def get_ai_consensus_drug_interaction(medications):
    """Consensus drug interaction using Gemini 2.0 Flash"""
    if len(medications) >= 2:
        return await analyze_drug_interaction(medications[0], medications[1])
    return {"error": "Need at least 2 medications"}

async def get_ai_consensus_toxicology(substance):
    """Consensus toxicology using Gemini 2.0 Flash"""
    return await analyze_toxicology(substance)


async def analyze_dose_calculator(patient_data: Dict[str, Any], medications: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Calcula doses farmacológicas, diluições e prescrições
    
    Args:
        patient_data: Dados opcionais do paciente (peso, idade, altura, condições especiais)
        medications: Lista de medicações com nome, via (opcional) e indicação (opcional)
        
    Returns:
        Dict com prescrição detalhada formatada em HTML
    """
    try:
        # Create chat instance with Gemini 2.0 Flash
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            system_message="Você é um farmacologista clínico especializado em cálculos de dose. Forneça prescrições detalhadas, técnicas e completas para médicos."
        ).with_model("gemini", GEMINI_MODEL)
        
        # Build patient context
        patient_context = ""
        if patient_data.get("weight"):
            patient_context += f"\n- Peso: {patient_data['weight']} kg"
        if patient_data.get("age"):
            patient_context += f"\n- Idade: {patient_data['age']}"
        if patient_data.get("height"):
            patient_context += f"\n- Altura: {patient_data['height']} cm"
        if patient_data.get("specialConditions"):
            patient_context += f"\n- Condições especiais: {patient_data['specialConditions']}"
        
        # Build medications list
        meds_text = ""
        for idx, med in enumerate(medications, 1):
            meds_text += f"\n{idx}. {med['name']}"
            if med.get('route'):
                meds_text += f" - Via: {med['route']}"
            if med.get('indication'):
                meds_text += f" - Indicação: {med['indication']}"
        
        no_data_msg = "\n- Dados não informados"
        prompt = f"""Analise e forneça prescrição farmacológica COMPLETA E DETALHADA para as seguintes medicações:

**DADOS DO PACIENTE:**{patient_context if patient_context else no_data_msg}

**MEDICAÇÕES:**{meds_text}

**RESPONDA EM HTML FORMATADO COM:**

Para CADA medicação, forneça uma seção estruturada com:

<div class="medication-section">
<h3>🔹 [Nome da Medicação]</h3>

<div class="dosage-info">
<h4>💊 Dosagem e Prescrição</h4>
<ul>
  <li><strong>Dose padrão adulto:</strong> [dose com unidade]</li>
  <li><strong>Dose pediátrica:</strong> [cálculo por kg/dia ou mg/kg] - SEMPRE incluir</li>
  <li><strong>Dose para idosos:</strong> [ajustes necessários] - SEMPRE incluir</li>
  <li><strong>Dose para o paciente:</strong> [cálculo específico baseado nos dados fornecidos]</li>
</ul>
</div>

<div class="administration-info">
<h4>💉 Via e Modo de Administração</h4>
<ul>
  <li><strong>Via recomendada:</strong> [oral/EV/IM/SC/tópica]</li>
  <li><strong>Diluição (se EV):</strong> [detalhes completos de diluição: concentração, diluente, volume]</li>
  <li><strong>Velocidade de infusão:</strong> [ml/h ou tempo de infusão]</li>
  <li><strong>Posologia:</strong> [intervalo entre doses, duração do tratamento]</li>
</ul>
</div>

<div class="special-considerations">
<h4>⚠️ Considerações Especiais</h4>
<ul>
  <li><strong>Pediatria:</strong> [cuidados específicos para crianças]</li>
  <li><strong>Geriatria:</strong> [cuidados para idosos, ajuste renal]</li>
  <li><strong>Gestação/Lactação:</strong> [categoria de risco, recomendações]</li>
  <li><strong>Insuficiência renal/hepática:</strong> [ajustes de dose necessários]</li>
</ul>
</div>

<div class="contraindications">
<h4>🚫 Contraindicações e Interações</h4>
<ul>
  <li><strong>Contraindicações absolutas:</strong> [listar]</li>
  <li><strong>Contraindicações relativas:</strong> [listar]</li>
  <li><strong>Interações importantes:</strong> [com outros medicamentos da lista ou classes importantes]</li>
</ul>
</div>

<div class="monitoring">
<h4>📊 Monitoramento</h4>
<ul>
  <li>[Parâmetros laboratoriais ou clínicos a monitorar]</li>
  <li>[Sinais de toxicidade ou efeitos adversos importantes]</li>
</ul>
</div>
</div>

<hr/>

**IMPORTANTE:**
- Use linguagem técnica para médicos
- Forneça cálculos precisos baseados nos dados do paciente
- SEMPRE inclua informações pediátricas E geriátricas
- Seja específico em diluições e velocidades de infusão
- Considere todas as condições especiais mencionadas
- Formate em HTML limpo e bem estruturado
- Use <strong> para destacar termos importantes
- Use listas <ul> para organização
"""
        
        response = await chat.send_message(UserMessage(text=prompt))
        prescription_html = response.strip()
        
        # Remove markdown code blocks if present
        if prescription_html.startswith("```html"):
            prescription_html = prescription_html.split("```html")[1].split("```")[0].strip()
        elif prescription_html.startswith("```"):
            prescription_html = prescription_html.split("```")[1].split("```")[0].strip()
        
        return {
            "prescription": prescription_html,
            "medications_count": len(medications),
            "model": "Meduf 2.0 Clinic"
        }
        
    except Exception as e:
        print(f"Error in analyze_dose_calculator: {e}")
        return {
            "prescription": f"<div class='error'><p>❌ Erro ao calcular prescrição: {str(e)}</p><p>Por favor, tente novamente ou consulte referências farmacológicas.</p></div>",
            "error": str(e)
        }


async def get_ai_consensus_dose_calculator(patient_data, medications):
    """Consensus dose calculator using Gemini 2.0 Flash"""
    return await analyze_dose_calculator(patient_data, medications)
