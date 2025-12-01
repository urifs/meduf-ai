"""
AI Medical Consensus Engine
Uses 3 LLMs (GPT-5, Claude Sonnet 4, Gemini 2.0) + PubMed research
Returns consensus diagnosis based on multiple AI opinions
"""
import os
import asyncio
from typing import Dict, List, Any, Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage
import aiohttp
import xml.etree.ElementTree as ET


# Get Emergent Universal Key from environment
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY", "sk-emergent-b51Fb1fC8C81f9e13D")


MEDICAL_SYSTEM_PROMPT = """Você é um assistente clínico especializado. Analise os sintomas fornecidos e forneça:

1. **Diagnósticos Diferenciais** (3-5 hipóteses mais prováveis)
2. **Justificativas Clínicas** para cada diagnóstico
3. **Conduta Inicial** (exames e procedimentos)
4. **Medicações Sugeridas** (com doses e mecanismos)

**IMPORTANTE:**
- Seja preciso e técnico
- Use terminologia médica brasileira
- Baseie-se em evidências científicas
- Considere diagnósticos diferenciais importantes
- Sugira exames complementares relevantes
- NÃO substitui consulta médica presencial

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
"""


async def search_pubmed(query: str, max_results: int = 5) -> List[Dict[str, str]]:
    """
    Search PubMed for medical literature related to the query
    Returns list of relevant articles with titles and abstracts
    """
    try:
        # PubMed E-utilities API
        base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
        
        # Search for articles
        search_url = f"{base_url}esearch.fcgi"
        search_params = {
            "db": "pubmed",
            "term": query,
            "retmax": max_results,
            "retmode": "json",
            "sort": "relevance"
        }
        
        async with aiohttp.ClientSession() as session:
            # Get article IDs
            async with session.get(search_url, params=search_params) as response:
                if response.status != 200:
                    return []
                search_data = await response.json()
                
            id_list = search_data.get("esearchresult", {}).get("idlist", [])
            
            if not id_list:
                return []
            
            # Fetch article details
            fetch_url = f"{base_url}efetch.fcgi"
            fetch_params = {
                "db": "pubmed",
                "id": ",".join(id_list),
                "retmode": "xml"
            }
            
            async with session.get(fetch_url, params=fetch_params) as response:
                if response.status != 200:
                    return []
                xml_data = await response.text()
            
            # Parse XML
            root = ET.fromstring(xml_data)
            articles = []
            
            for article in root.findall(".//PubmedArticle"):
                try:
                    title_elem = article.find(".//ArticleTitle")
                    abstract_elem = article.find(".//AbstractText")
                    
                    title = title_elem.text if title_elem is not None else "Sem título"
                    abstract = abstract_elem.text if abstract_elem is not None else "Sem resumo disponível"
                    
                    articles.append({
                        "title": title,
                        "abstract": abstract[:500]  # Limit abstract length
                    })
                except Exception as e:
                    continue
            
            return articles[:max_results]
            
    except Exception as e:
        print(f"PubMed search error: {e}")
        return []


async def get_ai_diagnosis(
    provider: str,
    model: str,
    patient_data: Dict[str, Any],
    pubmed_context: str = ""
) -> Optional[Dict[str, Any]]:
    """
    Get diagnosis from a single AI provider
    """
    try:
        # Create chat instance
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"meduf-{provider}-{patient_data.get('queixa', 'unknown')[:20]}",
            system_message=MEDICAL_SYSTEM_PROMPT
        ).with_model(provider, model)
        
        # Build prompt
        prompt = f"""**DADOS DO PACIENTE:**
- Idade: {patient_data.get('idade', 'N/I')}
- Sexo: {patient_data.get('sexo', 'N/I')}
- Queixa Principal: {patient_data.get('queixa', 'Não informada')}
- História Clínica: {patient_data.get('historia', 'Não informada')}
- Exame Físico: {patient_data.get('exame_fisico', 'Não informado')}
- Exames Complementares: {patient_data.get('exames', 'Não informados')}

{pubmed_context}

**Forneça sua análise clínica em formato JSON conforme especificado.**
"""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        # Try to parse JSON response
        import json
        
        # Extract JSON from markdown code blocks if present
        response_text = response.strip()
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        diagnosis = json.loads(response_text)
        diagnosis["provider"] = provider
        return diagnosis
        
    except Exception as e:
        print(f"Error with {provider}: {e}")
        return None


