"""
Timezone utilities for Meduf AI
Always use São Paulo, Brazil timezone
"""
from datetime import datetime, timezone
import pytz

# São Paulo timezone
SAO_PAULO_TZ = pytz.timezone('America/Sao_Paulo')

def now_sao_paulo():
    """Get current datetime in São Paulo timezone"""
    return datetime.now(SAO_PAULO_TZ)

def utc_to_sao_paulo(utc_dt):
    """Convert UTC datetime to São Paulo timezone"""
    if utc_dt.tzinfo is None:
        utc_dt = pytz.utc.localize(utc_dt)
    return utc_dt.astimezone(SAO_PAULO_TZ)

def sao_paulo_to_utc(sp_dt):
    """Convert São Paulo datetime to UTC"""
    if sp_dt.tzinfo is None:
        sp_dt = SAO_PAULO_TZ.localize(sp_dt)
    return sp_dt.astimezone(pytz.utc)
