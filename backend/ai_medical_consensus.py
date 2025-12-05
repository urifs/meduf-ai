"""
AI Medical Consensus Engine
Uses Gemini 2.5 Flash for medical diagnosis
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

# Gemini 2.5 Flash model (latest and fastest)
GEMINI_MODEL = "gemini-2.5-flash"

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
        # Generate unique session ID for this calculation
        import uuid
        session_id = str(uuid.uuid4())
        
        # Create chat instance with Gemini 2.0 Flash
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=session_id,
            system_message="Você é um farmacologista clínico especializado para médicos especialistas. Forneça análises farmacológicas técnicas, baseadas em evidências científicas, com terminologia médica apropriada e referências a guidelines internacionais."
        ).with_model("gemini", GEMINI_MODEL)
        
        # Build patient context
        patient_context = ""
        if patient_data.get("weight"):
            patient_context += f"\n- Peso: {patient_data['weight']} kg"
        if patient_data.get("age"):
            patient_context += f"\n- Idade: {patient_data['age']}"
        if patient_data.get("height"):
            patient_context += f"\n- Altura: {patient_data['height']} cm"
        if patient_data.get("sex"):
            patient_context += f"\n- Sexo: {patient_data['sex']}"
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
        prompt = f"""**ANÁLISE FARMACOLÓGICA PARA MÉDICOS ESPECIALISTAS**

**DADOS DO PACIENTE:**{patient_context if patient_context else no_data_msg}

**MEDICAÇÕES SOLICITADAS:**{meds_text}

---

Forneça análise farmacológica COMPLETA E TÉCNICA para cada medicação, em formato HTML estruturado:

Para CADA medicação, crie uma seção detalhada seguindo este template:

<div class="medication-section" style="border-left: 4px solid #dc2626; padding-left: 20px; margin-bottom: 30px;">
<h2 style="color: #dc2626; margin-bottom: 15px;">💊 [NOME COMERCIAL E GENÉRICO]</h2>

<div class="pharmacology">
<h3 style="color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 5px;">📚 Farmacologia Clínica</h3>
<ul style="line-height: 1.8;">
  <li><strong>Classe farmacológica:</strong> [classe terapêutica e mecanismo de ação]</li>
  <li><strong>Farmacocinética:</strong> [absorção, distribuição, metabolismo (CYP), excreção]</li>
  <li><strong>Meia-vida:</strong> [t½ e implicações clínicas]</li>
  <li><strong>Biodisponibilidade:</strong> [% e fatores que afetam]</li>
</ul>
</div>

<div class="dosing">
<h3 style="color: #059669; border-bottom: 2px solid #10b981; padding-bottom: 5px;">💉 Posologia Baseada em Evidências</h3>

<h4 style="color: #4b5563; margin-top: 15px;">🔹 Adultos</h4>
<ul style="line-height: 1.8;">
  <li><strong>Dose inicial:</strong> [dose, via, frequência]</li>
  <li><strong>Dose de manutenção:</strong> [esquema terapêutico completo]</li>
  <li><strong>Dose máxima diária:</strong> [limite de segurança]</li>
  <li><strong>Cálculo para este paciente (se dados fornecidos):</strong> [dose individualizada]</li>
</ul>

<h4 style="color: #4b5563; margin-top: 15px;">🔹 População Pediátrica</h4>
<ul style="line-height: 1.8;">
  <li><strong>Neonatos:</strong> [mg/kg/dose ou mg/kg/dia, intervalos]</li>
  <li><strong>Lactentes e crianças:</strong> [cálculo por kg, dose máxima]</li>
  <li><strong>Adolescentes:</strong> [transição para dose adulta]</li>
  <li><strong>Segurança pediátrica:</strong> [aprovação FDA/ANVISA, estudos]</li>
</ul>

<h4 style="color: #4b5563; margin-top: 15px;">🔹 População Geriátrica (≥65 anos)</h4>
<ul style="line-height: 1.8;">
  <li><strong>Ajuste de dose:</strong> [redução necessária e justificativa]</li>
  <li><strong>Critérios de Beers:</strong> [classificação e precauções]</li>
  <li><strong>Clearance renal:</strong> [importância do ClCr, fórmula de Cockcroft-Gault]</li>
</ul>
</div>

<div class="administration">
<h3 style="color: #7c3aed; border-bottom: 2px solid #8b5cf6; padding-bottom: 5px;">🔬 Técnica de Administração</h3>
<ul style="line-height: 1.8;">
  <li><strong>Via de administração:</strong> [VO, EV, IM, SC, SL, tópica - com justificativa]</li>
  <li><strong>Preparo (se parenteral):</strong>
    <ul>
      <li>Diluente: [SF 0,9%, SG 5%, água para injeção]</li>
      <li>Concentração final: [mg/ml]</li>
      <li>Volume total: [ml]</li>
      <li>Estabilidade: [tempo após reconstituição]</li>
    </ul>
  </li>
  <li><strong>Velocidade de infusão:</strong> [ml/h, gotejamento, tempo de infusão]</li>
  <li><strong>Compatibilidade:</strong> [com outros fármacos em Y, incompatibilidades]</li>
  <li><strong>Intervalo entre doses:</strong> [h, fundamentação farmacocinética]</li>
  <li><strong>Duração do tratamento:</strong> [dias/semanas, critérios de suspensão]</li>
</ul>
</div>

<div class="special-populations">
<h3 style="color: #ea580c; border-bottom: 2px solid #f97316; padding-bottom: 5px;">⚠️ Populações Especiais e Ajustes</h3>

