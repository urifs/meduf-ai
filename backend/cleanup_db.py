import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "meduf_ai")

async def cleanup():
    print(f"Connecting to {MONGO_URL} - DB: {DB_NAME}")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    collections_to_drop = [
        "stories", "likes", "follow_request", "notifications", 
        "follows", "user_scores", "comments", "posts"
    ]
    
    existing_collections = await db.list_collection_names()
    print(f"Existing collections: {existing_collections}")
    
    for col_name in collections_to_drop:
        if col_name in existing_collections:
            try:
                await db[col_name].drop()
                print(f"Dropped collection: {col_name}")
            except Exception as e:
                print(f"Error dropping {col_name}: {e}")
        else:
            print(f"Collection {col_name} not found, skipping.")

if __name__ == "__main__":
    asyncio.run(cleanup())
