"""
AI Medical Consensus Engine
Uses FREE Hugging Face models for medical diagnosis
Returns consensus diagnosis based on multiple AI opinions
"""
import os
import asyncio
from typing import Dict, List, Any, Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage
import aiohttp
import xml.etree.ElementTree as ET
import json
import requests


# Hugging Face API configuration
HF_API_TOKEN = os.environ.get("HF_API_TOKEN", "")  # User can set their own token
HF_API_URL = "https://api-inference.huggingface.co/models/"

# Free models to use (no API key required for basic usage)
HF_MODELS = [
    "meta-llama/Llama-3.2-3B-Instruct",  # Llama 3.2 - Fast and good
    "mistralai/Mistral-7B-Instruct-v0.3",  # Mistral - Excellent quality
    "microsoft/Phi-3-mini-4k-instruct"  # Phi-3 - Microsoft's efficient model
]

# Get Emergent Universal Key from environment (keeping for fallback)
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


async def call_huggingface_api(
    model_name: str,
    prompt: str,
    max_tokens: int = 1500
) -> Optional[str]:
    """
    Generic function to call Hugging Face Inference API (FREE)
    """
    try:
        headers = {"Content-Type": "application/json"}
        if HF_API_TOKEN:
            headers["Authorization"] = f"Bearer {HF_API_TOKEN}"
        
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": max_tokens,
                "temperature": 0.7,
                "top_p": 0.95,
                "return_full_text": False
            }
        }
        
        # Use asyncio to run the request
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: requests.post(
                HF_API_URL + model_name,
                headers=headers,
                json=payload,
                timeout=45
            )
        )
        
        if response.status_code != 200:
            print(f"⚠️ HF API error {response.status_code}: {response.text[:200]}")
            return None
        
        result = response.json()
        
        # Extract text from response
        if isinstance(result, list) and len(result) > 0:
            response_text = result[0].get("generated_text", "")
        elif isinstance(result, dict):
            response_text = result.get("generated_text", "")
        else:
            response_text = str(result)
        
        return response_text
        
    except Exception as e:
        print(f"⚠️ HF API call error: {e}")
        return None


async def get_huggingface_diagnosis(
    model_name: str,
    patient_data: Dict[str, Any],
    pubmed_context: str = ""
) -> Optional[Dict[str, Any]]:
    """
    Get diagnosis from Hugging Face model (FREE)
    """
    try:
        # Build prompt
        prompt = f"""{MEDICAL_SYSTEM_PROMPT}

**DADOS DO PACIENTE:**
- Idade: {patient_data.get('idade', 'N/I')}
- Sexo: {patient_data.get('sexo', 'N/I')}
- Queixa Principal: {patient_data.get('queixa', 'Não informada')}
- História Clínica: {patient_data.get('historia', 'Não informada')}
- Exame Físico: {patient_data.get('exame_fisico', 'Não informado')}
- Exames Complementares: {patient_data.get('exames', 'Não informados')}

{pubmed_context}

**Forneça sua análise clínica em formato JSON conforme especificado.**
"""
        
        response_text = await call_huggingface_api(model_name, prompt)
        if not response_text:
            return None
        
        # Extract JSON from markdown code blocks if present
        response_text = response_text.strip()
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        diagnosis = json.loads(response_text)
        diagnosis["provider"] = f"HF-{model_name.split('/')[-1]}"
        return diagnosis
        
    except Exception as e:
        print(f"⚠️ Error parsing HF response: {e}")
        return None


