"""
Meduf AI - Backend Reescrito
Sistema médico profissional com IA
Versão: 2.0 - Limpa e Confiável
"""
import os
import asyncio
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from bson import ObjectId
from pathlib import Path
import shutil
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Validate critical configuration
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
if not EMERGENT_LLM_KEY:
    raise ValueError("❌ EMERGENT_LLM_KEY é obrigatória mas não está configurada")
print(f"✅ EMERGENT_LLM_KEY carregada: {EMERGENT_LLM_KEY[:15]}...")

# Configuration
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
SECRET_KEY = os.environ.get("SECRET_KEY", "supersecretkey123")
ADMIN_USER = os.environ.get("ADMIN_USER", "ur1fs")
ADMIN_PASS = os.environ.get("ADMIN_PASS", "@Fred1807")

# Database
client = AsyncIOMotorClient(MONGO_URL)
db_name = os.environ.get("DB_NAME", "test_database")
db = client[db_name]
users_collection = db.users
consultations_collection = db.consultations
costs_collection = db.usage_stats
feedbacks_collection = db.feedbacks

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# FastAPI app
app = FastAPI(title="Meduf AI", version="2.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
static_path = Path(__file__).parent / "static"
static_path.mkdir(exist_ok=True)
app.mount("/api/static", StaticFiles(directory=str(static_path)), name="static")

# Models
class UserInDB(BaseModel):
    id: str
    email: str
    name: str
    password_hash: str
    role: str = "USER"
    avatar_url: Optional[str] = None
    expiration_date: Optional[datetime] = None
    deleted: bool = False

class Token(BaseModel):
    access_token: str
    token_type: str
    user_name: str
    user_role: str
    expiration_date: Optional[str] = None
    avatar_url: Optional[str] = ""

# Import AI modules
from ai_medical_consensus import (
    analyze_diagnosis,
    analyze_drug_interaction,
    analyze_medication_guide,
    analyze_toxicology
)

# Import task manager
from task_manager import TaskManager, TaskStatus
task_manager = TaskManager()

# Timezone utilities
from timezone_utils import now_sao_paulo


# ===== AUTHENTICATION =====

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return UserInDB(
            id=str(user["_id"]),
            email=user["email"],
            name=user["name"],
            password_hash=user["password_hash"],
            role=user.get("role", "USER"),
            avatar_url=user.get("avatar_url"),
            expiration_date=user.get("expiration_date"),
            deleted=user.get("deleted", False)
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_active_user(current_user: UserInDB = Depends(get_current_user)):
    if current_user.deleted:
        raise HTTPException(status_code=403, detail="Account deleted")
    return current_user


# ===== API ENDPOINTS =====

@app.get("/api/system/health")
async def health_check():
    """Health check with system status"""
    return {
        "status": "healthy",
        "version": "2.0",
        "emergent_llm_key": bool(EMERGENT_LLM_KEY),
        "database": db_name,
        "features": {
            "diagnostico_simples": True,
            "guia_terapeutico": True,
            "toxicologia": True,
            "diagnostico_detalhado": True,
            "interacao_medicamentosa": True
        }
    }


@app.post("/api/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login endpoint"""
    # Clean input
    username = form_data.username.strip().lower()
    
    # Find user
    user = await users_collection.find_one({"email": username})
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Check deleted
    if user.get("deleted"):
        raise HTTPException(
            status_code=403,
            detail="Sua conta foi excluída ou expirou. Para renovar, clique em 'Adquirir Acesso'."
        )
    
    # Check expiration
    if user.get("expiration_date") and user["expiration_date"] < datetime.utcnow():
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"deleted": True, "deleted_at": datetime.utcnow()}}
        )
        raise HTTPException(
            status_code=403,
            detail="Sua conta expirou. Para renovar, clique em 'Adquirir Acesso'."
        )
    
    # Verify password
    if not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Senha incorreta")
    
    # Create token
    access_token = create_access_token({"sub": str(user["_id"])})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_name": user["name"],
        "user_role": user.get("role", "USER"),
        "expiration_date": user.get("expiration_date").isoformat() if user.get("expiration_date") else None,
        "avatar_url": user.get("avatar_url", "")
    }


