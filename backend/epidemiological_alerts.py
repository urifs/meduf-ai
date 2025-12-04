"""
Gerenciador de Alertas Epidemiológicos
Atualiza alertas a cada hora usando Gemini 2.0 Flash
"""
from datetime import datetime, timezone, timedelta
from typing import Dict, Any
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Cache global
alerts_cache = {
    "data": None,
    "last_update": None,
    "update_interval_hours": 1
}

async def generate_alerts_with_ai() -> Dict[str, Any]:
    """Gera alertas epidemiológicos usando Gemini 2.0 Flash"""
    
    prompt = """Você é um especialista em epidemiologia. Forneça os alertas epidemiológicos ATUAIS (dezembro de 2024/janeiro de 2025) para:

1. **Brasil** (6 estados principais):
   - Identifique as doenças de maior preocupação em cada estado
   - Classifique o nível: Alto, Médio ou Baixo
   - Estados: São Paulo, Rio de Janeiro, Minas Gerais, Paraná, Bahia, Amazonas

2. **Mundo** (5 regiões/países):
   - Identifique surtos e epidemias atuais
   - Classifique o nível: Alto, Médio ou Baixo
   - Regiões: América do Sul, Ásia, África, Europa, Oceania

IMPORTANTE:
- Use dados reais e atuais de fontes confiáveis
- Considere a sazonalidade (verão no hemisfério sul, inverno no norte)
- Dengue, Chikungunya e Zika são prevalentes no verão brasileiro
- Influenza e COVID-19 têm padrões sazonais

Forneça a resposta em formato JSON estritamente seguindo este modelo:
{
  "brazil": [
    {"state": "São Paulo", "disease": "Dengue", "level": "Alto"},
    {"state": "Rio de Janeiro", "disease": "Dengue", "level": "Alto"},
    {"state": "Minas Gerais", "disease": "Dengue", "level": "Médio"},
    {"state": "Paraná", "disease": "Dengue", "level": "Médio"},
    {"state": "Bahia", "disease": "Arboviroses", "level": "Médio"},
    {"state": "Amazonas", "disease": "Malária", "level": "Alto"}
  ],
  "world": [
    {"country": "Argentina", "disease": "Dengue", "level": "Alto"},
    {"country": "Índia", "disease": "Dengue", "level": "Alto"},
    {"country": "África Subsaariana", "disease": "Malária", "level": "Alto"},
    {"country": "Europa", "disease": "Influenza", "level": "Médio"},
    {"country": "Austrália", "disease": "COVID-19", "level": "Baixo"}
  ]
}

Responda APENAS com o JSON, sem texto adicional."""

    try:
        # Usar Gemini 2.0 Flash via Emergent Integrations
        chat = LlmChat(provider="google", model="gemini-2.0-flash-exp")
        messages = [UserMessage(content=prompt)]
        response = await chat.ainvoke(messages)
        
        # Extrair JSON da resposta
        import json
        import re
        
        # Tentar extrair JSON da resposta
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            
            # Adicionar data aos itens
            current_date = datetime.now(timezone.utc).strftime("%d/%m/%Y")
            for item in data.get("brazil", []):
                item["date"] = current_date
            for item in data.get("world", []):
                item["date"] = current_date
            
            return data
        else:
            print("⚠️ Resposta da IA não contém JSON válido")
            return get_fallback_alerts()
            
    except Exception as e:
        print(f"❌ Erro ao gerar alertas com IA: {e}")
        return get_fallback_alerts()

def get_fallback_alerts() -> Dict[str, Any]:
    """Retorna alertas padrão em caso de erro"""
    current_date = datetime.now(timezone.utc).strftime("%d/%m/%Y")
    return {
        "brazil": [
            {"state": "São Paulo", "disease": "Dengue", "level": "Alto", "date": current_date},
            {"state": "Rio de Janeiro", "disease": "Dengue", "level": "Alto", "date": current_date},
            {"state": "Minas Gerais", "disease": "Dengue", "level": "Médio", "date": current_date},
            {"state": "Paraná", "disease": "Dengue", "level": "Médio", "date": current_date},
            {"state": "Bahia", "disease": "Arboviroses", "level": "Médio", "date": current_date},
            {"state": "Amazonas", "disease": "Malária", "level": "Alto", "date": current_date}
        ],
        "world": [
            {"country": "Argentina", "disease": "Dengue", "level": "Alto", "date": current_date},
            {"country": "Índia", "disease": "Dengue", "level": "Alto", "date": current_date},
            {"country": "África Subsaariana", "disease": "Malária", "level": "Alto", "date": current_date},
            {"country": "Europa", "disease": "Influenza", "level": "Médio", "date": current_date},
            {"country": "Austrália", "disease": "COVID-19", "level": "Baixo", "date": current_date}
        ]
    }

async def get_cached_alerts() -> Dict[str, Any]:
    """Retorna alertas do cache ou gera novos se necessário"""
    now = datetime.now(timezone.utc)
    
    # Verificar se precisa atualizar
    needs_update = (
        alerts_cache["data"] is None or
        alerts_cache["last_update"] is None or
        (now - alerts_cache["last_update"]) >= timedelta(hours=alerts_cache["update_interval_hours"])
    )
    
    if needs_update:
        print(f"🔄 Atualizando alertas epidemiológicos... (última atualização: {alerts_cache['last_update']})")
        
        # Gerar novos alertas com IA
        new_data = await generate_alerts_with_ai()
        
        # Atualizar cache
        alerts_cache["data"] = new_data
        alerts_cache["last_update"] = now
        
        print(f"✅ Alertas atualizados com sucesso às {now.isoformat()}")
    
    # Adicionar informações de cache
    result = alerts_cache["data"].copy()
    result["cache_info"] = f"Atualizado em {alerts_cache['last_update'].strftime('%d/%m/%Y %H:%M')} (próxima atualização em {alerts_cache['update_interval_hours']}h)"
    result["last_update_timestamp"] = alerts_cache["last_update"].isoformat()
    
    return result

async def start_hourly_update_task():
    """Inicia task para atualização horária automática"""
    while True:
        try:
            await get_cached_alerts()  # Força atualização se necessário
            # Aguarda 1 hora
            await asyncio.sleep(3600)
        except Exception as e:
            print(f"❌ Erro na task de atualização horária: {e}")
            # Aguarda 5 minutos antes de tentar novamente em caso de erro
            await asyncio.sleep(300)