async def create_consensus_diagnosis(
    diagnoses: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Create consensus diagnosis from multiple AI responses
    Combines and weights the most common diagnoses
    """
    if not diagnoses:
        return {
            "diagnoses": [{"name": "Erro ao processar", "justification": "Não foi possível obter diagnósticos das IAs"}],
            "conduct": {"advice": "Consulte um médico presencialmente", "procedures": []},
            "medications": []
        }
    
    # Count diagnosis frequency
    diagnosis_count = {}
    all_diagnoses = []
    all_medications = []
    all_procedures = []
    all_advice = []
    
    for ai_response in diagnoses:
        provider = ai_response.get("provider", "unknown")
        
        # Collect diagnoses
        for diag in ai_response.get("diagnoses", []):
            name = diag.get("name", "").lower()
            if name:
                if name not in diagnosis_count:
                    diagnosis_count[name] = {
                        "count": 0,
                        "justifications": [],
                        "original_name": diag.get("name")
                    }
                diagnosis_count[name]["count"] += 1
                justification = diag.get('justification', '')
                if justification:
                    diagnosis_count[name]["justifications"].append(justification)
        
        # Collect medications
        for med in ai_response.get("medications", []):
            if med not in all_medications:
                all_medications.append(med)
        
        # Collect procedures
        conduct = ai_response.get("conduct", {})
        for proc in conduct.get("procedures", []):
            if proc not in all_procedures:
                all_procedures.append(proc)
        
        # Collect advice
        advice = conduct.get("advice", "")
        if advice:
            all_advice.append(advice)
    
    # Sort diagnoses by frequency
    sorted_diagnoses = sorted(
        diagnosis_count.items(),
        key=lambda x: x[1]["count"],
        reverse=True
    )
    
    # Build consensus response
    consensus_diagnoses = []
    for name, data in sorted_diagnoses[:5]:  # Top 5 diagnoses
        # Combine justifications without AI labels
        combined_justification = " ".join(data["justifications"][:2])
        consensus_diagnoses.append({
            "name": data["original_name"],
            "justification": combined_justification,
            "ai_agreement": f"{data['count']}/2 IAs"
        })
    
    return {
        "diagnoses": consensus_diagnoses,
        "conduct": {
            "advice": "\n\n".join(all_advice[:2]),  # Top 2 advice
            "procedures": all_procedures[:8]  # Top 8 procedures
        },
        "medications": all_medications[:6]  # Top 6 medications
    }


async def get_ai_consensus_diagnosis(patient_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main function: Get consensus diagnosis from 3 AIs
    """
    try:
        # Query 2 AIs in parallel
        print("🤖 Querying AIs in parallel...")
        tasks = [
            get_ai_diagnosis("anthropic", "claude-sonnet-4-20250514", patient_data, ""),
            get_ai_diagnosis("gemini", "gemini-2.0-flash", patient_data, "")
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out errors and None values
        valid_diagnoses = [r for r in results if r and not isinstance(r, Exception)]
        
        print(f"✅ Got {len(valid_diagnoses)}/2 AI responses")
        
        # Create consensus
        print("🧠 Creating consensus...")
        consensus = await create_consensus_diagnosis(valid_diagnoses)
        
        return consensus
        
    except Exception as e:
        print(f"Consensus engine error: {e}")
        return {
            "diagnoses": [
                {
                    "name": "Erro no Sistema",
                    "justification": f"Ocorreu um erro ao processar a análise: {str(e)}"
                }
            ],
            "conduct": {
                "advice": "Por favor, tente novamente ou consulte um médico presencialmente.",
                "procedures": []
            },
            "medications": []
        }



async def get_ai_consensus_medication_guide(symptoms: str) -> Dict[str, Any]:
    """
    Get medication recommendations using 3 AIs
    """
    try:
        # Create prompt for medication recommendations
        medication_prompt = f"""**SINTOMAS DO PACIENTE:**
{symptoms}

**Forneça recomendações de medicamentos em formato JSON:**
```json
{{
  "medications": [
    {{
      "name": "Nome do medicamento",
      "dose": "Dose recomendada",
      "frequency": "Frequência",
      "notes": "Observações clínicas",
      "contraindications": "Contraindicações principais"
    }}
  ]
}}
```
"""
        
        # Query 2 AIs
        tasks = []
        for provider, model in [
            ("anthropic", "claude-sonnet-4-20250514"),
            ("gemini", "gemini-2.0-flash")
        ]:
            chat = LlmChat(
                api_key=EMERGENT_KEY,
                session_id=f"meduf-med-{provider}",
                system_message="Você é um farmacêutico clínico especializado. Recomende medicamentos baseados em evidências científicas."
            ).with_model(provider, model)
            tasks.append(chat.send_message(UserMessage(text=medication_prompt)))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Parse responses
        all_medications = []
        for i, response in enumerate(results):
            if isinstance(response, Exception):
                continue
            try:
                import json
                response_text = response.strip()
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0].strip()
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0].strip()
                
                data = json.loads(response_text)
                for med in data.get("medications", []):
                    if med not in all_medications:
                        all_medications.append(med)
            except:
                continue
        
        return {"medications": all_medications[:8]}  # Top 8
        
    except Exception as e:
        print(f"Medication guide error: {e}")
        return {"medications": []}