@app.get("/api/users/me")
async def get_user_profile(current_user: UserInDB = Depends(get_current_active_user)):
    """Get current user profile"""
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "avatar_url": current_user.avatar_url or ""
    }


@app.post("/api/users/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Upload user avatar"""
    try:
        upload_dir = static_path / "uploads"
        upload_dir.mkdir(exist_ok=True)
        
        # Save file
        file_ext = Path(file.filename).suffix
        filename = f"{current_user.id}{file_ext}"
        file_path = upload_dir / filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Update database
        avatar_url = f"/api/static/uploads/{filename}"
        await users_collection.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": {"avatar_url": avatar_url}}
        )
        
        return {"avatar_url": avatar_url}
    except Exception as e:
        print(f"Error uploading avatar: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== AI ENDPOINTS =====

@app.post("/api/ai/consensus/diagnosis")
async def create_diagnosis_task(
    patient_data: dict,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Create diagnosis analysis task"""
    try:
        task_id = task_manager.create_task("diagnosis")
        
        # Start background task
        asyncio.create_task(
            task_manager.execute_task(
                task_id,
                analyze_diagnosis,
                queixa=patient_data.get("queixa", ""),
                idade=patient_data.get("idade", "N/I"),
                sexo=patient_data.get("sexo", "N/I")
            )
        )
        
        return {"task_id": task_id, "message": "Análise iniciada"}
    except Exception as e:
        print(f"Error creating diagnosis task: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/consensus/medication-guide")
async def create_medication_guide_task(
    data: dict,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Create medication guide task"""
    try:
        task_id = task_manager.create_task("medication_guide")
        
        # Accept both 'symptoms' and 'condition' for flexibility
        condition = data.get("symptoms") or data.get("condition", "")
        
        asyncio.create_task(
            task_manager.execute_task(
                task_id,
                analyze_medication_guide,
                condition=condition,
                patient_age=data.get("age", "N/I"),
                contraindications=data.get("contraindications")
            )
        )
        
        return {"task_id": task_id, "message": "Análise iniciada"}
    except Exception as e:
        print(f"Error creating medication guide task: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/consensus/toxicology")
async def create_toxicology_task(
    data: dict,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Create toxicology analysis task"""
    try:
        task_id = task_manager.create_task("toxicology")
        
        asyncio.create_task(
            task_manager.execute_task(
                task_id,
                analyze_toxicology,
                agent=data.get("substance", ""),
                exposure_route=data.get("route"),
                symptoms=data.get("symptoms")
            )
        )
        
        return {"task_id": task_id, "message": "Análise iniciada"}
    except Exception as e:
        print(f"Error creating toxicology task: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/consensus/drug-interaction")
async def create_drug_interaction_task(
    data: dict,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Create drug interaction task - supports 2 to 10 medications"""
    try:
        medications = data.get("medications", [])
        if len(medications) < 2:
            raise HTTPException(status_code=400, detail="Mínimo 2 medicamentos necessários")
        if len(medications) > 10:
            raise HTTPException(status_code=400, detail="Máximo 10 medicamentos permitidos")
        
        task_id = task_manager.create_task("drug_interaction")
        
        asyncio.create_task(
            task_manager.execute_task(
                task_id,
                analyze_drug_interaction,
                medications=medications,
                patient_info=data.get("patient_info")
            )
        )
        
        return {"task_id": task_id, "message": f"Análise iniciada para {len(medications)} medicamentos"}
    except Exception as e:
        print(f"Error creating drug interaction task: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ai/tasks/{task_id}")
async def get_task_status(
    task_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get task status"""
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


# ===== ADMIN =====

@app.get("/api/admin/users")
async def get_admin_users(current_user: UserInDB = Depends(get_current_active_user)):
    """Get all users (admin only)"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    
    users = []
    cursor = users_collection.find({"deleted": {"$ne": True}}).sort("created_at", -1).limit(1000)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        # Add id field from username or email
        doc["id"] = doc.get("username", doc.get("email", ""))
        doc["status"] = "Ativo" if not doc.get("deleted") else "Inativo"
        users.append(doc)
    return users


@app.get("/api/admin/consultations")
async def get_admin_consultations(current_user: UserInDB = Depends(get_current_active_user)):
    """Get all consultations (admin only)"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    
    consultations = []
    cursor = consultations_collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(1000)
    async for doc in cursor:
        consultations.append(doc)
    return consultations


@app.get("/api/admin/stats/online")
async def get_online_stats(current_user: UserInDB = Depends(get_current_active_user)):
    """Get online users stats (admin only)"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Simple mock - return count of active users
    count = await users_collection.count_documents({"deleted": {"$ne": True}})
    return {"online": count}


@app.get("/api/admin/usage-stats/monthly")
async def get_monthly_usage(current_user: UserInDB = Depends(get_current_active_user)):
    """Get monthly usage statistics (admin only)"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Get count of consultations this month
    from datetime import datetime, timezone
    start_of_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    count = await consultations_collection.count_documents({
        "timestamp": {"$gte": start_of_month}
    })
    
    return {
        "total_consultations": count,
        "total_tokens": count * 2500,  # Estimate
        "total_cost_usd": count * 0.01  # Estimate
    }


@app.get("/api/admin/deleted-users")
async def get_deleted_users(current_user: UserInDB = Depends(get_current_active_user)):
    """Get deleted users (admin only)"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    
    users = []
    cursor = users_collection.find({"deleted": True}).sort("deleted_at", -1).limit(100)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        doc["id"] = doc.get("username", doc.get("email", ""))
        users.append(doc)
    return users


@app.get("/api/feedbacks")
async def get_feedbacks(current_user: UserInDB = Depends(get_current_active_user)):
    """Get all feedbacks"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    
    feedbacks = []
    cursor = db.feedbacks.find({}, {"_id": 0}).sort("timestamp", -1).limit(500)
    async for doc in cursor:
        feedbacks.append(doc)
    return feedbacks


# ===== CONSULTATIONS =====

@app.post("/api/consultations")
async def create_consultation(
    data: dict,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Save consultation to database"""
    try:
        consultation = {
            "user_id": current_user.email,
            "user_email": current_user.email,
            "timestamp": datetime.now(timezone.utc),
            "patient": data.get("patient", {}),
            "report": data.get("report", {})
        }
        
        result = await consultations_collection.insert_one(consultation)
        return {"id": str(result.inserted_id), "message": "Consultation saved"}
    except Exception as e:
        print(f"Error saving consultation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/consultations")
async def get_consultations(
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get user consultations"""
    try:
        # Admin sees all, users see only their own
        query = {} if current_user.role == "ADMIN" else {"user_id": current_user.email}
        
        consultations = []
        cursor = consultations_collection.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit)
        async for doc in cursor:
            consultations.append(doc)
        
        return {"consultations": consultations}
    except Exception as e:
        print(f"Error fetching consultations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== EPIDEMIOLOGICAL ALERTS =====

@app.get("/api/epidemiological-alerts")
async def get_epidemiological_alerts():
    """Get epidemiological alerts (mock for now)"""
    return {
        "alerts": [
            {
                "id": "1",
                "disease": "Dengue",
                "severity": "Alto",
                "region": "Nacional",
                "updated": datetime.now(timezone.utc).isoformat()
            }
        ]
    }


# ===== STARTUP =====

@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    print("=" * 80)
    print("🏥 MEDUF AI - Backend v2.0 Iniciando...")
    print("=" * 80)
    print(f"✅ Database: {db_name}")
    print("✅ EMERGENT_LLM_KEY: Configurada")
    print("✅ Funcionalidades: 5 principais")
    print("=" * 80)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
