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
                diagnosis_count[name]["justifications"].append(
                    f"[{provider.upper()}] {diag.get('justification', '')}"
                )
        
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
            all_advice.append(f"[{provider.upper()}] {advice}")
    
    # Sort diagnoses by frequency
    sorted_diagnoses = sorted(
        diagnosis_count.items(),
        key=lambda x: x[1]["count"],
        reverse=True
    )
    
    # Build consensus response
    consensus_diagnoses = []
    for name, data in sorted_diagnoses[:5]:  # Top 5 diagnoses
        consensus_diagnoses.append({
            "name": data["original_name"],
            "justification": f"**Consenso de {data['count']}/3 IAs.** " + " | ".join(data["justifications"][:2]),
            "ai_agreement": f"{data['count']}/3 IAs"
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
    Main function: Get consensus diagnosis from 3 AIs + PubMed research
    """
    try:
        # Step 1: Search PubMed for relevant medical literature
        print("🔍 Searching PubMed...")
        query = f"{patient_data.get('queixa', '')} {patient_data.get('historia', '')}"
        pubmed_articles = await search_pubmed(query, max_results=3)
        
        pubmed_context = ""
        if pubmed_articles:
            pubmed_context = "\n**LITERATURA MÉDICA RELEVANTE (PubMed):**\n"
            for i, article in enumerate(pubmed_articles, 1):
                pubmed_context += f"\n{i}. **{article['title']}**\n   {article['abstract']}\n"
        
        # Step 2: Query all 3 AIs in parallel
        print("🤖 Querying 3 AIs in parallel...")
        tasks = [
            get_ai_diagnosis("openai", "gpt-5", patient_data, pubmed_context),
            get_ai_diagnosis("anthropic", "claude-sonnet-4-20250514", patient_data, pubmed_context),
            get_ai_diagnosis("gemini", "gemini-2.0-flash", patient_data, pubmed_context)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out errors and None values
        valid_diagnoses = [r for r in results if r and not isinstance(r, Exception)]
        
        print(f"✅ Got {len(valid_diagnoses)}/3 AI responses")
        
        # Step 3: Create consensus
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