async def get_ai_consensus_drug_interaction(drug1: str, drug2: str) -> Dict[str, Any]:
    """
    Analyze drug interaction using 3 AIs
    """
    try:
        interaction_prompt = f"""**ANÁLISE DE INTERAÇÃO MEDICAMENTOSA:**
Medicamento 1: {drug1}
Medicamento 2: {drug2}

**Forneça análise completa em formato JSON:**
```json
{{
  "severity": "GRAVE/MODERADA/BAIXA",
  "summary": "Resumo da interação",
  "details": "Detalhes farmacocinéticos e farmacodinâmicos",
  "recommendations": "Recomendações clínicas",
  "renal_impact": "Impacto renal de ambos os medicamentos",
  "hepatic_impact": "Impacto hepático de ambos os medicamentos"
}}
```
"""
        
        # Query 2 AIs
        tasks = []
        for provider, model in [
            ("anthropic", "claude-sonnet-4-20250514"),
            ("gemini", "gemini-2.0-flash")
        ]:
            chat = LlmChat(
                api_key=EMERGENT_KEY,
                session_id=f"meduf-interaction-{provider}",
                system_message="Você é um farmacologista especializado em interações medicamentosas. Baseie suas respostas em evidências científicas."
            ).with_model(provider, model)
            tasks.append(chat.send_message(UserMessage(text=interaction_prompt)))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Parse and create consensus
        valid_responses = []
        for response in results:
            if isinstance(response, Exception):
                continue
            try:
                import json
                response_text = response.strip()
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0].strip()
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0].strip()
                
                data = json.loads(response_text)
                valid_responses.append(data)
            except:
                continue
        
        if not valid_responses:
            return {
                "severity": "DESCONHECIDA",
                "summary": "Não foi possível analisar a interação",
                "details": "Erro ao processar dados das IAs",
                "recommendations": "Consulte um farmacêutico ou médico",
                "renal_impact": "Não disponível",
                "hepatic_impact": "Não disponível"
            }
        
        # Get most common severity
        severities = [r.get("severity", "").upper() for r in valid_responses]
        severity_counts = {}
        for s in severities:
            if "GRAVE" in s:
                severity_counts["GRAVE"] = severity_counts.get("GRAVE", 0) + 1
            elif "MODERADA" in s:
                severity_counts["MODERADA"] = severity_counts.get("MODERADA", 0) + 1
            else:
                severity_counts["BAIXA"] = severity_counts.get("BAIXA", 0) + 1
        
        consensus_severity = max(severity_counts.items(), key=lambda x: x[1])[0]
        
        # Combine details
        return {
            "severity": consensus_severity,
            "summary": valid_responses[0].get("summary", ""),
            "details": "\n\n".join([f"[IA {i+1}] {r.get('details', '')}" for i, r in enumerate(valid_responses[:2])]),
            "recommendations": "\n\n".join([f"[IA {i+1}] {r.get('recommendations', '')}" for i, r in enumerate(valid_responses[:2])]),
            "renal_impact": valid_responses[0].get("renal_impact", "Não disponível"),
            "hepatic_impact": valid_responses[0].get("hepatic_impact", "Não disponível"),
            "monitoring": {
                "renal": ["Creatinina sérica", "TFG (Taxa de Filtração Glomerular)"],
                "hepatic": ["TGO/TGP (Transaminases)", "Bilirrubinas"],
                "outros": ["Conforme recomendação médica"]
            }
        }
        
    except Exception as e:
        print(f"Drug interaction consensus error: {e}")
        return {
            "severity": "ERRO",
            "summary": "Erro ao processar análise",
            "details": str(e),
            "recommendations": "Tente novamente",
            "renal_impact": "Não disponível",
            "hepatic_impact": "Não disponível"
        }