<h4 style="color: #4b5563; margin-top: 15px;">🔹 Insuficiência Renal</h4>
<ul style="line-height: 1.8;">
  <li><strong>ClCr &gt;50 ml/min:</strong> [ajuste]</li>
  <li><strong>ClCr 30-50 ml/min:</strong> [ajuste]</li>
  <li><strong>ClCr 10-30 ml/min:</strong> [ajuste]</li>
  <li><strong>ClCr &lt;10 ml/min:</strong> [ajuste]</li>
  <li><strong>Hemodiálise:</strong> [suplementação pós-diálise]</li>
  <li><strong>Diálise peritoneal:</strong> [recomendações]</li>
</ul>

<h4 style="color: #4b5563; margin-top: 15px;">🔹 Insuficiência Hepática</h4>
<ul style="line-height: 1.8;">
  <li><strong>Child-Pugh A:</strong> [ajuste]</li>
  <li><strong>Child-Pugh B:</strong> [ajuste]</li>
  <li><strong>Child-Pugh C:</strong> [contraindicação ou ajuste]</li>
</ul>

<h4 style="color: #4b5563; margin-top: 15px;">🔹 Gestação</h4>
<ul style="line-height: 1.8;">
  <li><strong>Categoria FDA:</strong> [A, B, C, D, X com descrição]</li>
  <li><strong>Trimestre-específico:</strong> [riscos por trimestre]</li>
  <li><strong>Alternativas mais seguras:</strong> [se aplicável]</li>
</ul>

<h4 style="color: #4b5563; margin-top: 15px;">🔹 Lactação</h4>
<ul style="line-height: 1.8;">
  <li><strong>Excreção no leite:</strong> [concentração relativa]</li>
  <li><strong>Risco para lactente:</strong> [classificação AAP/LactMed]</li>
  <li><strong>Recomendação:</strong> [compatível, uso cauteloso, contraindicado]</li>
</ul>
</div>

<div class="contraindications">
<h3 style="color: #dc2626; border-bottom: 2px solid #ef4444; padding-bottom: 5px;">🚫 Contraindicações e Precauções</h3>
<ul style="line-height: 1.8;">
  <li><strong>Contraindicações absolutas:</strong> [situações que impedem o uso]</li>
  <li><strong>Contraindicações relativas:</strong> [uso com extrema cautela]</li>
  <li><strong>Interações medicamentosas graves:</strong> [com fármacos da lista ou principais classes]</li>
  <li><strong>Interações alimento/fármaco:</strong> [relevantes clinicamente]</li>
  <li><strong>Ajustes por interação CYP:</strong> [inibidores/indutores enzimáticos]</li>
</ul>
</div>

<div class="adverse-effects">
<h3 style="color: #b91c1c; border-bottom: 2px solid #dc2626; padding-bottom: 5px;">⚡ Reações Adversas e Toxicidade</h3>
<ul style="line-height: 1.8;">
  <li><strong>Reações comuns (&gt;10%):</strong> [frequentes, geralmente toleráveis]</li>
  <li><strong>Reações graves (atenção):</strong> [raras mas importantes]</li>
  <li><strong>Sinais de toxicidade:</strong> [clínicos e laboratoriais]</li>
  <li><strong>Manejo de superdosagem:</strong> [antídoto, suporte, eliminação]</li>
</ul>
</div>

<div class="monitoring">
<h3 style="color: #0891b2; border-bottom: 2px solid #06b6d4; padding-bottom: 5px;">📊 Monitoramento Terapêutico</h3>
<ul style="line-height: 1.8;">
  <li><strong>Parâmetros laboratoriais:</strong> [exames necessários e frequência]</li>
  <li><strong>Monitoramento de níveis séricos:</strong> [se aplicável: vale, pico, janela terapêutica]</li>
  <li><strong>Avaliação clínica:</strong> [sinais vitais, sintomas, eficácia]</li>
  <li><strong>Ajustes baseados em resposta:</strong> [titulação de dose]</li>
</ul>
</div>

<div class="clinical-pearls">
<h3 style="color: #7c3aed; border-bottom: 2px solid #8b5cf6; padding-bottom: 5px;">💎 Pearls Clínicos</h3>
<ul style="line-height: 1.8;">
  <li>[Dica prática importante para médicos]</li>
  <li>[Consideração baseada em evidência]</li>
  <li>[Erro comum a evitar]</li>
</ul>
</div>

<div class="references">
<h3 style="color: #6b7280; border-bottom: 2px solid #9ca3af; padding-bottom: 5px;">📖 Referências Guidelines</h3>
<ul style="line-height: 1.8;">
  <li>[Guideline relevante - UpToDate, Micromedex, Diretrizes Brasileiras]</li>
</ul>
</div>

</div>

<hr style="margin: 30px 0; border: none; border-top: 2px solid #e5e7eb;"/>

**DIRETRIZES IMPORTANTES:**
✅ Use terminologia médica técnica apropriada para especialistas
✅ Baseie-se em farmacocinética e farmacodinâmica
✅ Inclua SEMPRE populações especiais (pediátrica, geriátrica, gestantes)
✅ Seja PRECISO em cálculos, diluições e velocidades
✅ Cite meias-vidas, clearance, metabolismo CYP quando relevante
✅ Considere ajustes por função renal (ClCr) e hepática (Child-Pugh)
✅ Mencione interações farmacocinéticas e farmacodinâmicas
✅ Formate em HTML limpo, profissional, com cores para organização visual
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
            "model": "Meduf 2.5 Clinic"
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