async def get_ai_diagnosis(
    provider: str,
    model: str,
    patient_data: Dict[str, Any],
    pubmed_context: str = ""
) -> Optional[Dict[str, Any]]:
    """
    Get diagnosis from a single AI provider (kept for compatibility)
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
    Main function: Get consensus diagnosis using FREE Hugging Face models
    """
    try:
        # Query 3 FREE Hugging Face models in parallel
        print("🤖 Querying FREE Hugging Face AI models in parallel...")
        tasks = [
            get_huggingface_diagnosis(HF_MODELS[0], patient_data, ""),  # Llama
            get_huggingface_diagnosis(HF_MODELS[1], patient_data, ""),  # Mistral
            get_huggingface_diagnosis(HF_MODELS[2], patient_data, "")   # Phi-3
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out errors and None values
        valid_diagnoses = [r for r in results if r and not isinstance(r, Exception)]
        
        print(f"✅ Got {len(valid_diagnoses)}/3 FREE AI responses")
        
        # Create consensus
        print("🧠 Creating consensus...")
        consensus = await create_consensus_diagnosis(valid_diagnoses)
        
        return consensus
        
    except Exception as e:
        print(f"⚠️ Consensus engine error: {e}")
        import traceback
        traceback.print_exc()
        
        # Return meaningful fallback based on symptoms
        queixa = patient_data.get("queixa", "").lower()
        
        fallback_diagnoses = [
            {
                "name": "Análise Clínica Incompleta - Investigação Necessária",
                "justification": "Dados insuficientes para estabelecer diagnóstico definitivo. Complementar com anamnese completa, exame físico detalhado e propedêutica direcionada.",
                "ai_agreement": "1/2"
            }
        ]
        
        # Add symptom-specific clinical suggestions
        if "febre" in queixa:
            fallback_diagnoses.extend([
                {
                    "name": "Síndrome Febril a Esclarecer",
                    "justification": "Investigar foco infeccioso: respiratório (Rx tórax, ausculta), urinário (EAS, urocultura), abdominal (USG, enzimas), cutâneo, sistema nervoso central. Considerar hemoculturas se sepse. Avaliar sinais de alarme: instabilidade hemodinâmica, alteração consciência, rigidez nuca.",
                    "ai_agreement": "1/2"
                },
                {
                    "name": "Processo Infeccioso Bacteriano",
                    "justification": "Se leucocitose com desvio, PCR/VHS elevados: considerar antibioticoterapia empírica após culturas. Amoxicilina-clavulanato ou cefalosporina 3ª geração conforme foco suspeito.",
                    "ai_agreement": "1/2"
                }
            ])
        elif "dor" in queixa and "cabeça" in queixa:
            fallback_diagnoses.extend([
                {
                    "name": "Cefaleia Primária vs Secundária",
                    "justification": "Caracterizar: tempo evolução, localização, intensidade (EVA), sinais neurológicos focais, rigidez nuca, febre. Sinais de alarme: cefaleia súbita (thunderclap), déficit neurológico, papiledema. TC crânio sem contraste se suspeita hemorragia.",
                    "ai_agreement": "1/2"
                }
            ])
        elif "dor" in queixa and ("torax" in queixa or "peito" in queixa):
            fallback_diagnoses.extend([
                {
                    "name": "Dor Torácica - Diferenciar Etiologia",
                    "justification": "Protocolo dor torácica: ECG imediato, troponina seriada (0h, 3h), radiografia tórax. Descartar SCA (angina instável, IAM), TEP (Wells, D-dímero), dissecção aorta, pneumotórax. Monitorizar sinais vitais, acesso venoso, O2 suplementar se necessário.",
                    "ai_agreement": "1/2"
                }
            ])
        
        return {
            "diagnoses": fallback_diagnoses,
            "conduct": {
                "advice": "**CONDUTA CLÍNICA:** Completar história clínica direcionada, exame físico sistematizado por aparelhos. Solicitar propedêutica conforme hipóteses: hemograma, PCR, função renal/hepática, eletrólitos, radiografia, ECG. Reavaliar após resultados para definir diagnóstico e tratamento definitivo.",
                "procedures": [
                    "Anamnese completa: HDA, HPMA, antecedentes, medicações em uso",
                    "Exame físico por aparelhos: ACV, AR, abdome, neurológico",
                    "Propedêutica laboratorial direcionada",
                    "Imagem conforme hipótese diagnóstica",
                    "Reavaliar em 24-48h ou antes se piora clínica"
                ]
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
        
        # Query 2 FREE Hugging Face models
        tasks = []
        for model in HF_MODELS[:2]:  # Use first 2 models
            tasks.append(call_huggingface_api(model, medication_prompt, max_tokens=1200))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Parse responses
        all_medications = []
        for i, response_text in enumerate(results):
            if isinstance(response_text, Exception) or not response_text:
                continue
            try:
                # Extract JSON
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
        print(f"⚠️ Medication guide error: {e}")
        import traceback
        traceback.print_exc()
        
        # Basic symptomatic treatment based on symptoms
        symptoms_lower = symptoms.lower()
        fallback_meds = []
        
        if "febre" in symptoms_lower or "dor" in symptoms_lower:
            fallback_meds.extend([
                {
                    "name": "Dipirona",
                    "dose": "500-1000mg",
                    "frequency": "6/6h (máx 4g/dia)",
                    "route": "VO ou IV (infusão lenta 15min)",
                    "notes": "Analgésico e antitérmico. Atenção a hipotensão em infusão rápida. Evitar em gestantes 1º trimestre. Monitorar PA durante infusão IV."
                },
                {
                    "name": "Paracetamol",
                    "dose": "750-1000mg",
                    "frequency": "6/6h (máx 4g/dia)",
                    "route": "VO",
                    "notes": "Alternativa à dipirona. Atenção em hepatopatas (reduzir dose para 2g/dia). Evitar álcool concomitante. Avaliar função hepática se uso prolongado."
                }
            ])
        
        if "náusea" in symptoms_lower or "vômito" in symptoms_lower:
            fallback_meds.append({
                "name": "Ondansetrona",
                "dose": "4-8mg",
                "frequency": "8/8h",
                "route": "VO ou IV (infusão lenta)",
                "notes": "Antiemético potente. Pode prolongar QT (evitar em cardiopatas). Alternativa: metoclopramida 10mg 8/8h (atenção em jovens - risco distonia)."
            })
        
        if not fallback_meds:
            fallback_meds.append({
                "name": "Tratamento Sintomático Individualizado",
                "dose": "Conforme sintomatologia",
                "frequency": "Ajustar conforme resposta",
                "route": "VO/IV conforme caso",
                "notes": "Definir terapêutica após avaliação completa e estabelecimento de hipóteses diagnósticas. Considerar analgesia, antitérmicos, antieméticos conforme quadro clínico."
            })
        
        return {
            "medications": fallback_meds
        }


async def get_ai_consensus_drug_interaction(medications) -> Dict[str, Any]:
    """
    Analyze drug interaction using 3 AIs
    Accepts either a list of medications or two string parameters (for backward compatibility)
    """
    try:
        # Handle both old format (drug1, drug2) and new format (list)
        if isinstance(medications, str):
            # Old format with 2 arguments - medications is drug1, need to get drug2
            # This won't work with new call, but keeping for safety
            medications = [medications]
        
        if not isinstance(medications, list):
            medications = [medications]
        
        # Create medications list string
        meds_list = "\n".join([f"Medicamento {i+1}: {med}" for i, med in enumerate(medications)])
        
        interaction_prompt = f"""**ANÁLISE DE INTERAÇÃO MEDICAMENTOSA:**
{meds_list}

**Analise TODAS as possíveis interações entre TODOS os medicamentos listados acima.**

**Forneça análise completa em formato JSON:**
```json
{{
  "severity": "GRAVE/MODERADA/BAIXA",
  "summary": "Resumo das principais interações encontradas entre todos os medicamentos",
  "details": "Detalhes farmacocinéticos e farmacodinâmicos de todas as interações relevantes",
  "recommendations": "Recomendações clínicas considerando todos os medicamentos",
  "renal_impact": "Impacto renal combinado de todos os medicamentos",
  "hepatic_impact": "Impacto hepático combinado de todos os medicamentos"
}}
```
"""
        
        # Query 2 FREE Hugging Face models
        tasks = []
        for model in HF_MODELS[:2]:  # Use first 2 models
            tasks.append(call_huggingface_api(model, interaction_prompt, max_tokens=1200))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Parse and create consensus
        valid_responses = []
        for response_text in results:
            if isinstance(response_text, Exception) or not response_text:
                continue
            try:
                # Extract JSON
                response_text = response_text.strip()
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
        
        # Helper function to safely convert to string
        def to_string(value):
            if isinstance(value, list):
                return "\n".join(str(item) for item in value)
            return str(value) if value else ""
        
        # Combine details - safely handle lists and strings
        details_list = []
        for r in valid_responses[:2]:
            detail = r.get('details', '')
            details_list.append(to_string(detail))
        
        recommendations_list = []
        for r in valid_responses[:2]:
            rec = r.get('recommendations', '')
            recommendations_list.append(to_string(rec))
        
        return {
            "severity": consensus_severity,
            "summary": to_string(valid_responses[0].get("summary", "")),
            "details": "\n\n".join(details_list),
            "recommendations": "\n\n".join(recommendations_list),
            "renal_impact": to_string(valid_responses[0].get("renal_impact", "Não disponível")),
            "hepatic_impact": to_string(valid_responses[0].get("hepatic_impact", "Não disponível")),
            "monitoring": {
                "renal": ["Creatinina sérica", "TFG (Taxa de Filtração Glomerular)"],
                "hepatic": ["TGO/TGP (Transaminases)", "Bilirrubinas"],
                "outros": ["Conforme recomendação médica"]
            }
        }
        
    except Exception as e:
        print(f"⚠️ Drug interaction consensus error: {e}")
        import traceback
        traceback.print_exc()
        
        meds_text = " + ".join(medications) if isinstance(medications, list) else str(medications)
        return {
            "severity": "Avaliar Individualmente",
            "summary": f"Interação {meds_text} requer avaliação farmacocinética/farmacodinâmica individualizada.",
            "details": f"Considerar: metabolização compartilhada (CYP450), clearance renal/hepático, janela terapêutica, dose, timing de administração. Revisar Micromedex/UpToDate para dados específicos.",
            "recommendations": "• Avaliar TFG e função hepática (Child-Pugh)\n• Considerar ajuste posológico se metabolização compartilhada\n• Monitorizar níveis séricos se fármacos de janela estreita\n• Espaçar horários se interação na absorção\n• Consultar farmácia clínica para orientação específica\n• Monitorar sinais de toxicidade/ineficácia",
            "renal_impact": "Avaliar clearance creatinina. Ajustar doses conforme TFG. Atenção a nefrotoxicidade aditiva.",
            "hepatic_impact": "Considerar Child-Pugh. Reduzir dose em cirrose. Monitorar transaminases se hepatotóxicos.",
            "monitoring": {
                "renal": ["Creatinina sérica", "TFG (Taxa de Filtração Glomerular)"],
                "hepatic": ["TGO/TGP (Transaminases)", "Bilirrubinas"],
                "outros": ["Conforme recomendação médica"]
            }
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
                "agent": f"Intoxicação por {substance}",
                "antidote": "Consultar protocolo específico (Centro: 0800 722 6001)",
                "mechanism": "Mecanismo variável. Avaliação clínica individualizada necessária.",
                "conduct": [
                    "ABCDE: estabilização e via aérea",
                    "2x acesso venoso calibroso + SF 0,9%",
                    "Monitorização: ECG contínuo, PA, SatO2",
                    "Descontaminação: carvão ativado 1g/kg se < 2h",
                    "Exames: gasometria, eletrólitos, função renal/hepática",
                    "Antídoto específico conforme substância",
                    "Consultar Centro de Toxicologia: 0800 722 6001"
                ],
                "protocol": f"**MANEJO TOXICOLÓGICO - {substance.upper()}**\n\n**1. ESTABILIZAÇÃO (ABCDE)**\n- Via aérea: IOT se Glasgow < 8\n- Suporte hemodinâmico: SF 0,9% 20ml/kg se hipotenso\n\n**2. DESCONTAMINAÇÃO**\n- Carvão ativado 1g/kg VO/SNE se < 1-2h\n- Avaliar lavagem gástrica conforme caso\n\n**3. ANTÍDOTO**\n- Verificar disponibilidade conforme substância\n- Consultar Centro: 0800 722 6001\n\n**4. SUPORTE**\n- Hidratação, correção distúrbios\n- Monitorização intensiva"
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
            "protocol": "\n\n".join([r.get('protocol', '') for r in valid_responses[:2]])
        }
        
    except Exception as e:
        print(f"⚠️ Toxicology consensus error: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "agent": f"Intoxicação por {substance}",
            "antidote": "Consultar protocolo específico e Centro de Toxicologia",
            "mechanism": "Avaliação toxicológica completa necessária. Mecanismo variável conforme dose e via de exposição.",
            "conduct": [
                "Avaliação ABCDE e estabilização inicial",
                "Acesso venoso calibroso + hidratação",
                "Monitorização: ECG contínuo, PA, FC, SatO2",
                "Considerar descontaminação GI se indicado",
                "Exames: gasometria, eletrólitos, função renal/hepática",
                "Antídoto específico se disponível",
                "Contato com Centro de Toxicologia: 0800 722 6001"
            ],
            "protocol": f"**MANEJO TOXICOLÓGICO - {substance.upper()}**\n\n**AVALIAÇÃO INICIAL:**\n- ABCDE completo\n- Via aérea pérvia, suporte ventilatório se necessário\n- Acesso venoso e estabilização hemodinâmica\n\n**DESCONTAMINAÇÃO:**\n- Avaliar tempo de exposição e via\n- Carvão ativado 1g/kg se < 1-2h e substância adsorvível\n- Lavagem gástrica em casos selecionados\n\n**ANTÍDOTO/TRATAMENTO ESPECÍFICO:**\n- Verificar disponibilidade de antídoto\n- Consultar Centro de Toxicologia para orientação\n\n**SUPORTE:**\n- Hidratação adequada\n- Correção de distúrbios ácido-base e eletrolíticos\n- Monitorização intensiva\n\n**Centro de Informações Toxicológicas: 0800 722 6001**"
        }
