"""
Cost Tracker for Gemini API Usage
Tracks token usage and calculates costs per consultation
Uses tiktoken for ACCURATE token counting (same as used by LLMs)
"""
import os
from datetime import datetime, timezone
from typing import Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
import tiktoken

# Gemini pricing (per 1M tokens)
GEMINI_2_0_INPUT_COST = 0.075  # $0.075 per 1M input tokens (2.0 Flash)
GEMINI_2_0_OUTPUT_COST = 0.30  # $0.30 per 1M output tokens (2.0 Flash)

GEMINI_2_5_INPUT_COST = 0.15  # $0.15 per 1M input tokens (2.5 Flash - with vision)
GEMINI_2_5_OUTPUT_COST = 0.60  # $0.60 per 1M output tokens (2.5 Flash - with vision)

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db_name = os.environ.get("DB_NAME", "meduf_ai")
db = client[db_name]
usage_stats_collection = db.usage_stats

# Initialize tiktoken encoder for accurate token counting
# Using cl100k_base which is used by GPT-4 and similar models
try:
    _tokenizer = tiktoken.get_encoding("cl100k_base")
except Exception:
    _tokenizer = None
    print("⚠️ Tiktoken not available, using character-based estimation")


def count_tokens(text: str) -> int:
    """
    Count tokens accurately using tiktoken (industry standard)
    This matches the token counting used by most LLM APIs
    """
    if not text:
        return 0
    
    if _tokenizer:
        try:
            return len(_tokenizer.encode(text))
        except Exception as e:
            print(f"⚠️ Tiktoken error: {e}, falling back to estimation")
    
    # Fallback: rough estimate (1 token ≈ 4 characters)
    return len(text) // 4


def calculate_cost(input_tokens: int, output_tokens: int, model: str = "gemini-2.0-flash") -> float:
    """
    Calculate cost in USD based on token usage and model
    """
    # Use appropriate pricing based on model
    if "2.5" in model:
        input_cost = (input_tokens / 1_000_000) * GEMINI_2_5_INPUT_COST
        output_cost = (output_tokens / 1_000_000) * GEMINI_2_5_OUTPUT_COST
    else:
        input_cost = (input_tokens / 1_000_000) * GEMINI_2_0_INPUT_COST
        output_cost = (output_tokens / 1_000_000) * GEMINI_2_0_OUTPUT_COST
    
    return input_cost + output_cost


async def track_usage(
    user_id: str,
    consultation_type: str,
    input_text: str,
    output_text: str,
    model: str = "gemini-2.0-flash"
):
    """
    Track API usage and cost for a consultation
    Uses tiktoken for ACCURATE token counting
    """
    try:
        # Count tokens accurately using tiktoken
        input_tokens = count_tokens(input_text)
        output_tokens = count_tokens(output_text)
        
        # Calculate cost with REAL token counts (pass model for correct pricing)
        cost_usd = calculate_cost(input_tokens, output_tokens, model)
        
        # Create usage record
        usage_record = {
            "user_id": user_id,
            "consultation_type": consultation_type,
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "cost_usd": cost_usd,
            "timestamp": datetime.now(timezone.utc),
            "month": datetime.now(timezone.utc).strftime("%Y-%m"),
            "year": datetime.now(timezone.utc).year
        }
        
        # Save to database
        await usage_stats_collection.insert_one(usage_record)
        
        print(f"💰 Usage tracked (ACCURATE): {input_tokens + output_tokens} tokens (input: {input_tokens}, output: {output_tokens}), cost: ${cost_usd:.6f}")
        
        return usage_record
        
    except Exception as e:
        print(f"⚠️ Error tracking usage: {e}")
        return None


def get_monthly_stats_sync(year: int = None, month: int = None) -> Dict[str, Any]:
    """
    Get usage statistics for a specific month (synchronous version)
    """
    try:
        from pymongo import MongoClient
        
        # Create sync MongoDB client
        sync_client = MongoClient(MONGO_URL)
        sync_db = sync_client[db_name]
        sync_collection = sync_db.usage_stats
        
        # Default to current month
        if not year or not month:
            now = datetime.now(timezone.utc)
            year = now.year
            month = now.month
        
        month_str = f"{year}-{month:02d}"
        
        # Aggregate stats
        pipeline = [
            {"$match": {"month": month_str}},
            {
                "$group": {
                    "_id": None,
                    "total_consultations": {"$sum": 1},
                    "total_tokens": {"$sum": "$total_tokens"},
                    "total_cost_usd": {"$sum": "$cost_usd"},
                    "input_tokens": {"$sum": "$input_tokens"},
                    "output_tokens": {"$sum": "$output_tokens"}
                }
            }
        ]
        
        result = list(sync_collection.aggregate(pipeline))
        sync_client.close()
        
        if result:
            stats = result[0]
            return {
                "month": month_str,
                "total_consultations": stats.get("total_consultations", 0),
                "total_tokens": stats.get("total_tokens", 0),
                "total_cost_usd": round(stats.get("total_cost_usd", 0), 4),
                "input_tokens": stats.get("input_tokens", 0),
                "output_tokens": stats.get("output_tokens", 0)
            }
        else:
            return {
                "month": month_str,
                "total_consultations": 0,
                "total_tokens": 0,
                "total_cost_usd": 0.0,
                "input_tokens": 0,
                "output_tokens": 0
            }
            
    except Exception as e:
        print(f"⚠️ Error getting monthly stats: {e}")
        now = datetime.now(timezone.utc)
        return {
            "month": f"{now.year}-{now.month:02d}",
            "total_consultations": 0,
            "total_tokens": 0,
            "total_cost_usd": 0.0,
            "error": str(e)
        }


async def get_monthly_stats(year: int = None, month: int = None) -> Dict[str, Any]:
    """
    Get usage statistics for a specific month (async wrapper)
    """
    return get_monthly_stats_sync(year, month)


def get_all_time_stats_sync() -> Dict[str, Any]:
    """
    Get all-time usage statistics (synchronous version)
    """
    try:
        from pymongo import MongoClient
        
        # Create sync MongoDB client
        sync_client = MongoClient(MONGO_URL)
        sync_db = sync_client[db_name]
        sync_collection = sync_db.usage_stats
        
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_consultations": {"$sum": 1},
                    "total_tokens": {"$sum": "$total_tokens"},
                    "total_cost_usd": {"$sum": "$cost_usd"}
                }
            }
        ]
        
        result = list(sync_collection.aggregate(pipeline))
        sync_client.close()
        
        if result:
            stats = result[0]
            return {
                "total_consultations": stats.get("total_consultations", 0),
                "total_tokens": stats.get("total_tokens", 0),
                "total_cost_usd": round(stats.get("total_cost_usd", 0), 4)
            }
        else:
            return {
                "total_consultations": 0,
                "total_tokens": 0,
                "total_cost_usd": 0.0
            }
            
    except Exception as e:
        print(f"⚠️ Error getting all-time stats: {e}")
        return {
            "total_consultations": 0,
            "total_tokens": 0,
            "total_cost_usd": 0.0,
            "error": str(e)
        }


async def get_all_time_stats() -> Dict[str, Any]:
    """
    Get all-time usage statistics (async wrapper)
    """
    return get_all_time_stats_sync()
