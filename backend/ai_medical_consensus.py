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


async def analyze_drug_interaction(drug1: str, drug2: str, patient_info: Optional[str] = None) -> Dict[str, Any]:
    """
    Analisa interação medicamentosa usando Gemini 2.0 Flash
    """
    try:
        system_prompt = """Você é um farmacêutico clínico especializado auxiliando MÉDICOS PROFISSIONAIS. Analise a interação medicamentosa com detalhes técnicos:

1. **Classificação de Severidade** (Leve/Moderada/Grave/Contraindicada)
2. **Farmacocinética e Farmacodinâmica** (impacto renal, hepático, interações CYP450)
3. **Mecanismo Molecular** da interação
4. **Protocolo de Monitoramento** (parâmetros laboratoriais, timing, valores críticos)

Responda APENAS com JSON:
```json
{
  "severity": "Leve|Moderada|Grave",
  "renal_impact": "Descrição do impacto renal",
  "hepatic_impact": "Descrição do impacto hepático",
  "mechanism": "Mecanismo da interação",
  "monitoring": {
    "renal": ["Exame 1", "Exame 2"],
    "hepatic": ["Exame 1", "Exame 2"],
    "outros": ["Exame 1", "Exame 2"]
  }
}
```"""
        
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"interaction_{os.urandom(8).hex()}",
            system_message=system_prompt
        ).with_model("gemini", GEMINI_MODEL)
        
        prompt = f"""
Medicamento 1: {drug1}
Medicamento 2: {drug2}
{f"Informações do Paciente: {patient_info}" if patient_info else ""}

Analise a interação medicamentosa.
"""
        
        response = await chat.send_message(UserMessage(text=prompt))
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif response_text.startswith("```"):
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        return json.loads(response_text)
        
    except Exception as e:
        print(f"Error in analyze_drug_interaction: {e}")
        return {
            "severity": "Erro no sistema - avaliar manualmente",
            "renal_impact": "Avaliar clearance de creatinina e necessidade de ajuste de dose",
            "hepatic_impact": "Avaliar função hepática (TGO, TGP, bilirrubinas) e metabolização",
            "mechanism": f"Sistema temporariamente indisponível: {str(e)}",
            "monitoring": {
                "renal": ["Creatinina sérica", "TFG estimada", "Eletrólitos"],
                "hepatic": ["AST/ALT", "Bilirrubinas", "TAP/INR"],
                "outros": ["Monitorar sinais de toxicidade", "Considerar ajuste de dose"]
            }
        }


async def analyze_medication_guide(condition: str, patient_age: str = "N/I", contraindications: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Gera guia terapêutico usando Gemini 2.0 Flash
    """
    try:
        system_prompt = """Você é um médico clínico especializado auxiliando MÉDICOS PROFISSIONAIS. Forneça guia terapêutico técnico:

1. **Opções Terapêuticas** (primeira linha, alternativas, adjuvantes)
2. **Posologia Completa** (dose, via, intervalo, duração, ajustes)
3. **Farmacologia Clínica** (mecanismo, farmacocinética, interações)
4. **Precauções e Contraindicações** (absolutas e relativas, ajustes especiais)

Responda APENAS com JSON:
```json
[
  {
    "name": "Nome do medicamento",
    "dosage": "Dose e via",
    "mechanism": "Mecanismo",
    "contraindications": "Contraindicações"
  }
]
```"""
        
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
        
        return json.loads(response_text)
        
    except Exception as e:
        print(f"Error in analyze_medication_guide: {e}")
        return [{
            "name": "Erro",
            "dosage": "Análise não disponível",
            "mechanism": str(e),
            "contraindications": "Consulte um médico"
        }]


async def analyze_toxicology(agent: str, exposure_route: Optional[str] = None, symptoms: Optional[str] = None) -> Dict[str, Any]:
    """
    Analisa caso toxicológico usando Gemini 2.0 Flash
    """
    try:
        system_prompt = """Você é um toxicologista clínico. Analise o caso e forneça:

1. **Agente** tóxico
2. **Antídoto** específico
3. **Mecanismo** de toxicidade
4. **Conduta** clínica (passos sequenciais)

Responda APENAS com JSON:
```json
{
  "agent": "Nome do agente tóxico",
  "antidote": "Antídoto específico",
  "mechanism": "Mecanismo de toxicidade",
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
            "antidote": "Análise não disponível",
            "mechanism": str(e),
            "conduct": ["Procure atendimento médico imediatamente", "Ligue para o Centro de Intoxicações: 0800 722 6001"]
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
