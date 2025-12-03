"""
Script para limpar todos os dados relacionados ao "Leitor de Exames" do banco de dados
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

async def cleanup_exam_reader_data():
    """Remove todos os dados relacionados ao exam-reader"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🧹 Limpando dados do 'Leitor de Exames'...\n")
    
    # 1. Remover consultas com analysis_type 'exam-reader'
    result = await db.consultations.delete_many({
        "report.analysis_type": "exam-reader"
    })
    print(f"✅ Consultas 'exam-reader' removidas: {result.deleted_count}")
    
    # 2. Remover feedbacks com analysis_type 'exam-reader'
    result = await db.feedbacks.delete_many({
        "analysis_type": "exam-reader"
    })
    print(f"✅ Feedbacks 'exam-reader' removidos: {result.deleted_count}")
    
    # 3. Verificar se existem outros documentos relacionados
    consultations_count = await db.consultations.count_documents({})
    feedbacks_count = await db.feedbacks.count_documents({})
    
    print(f"\n📊 Status do banco após limpeza:")
    print(f"  - Total de consultas: {consultations_count}")
    print(f"  - Total de feedbacks: {feedbacks_count}")
    
    print("\n✅ Limpeza concluída com sucesso!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(cleanup_exam_reader_data())
