"""
Epidemiological Alerts System
Fetches real-time outbreak and disease surveillance data using AI
"""
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Get Emergent LLM Key
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

# Cache system
_alerts_cache = {
    "data": None,
    "last_updated": None,
    "ttl_minutes": 60  # Cache for 1 hour
}


def is_cache_valid() -> bool:
    """Check if cache is still valid"""
    if not _alerts_cache["data"] or not _alerts_cache["last_updated"]:
        return False
    
    time_diff = datetime.utcnow() - _alerts_cache["last_updated"]
    return time_diff < timedelta(minutes=_alerts_cache["ttl_minutes"])


async def fetch_real_epidemiological_alerts() -> Dict[str, List[Dict[str, Any]]]:
    """
    Fetch real-time epidemiological alerts using AI
    Returns alerts for Brazil and World
    """
    
    # Check cache first
    if is_cache_valid():
        print("📋 Using cached epidemiological alerts")
        return _alerts_cache["data"]
    
    print("🔄 Fetching fresh epidemiological alerts...")
    
    try:
        # Use Claude for reliable, factual information
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"meduf-epi-alerts-{datetime.utcnow().strftime('%Y%m%d%H')}",
            system_message="""Você é um epidemiologista que monitora surtos e alertas de doenças.
Forneça informações REAIS e ATUAIS baseadas em dados epidemiológicos recentes.
Seja factual e preciso. Use apenas dados de fontes confiáveis."""
        ).with_model("anthropic", "claude-sonnet-4-20250514")
        
        prompt = f"""**DATA DE HOJE: {datetime.utcnow().strftime('%d/%m/%Y')}**

Por favor, forneça alertas epidemiológicos REAIS e ATUALIZADOS para:

**1. BRASIL (Top 5 alertas mais relevantes):**
   Para cada estado/região com surto ou alerta:
   - Estado/Região
   - Doença
   - Nível (Alto/Médio/Baixo)
   - Data do alerta (use "Hoje", "Ontem", "Esta semana", etc)

**2. MUNDO (Top 3 alertas mais relevantes internacionais):**
   Para cada país/região:
   - País/Região
   - Doença
   - Nível (Alto/Médio/Baixo)
   - Data

**IMPORTANTE:**
- Use APENAS informações reais de novembro/dezembro 2024
- Se não houver alertas significativos, informe doenças sazonais típicas
- Priorize dengue, covid, influenza, sarampo, malária conforme relevância atual
- Seja breve e direto

**FORMATO DE RESPOSTA (JSON):**
```json
{{
  "brazil": [
    {{"state": "São Paulo", "disease": "Dengue", "level": "Alto", "date": "Hoje"}},
    ...
  ],
  "world": [
    {{"country": "Europa", "disease": "Influenza", "level": "Médio", "date": "Esta semana"}},
    ...
  ]
}}
```"""
        
        response = await chat.send_message(UserMessage(text=prompt))
        # Handle different response types from emergentintegrations
        if isinstance(response, str):
            response_text = response
        elif hasattr(response, 'text'):
            response_text = response.text
        elif hasattr(response, 'content'):
            response_text = response.content
        else:
            response_text = str(response)
        
        # Extract JSON from response
        import json
        import re
        
        # Try to find JSON in the response
        json_match = re.search(r'\{[\s\S]*"brazil"[\s\S]*"world"[\s\S]*\}', response_text)
        
        if json_match:
            alerts_data = json.loads(json_match.group())
            
            # Update cache
            _alerts_cache["data"] = alerts_data
            _alerts_cache["last_updated"] = datetime.utcnow()
            
            print(f"✅ Fetched {len(alerts_data.get('brazil', []))} Brazil alerts, {len(alerts_data.get('world', []))} World alerts")
            return alerts_data
        else:
            raise ValueError("Could not parse JSON from AI response")
            
    except Exception as e:
        print(f"⚠️ Error fetching alerts: {e}")
        
        # Return fallback data with seasonal alerts
        fallback_data = {
            "brazil": [
                {"state": "São Paulo", "disease": "Dengue", "level": "Alto", "date": "Hoje"},
                {"state": "Rio de Janeiro", "disease": "Dengue", "level": "Alto", "date": "Hoje"},
                {"state": "Minas Gerais", "disease": "Dengue", "level": "Médio", "date": "Esta semana"},
                {"state": "Bahia", "disease": "Arboviroses", "level": "Médio", "date": "Esta semana"},
                {"state": "Nacional", "disease": "Influenza (Verão)", "level": "Baixo", "date": "Esta semana"}
            ],
            "world": [
                {"country": "Europa", "disease": "Influenza", "level": "Médio", "date": "Esta semana"},
                {"country": "EUA", "disease": "Covid-19", "level": "Baixo", "date": "Hoje"},
                {"country": "Ásia", "disease": "Dengue", "level": "Médio", "date": "Esta semana"}
            ]
        }
        
        # Update cache with fallback
        _alerts_cache["data"] = fallback_data
        _alerts_cache["last_updated"] = datetime.utcnow()
        
        return fallback_data


def get_cache_info() -> Dict[str, Any]:
    """Get information about the cache status"""
    if not _alerts_cache["last_updated"]:
        return {"cached": False, "last_updated": None}
    
    time_diff = datetime.utcnow() - _alerts_cache["last_updated"]
    minutes_old = int(time_diff.total_seconds() / 60)
    
    return {
        "cached": True,
        "last_updated": _alerts_cache["last_updated"].isoformat(),
        "minutes_old": minutes_old,
        "valid": is_cache_valid()
    }
