"""
AI Medical Consensus Engine
Uses Gemini for medical diagnosis
Returns diagnosis based on AI analysis
"""
import os
import asyncio
from typing import Dict, List, Any, Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage
import aiohttp
import xml.etree.ElementTree as ET
import json


# Get Emergent Universal Key from environment - NO FALLBACK
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
if not EMERGENT_KEY:
    raise ValueError("EMERGENT_LLM_KEY not found in environment variables. Please configure it in your deployment.")