async def get_ai_consensus_toxicology(substance: str) -> Dict[str, Any]:
    """
    Get toxicology protocol using 3 AIs
    """
    try:
        toxicology_prompt = f"""**ANÁLISE TOXICOLÓGICA:**
Substância: {substance}

**Forneça protocolo toxicológico em formato JSON:**
```json
{{
  "agent": "Nome do agente tóxico identificado",
  "antidote": "Antídoto específico",
  "mechanism": "Mecanismo de toxicidade",
  "conduct": ["Conduta 1", "Conduta 2", "Conduta 3"],
  "protocol": "Protocolo de tratamento detalhado"
}}
```
"""
        
        # Query 2 AIs
        tasks = []
        for provider, model in [
            ("anthropic", "claude-sonnet-4-20250514"),
            ("gemini", "gemini-2.0-flash")
        ]:
            chat = LlmChat(
                api_key=EMERGENT_KEY,
                session_id=f"meduf-tox-{provider}",
                system_message="Você é um toxicologista clínico especializado. Forneça protocolos baseados em diretrizes internacionais."
            ).with_model(provider, model)
            tasks.append(chat.send_message(UserMessage(text=toxicology_prompt)))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Parse and create consensus
        valid_responses = []
        for response in results:
            if isinstance(response, Exception):
                continue
            try:
                import json
                response_text = response.strip()
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0].strip()
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0].strip()
                
                data = json.loads(response_text)
                valid_responses.append(data)
            except:
                continue
        
        if not valid_responses:
            return {
                "agent": "Agente Desconhecido",
                "antidote": "Suporte clínico (ABCDE)",
                "mechanism": "Não foi possível determinar",
                "conduct": ["Estabilização", "Suporte ventilatório", "Monitorização"],
                "protocol": "Protocolo básico de suporte"
            }
        
        # Combine the best responses
        all_conduct = []
        for r in valid_responses:
            all_conduct.extend(r.get("conduct", []))
        
        return {
            "agent": valid_responses[0].get("agent", "Agente não identificado"),
            "antidote": valid_responses[0].get("antidote", "Suporte clínico"),
            "mechanism": valid_responses[0].get("mechanism", ""),
            "conduct": list(set(all_conduct))[:6],  # Unique, top 6
            "protocol": "\n\n".join([f"[IA {i+1}] {r.get('protocol', '')}" for i, r in enumerate(valid_responses[:2])])
        }
        
    except Exception as e:
        print(f"Toxicology consensus error: {e}")
        return {
            "agent": "Erro na análise",
            "antidote": "Suporte clínico",
            "mechanism": str(e),
            "conduct": ["Contatar Centro de Toxicologia"],
            "protocol": "Erro ao processar protocolo"
        }
