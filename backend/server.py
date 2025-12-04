"""
Meduf AI - Backend Reescrito
Sistema médico profissional com IA
Versão: 2.0 - Limpa e Confiável
"""
import os
import asyncio
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import uuid4
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
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Load environment
load_dotenv()

# Helper function to ensure datetime has UTC timezone
def ensure_utc_timezone(dt):
    """Convert naive datetime from MongoDB to UTC aware datetime"""
    if dt is None:
        return None
    if isinstance(dt, datetime):
        if dt.tzinfo is None:
            # Naive datetime from MongoDB is actually UTC
            return dt.replace(tzinfo=timezone.utc)
        return dt
    return dt

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
chat_history_collection = db.chat_history

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)
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
    bio: Optional[str] = None
    expiration_date: Optional[datetime] = None
    deleted: bool = False
    active_session_token: Optional[str] = None  # Token da sessão ativa

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
        
        # Verificar se o token é o token da sessão ativa
        active_token = user.get("active_session_token")
        if active_token and active_token != token:
            raise HTTPException(
                status_code=401, 
                detail="Sessão expirada. Sua conta foi conectada em outro dispositivo."
            )
        
        return UserInDB(
            id=str(user["_id"]),
            email=user["email"],
            name=user["name"],
            password_hash=user["password_hash"],
            role=user.get("role", "USER"),
            avatar_url=user.get("avatar_url"),
            bio=user.get("bio", ""),
            expiration_date=user.get("expiration_date"),
            deleted=user.get("deleted", False),
            active_session_token=user.get("active_session_token")
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
    
    # Create new token
    access_token = create_access_token({"sub": str(user["_id"])})
    
    # Update user with new session token and last activity
    # This will invalidate any previous session
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "last_activity": datetime.now(timezone.utc),
            "active_session_token": access_token  # Salva o token da sessão ativa
        }}
    )
    
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
        "avatar_url": current_user.avatar_url or "",
        "bio": getattr(current_user, 'bio', '')
    }


@app.patch("/api/users/me")
async def update_user_profile(
    data: dict,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Update current user profile"""
    try:
        update_data = {}
        if "name" in data:
            update_data["name"] = data["name"]
        if "bio" in data:
            update_data["bio"] = data["bio"]
        if "avatar_url" in data:
            update_data["avatar_url"] = data["avatar_url"]
        
        if update_data:
            await users_collection.update_one(
                {"_id": ObjectId(current_user.id)},
                {"$set": update_data}
            )
        
        return {
            "name": data.get("name", current_user.name),
            "avatar_url": data.get("avatar_url", current_user.avatar_url),
            "bio": data.get("bio", "")
        }
    except Exception as e:
        print(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail="Erro ao atualizar perfil")


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
        
        # Convert datetime fields to UTC aware
        if "created_at" in doc:
            doc["created_at"] = ensure_utc_timezone(doc["created_at"])
        if "expiration_date" in doc:
            doc["expiration_date"] = ensure_utc_timezone(doc["expiration_date"])
        if "deleted_at" in doc:
            doc["deleted_at"] = ensure_utc_timezone(doc["deleted_at"])
        if "reactivated_at" in doc:
            doc["reactivated_at"] = ensure_utc_timezone(doc["reactivated_at"])
        if "last_activity" in doc:
            doc["last_activity"] = ensure_utc_timezone(doc["last_activity"])
            
        users.append(doc)
    return users


@app.post("/api/admin/users")
async def create_user(
    user_data: dict,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Create a new user (admin only)"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        # Validate required fields
        if not user_data.get("email") or not user_data.get("password"):
            raise HTTPException(status_code=400, detail="Email e senha são obrigatórios")
        
        # Check if user already exists
        existing = await users_collection.find_one({"email": user_data.get("email")})
        if existing:
            raise HTTPException(status_code=400, detail="Email já cadastrado")
        
        # Calculate expiration date
        days_valid = user_data.get("days_valid", 30)
        expiration_date = datetime.now(timezone.utc) + timedelta(days=days_valid)
        
        # Create user document
        new_user = {
            "username": user_data.get("name", user_data.get("email")),
            "name": user_data.get("name", user_data.get("email")),
            "email": user_data.get("email"),
            "password_hash": get_password_hash(user_data.get("password")),
            "role": user_data.get("role", "USER"),
            "expiration_date": expiration_date,
            "created_at": datetime.now(timezone.utc),
            "deleted": False,
            "session_id": str(uuid4()),
            "avatar_url": ""
        }
        
        result = await users_collection.insert_one(new_user)
        
        return {
            "id": str(result.inserted_id),
            "message": "Usuário criado com sucesso",
            "email": new_user["email"],
            "name": new_user["name"]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/admin/users/{user_id}")
async def update_user_expiration(
    user_id: str,
    data: dict,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Update user expiration date (admin only)"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        days_valid = data.get("days_valid", 30)
        new_expiration = datetime.now(timezone.utc) + timedelta(days=days_valid)
        
        # Try to find user by _id first, then by email as fallback
        try:
            result = await users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"expiration_date": new_expiration}}
            )
        except:
            # If ObjectId conversion fails, try by email
            result = await users_collection.update_one(
                {"email": user_id},
                {"$set": {"expiration_date": new_expiration}}
            )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        return {"message": "Validade atualizada com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating expiration: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/admin/users/{user_id}/status")
async def toggle_user_status(
    user_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Toggle user active/inactive status (admin only)"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        # Try to find user by _id first, then by email as fallback
        try:
            user = await users_collection.find_one({"_id": ObjectId(user_id)})
        except:
            user = await users_collection.find_one({"email": user_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        new_deleted_status = not user.get("deleted", False)
        
        # Update using the same identifier we found the user with
        try:
            await users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {
                    "deleted": new_deleted_status,
                    "deleted_at": datetime.now(timezone.utc) if new_deleted_status else None
                }}
            )
        except:
            await users_collection.update_one(
                {"email": user_id},
                {"$set": {
                    "deleted": new_deleted_status,
                    "deleted_at": datetime.now(timezone.utc) if new_deleted_status else None
                }}
            )
        
        new_status = "Inativo" if new_deleted_status else "Ativo"
        
        return {"status": new_status, "message": f"Status atualizado para {new_status}"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error toggling status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Soft delete user (admin only)"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        # Soft delete instead of permanent delete
        # Try to find user by _id first, then by email as fallback
        try:
            result = await users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {
                    "deleted": True,
                    "deleted_at": datetime.now(timezone.utc)
                }}
            )
        except:
            result = await users_collection.update_one(
                {"email": user_id},
                {"$set": {
                    "deleted": True,
                    "deleted_at": datetime.now(timezone.utc)
                }}
            )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        return {"message": "Usuário excluído com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/admin/users/{user_id}/permanent")
async def permanently_delete_user(
    user_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Permanently delete user from database (admin only)"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        print(f"[PERMANENT DELETE] Attempting to delete user: {user_id}")
        
        # First try to find by email or username (since frontend sends email as id)
        result = await users_collection.delete_one({"$or": [{"email": user_id}, {"username": user_id}]})
        
        # If not found, try by _id
        if result.deleted_count == 0:
            try:
                result = await users_collection.delete_one({"_id": ObjectId(user_id)})
            except Exception as e:
                print(f"[PERMANENT DELETE] Failed to convert to ObjectId: {e}")
        
        if result.deleted_count == 0:
            print(f"[PERMANENT DELETE] User not found: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        print(f"[PERMANENT DELETE] Successfully deleted {result.deleted_count} user(s)")
        return {"message": "User permanently deleted", "deleted_count": result.deleted_count}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PERMANENT DELETE] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/users/{user_id}/reactivate")
async def reactivate_user(
    user_id: str,
    data: dict,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Reactivate deleted/expired user (admin only)"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        days_valid = data.get("days_valid", 30)
        new_expiration = datetime.now(timezone.utc) + timedelta(days=days_valid)
        
        result = await users_collection.update_one(
            {"email": user_id},
            {"$set": {
                "deleted": False,
                "deleted_at": None,
                "expiration_date": new_expiration,
                "reactivated_at": datetime.now(timezone.utc)
            }}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        return {"message": f"Usuário reativado com {days_valid} dias de validade"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error reactivating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/consultations")
async def get_admin_consultations(current_user: UserInDB = Depends(get_current_active_user)):
    """Get all consultations (admin only)"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    
    consultations = []
    cursor = consultations_collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(1000)
    async for doc in cursor:
        # Convert timestamp to UTC aware
        if "timestamp" in doc:
            doc["timestamp"] = ensure_utc_timezone(doc["timestamp"])
        if "created_at" in doc:
            doc["created_at"] = ensure_utc_timezone(doc["created_at"])
        consultations.append(doc)
    return consultations


@app.get("/api/admin/stats/online")
async def get_online_stats(current_user: UserInDB = Depends(get_current_active_user)):
    """Get online users stats (admin only) - users active in the last 5 minutes"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Count users who had activity in the last 5 minutes based on last_activity field
    now = datetime.now(timezone.utc)
    five_minutes_ago = now - timedelta(minutes=5)
    
    online_count = await users_collection.count_documents({
        "deleted": {"$ne": True},
        "last_activity": {"$gte": five_minutes_ago}
    })
    
    return {"online_count": online_count, "online": online_count}


async def get_current_admin_user(current_user: UserInDB = Depends(get_current_active_user)):
    """Helper function to get current admin user"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    return current_user


@app.get("/api/admin/stats/online-count")
async def get_online_count(
    current_user: UserInDB = Depends(get_current_admin_user)
):
    """Get count of users online in the last 5 minutes"""
    try:
        five_minutes_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
        online_count = await users_collection.count_documents({
            "last_activity": {"$gte": five_minutes_ago},
            "deleted": {"$ne": True}
        })
        return {"online_count": online_count}
    except Exception as e:
        print(f"Error getting online count: {e}")
        return {"online_count": 0}


@app.get("/api/admin/online-users")
async def get_online_users(
    current_user: UserInDB = Depends(get_current_admin_user)
):
    """Get list of users online in the last 5 minutes"""
    try:
        five_minutes_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
        online_users = []
        cursor = users_collection.find(
            {
                "last_activity": {"$gte": five_minutes_ago},
                "deleted": {"$ne": True}
            },
            {"_id": 0, "password_hash": 0}
        ).sort("last_activity", -1)
        
        async for user in cursor:
            if user.get("last_activity"):
                user["last_activity"] = ensure_utc_timezone(user["last_activity"]).isoformat()
            online_users.append(user)
        
        return online_users
    except Exception as e:
        print(f"Error getting online users: {e}")
        return []


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
        
        # Convert datetime fields to UTC aware
        if "created_at" in doc:
            doc["created_at"] = ensure_utc_timezone(doc["created_at"])
        if "deleted_at" in doc:
            doc["deleted_at"] = ensure_utc_timezone(doc["deleted_at"])
        if "expiration_date" in doc:
            doc["expiration_date"] = ensure_utc_timezone(doc["expiration_date"])
            
        users.append(doc)
    return users


@app.post("/api/feedback")
async def submit_feedback(
    feedback_data: dict,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Submit user feedback"""
    try:
        feedback = {
            "user_id": current_user.email,
            "user_email": current_user.email,
            "user_name": getattr(current_user, 'name', None) or getattr(current_user, 'username', None) or current_user.email,
            "analysis_type": feedback_data.get("analysis_type", "unknown"),
            "is_helpful": feedback_data.get("is_helpful", True),
            "result_data": feedback_data.get("result_data", {}),
            "timestamp": datetime.now(timezone.utc)
        }
        
        result = await db.feedbacks.insert_one(feedback)
        
        return {
            "id": str(result.inserted_id),
            "message": "Feedback enviado com sucesso"
        }
    except Exception as e:
        print(f"Error saving feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/feedbacks")
async def get_feedbacks(current_user: UserInDB = Depends(get_current_active_user)):
    """Get all feedbacks"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    
    feedbacks = []
    cursor = db.feedbacks.find({}).sort("timestamp", -1).limit(500)
    async for doc in cursor:
        # Convert ObjectId to string
        doc["_id"] = str(doc["_id"])
        feedbacks.append(doc)
    return feedbacks


# ===== DATABASE MANAGER =====

@app.get("/api/admin/db/collections")
async def get_collections(current_user: UserInDB = Depends(get_current_active_user)):
    """Get all database collections (admin only)"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        collections = await db.list_collection_names()
        # Return with count for each collection
        result = []
        for coll_name in collections:
            count = await db[coll_name].count_documents({})
            result.append({
                "name": coll_name,
                "count": count
            })
        return result
    except Exception as e:
        print(f"Error listing collections: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/db/{collection_name}")
async def get_collection_documents(
    collection_name: str,
    q: str = "",
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get documents from a collection (admin only)"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        collection = db[collection_name]
        
        # Build query
        query = {}
        if q:
            # Simple text search in all string fields
            query = {"$or": [
                {field: {"$regex": q, "$options": "i"}} 
                for field in ["email", "name", "username", "user_name", "user_email"]
            ]}
        
        documents = []
        cursor = collection.find(query).limit(limit)
        async for doc in cursor:
            # Convert ObjectId to string
            doc["_id"] = str(doc["_id"])
            documents.append(doc)
        
        return documents
    except Exception as e:
        print(f"Error fetching documents from {collection_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/db/{collection_name}")
async def create_document(
    collection_name: str,
    data: dict,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Create a new document in a collection (admin only)"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        collection = db[collection_name]
        result = await collection.insert_one(data)
        return {"id": str(result.inserted_id), "message": "Document created"}
    except Exception as e:
        print(f"Error creating document in {collection_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/admin/db/{collection_name}/{doc_id}")
async def update_document(
    collection_name: str,
    doc_id: str,
    data: dict,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Update a document in a collection (admin only)"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        from bson import ObjectId
        collection = db[collection_name]
        
        # Remove _id from data if present
        data.pop("_id", None)
        
        result = await collection.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {"message": "Document updated"}
    except Exception as e:
        print(f"Error updating document in {collection_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/admin/db/{collection_name}/{doc_id}")
async def delete_document(
    collection_name: str,
    doc_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Delete a document from a collection (admin only)"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        from bson import ObjectId
        collection = db[collection_name]
        
        result = await collection.delete_one({"_id": ObjectId(doc_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {"message": "Document deleted"}
    except Exception as e:
        print(f"Error deleting document from {collection_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
            "user_name": getattr(current_user, 'name', None) or getattr(current_user, 'username', None) or current_user.email,
            "timestamp": datetime.now(timezone.utc),
            "patient": data.get("patient", {}),
            "report": data.get("report", {}),
            "model": "Meduf 2.0 Clinic"
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
            # Ensure timezone info for timestamps
            if doc.get("timestamp"):
                doc["timestamp"] = ensure_utc_timezone(doc["timestamp"]).isoformat()
            if doc.get("created_at"):
                doc["created_at"] = ensure_utc_timezone(doc["created_at"]).isoformat()
            consultations.append(doc)
        
        return consultations
    except Exception as e:
        print(f"Error fetching consultations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== EPIDEMIOLOGICAL ALERTS =====

@app.get("/api/epidemiological-alerts")
async def get_epidemiological_alerts():
    """Get epidemiological alerts - Updated hourly with Gemini 2.0 Flash"""
    from epidemiological_alerts import get_cached_alerts
    return await get_cached_alerts()


# ===== MEDICAL CHAT =====

@app.post("/api/medical-chat")
async def medical_chat(
    data: dict,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Free medical consultation with AI for specialists"""
    try:
        user_message = data.get("message", "")
        history = data.get("history", [])
        
        if not user_message:
            raise HTTPException(status_code=400, detail="Mensagem não pode estar vazia")
        
        # Build conversation context
        conversation = []
        for msg in history[-5:]:  # Last 5 messages for context
            conversation.append(f"{msg['role'].upper()}: {msg['content']}")
        
        # Create specialized medical prompt
        system_prompt = """Você é um assistente médico especializado para médicos. 

IMPORTANTE:
- Use linguagem técnica e científica apropriada para médicos especialistas
- Baseie suas respostas em evidências médicas e guidelines atualizados
- Cite protocolos, diretrizes e estudos quando relevante
- Seja preciso com dosagens, contraindicações e interações
- Mantenha tom profissional e conciso
- Se não tiver certeza, indique claramente

Seu objetivo é auxiliar médicos em suas decisões clínicas com informações técnicas precisas."""

        full_prompt = f"""{system_prompt}

CONTEXTO DA CONVERSA:
{chr(10).join(conversation) if conversation else "Primeira mensagem"}

PERGUNTA DO MÉDICO:
{user_message}

RESPOSTA TÉCNICA:"""

        # Use Gemini 2.0 Flash with Emergent Universal Key
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"medical_chat_{current_user.id}",
            system_message=system_prompt
        ).with_model("gemini", "gemini-2.0-flash")
        
        user_msg = UserMessage(text=full_prompt)
        response = await chat.send_message(user_msg)
        
        # Save conversation to database
        chat_entry = {
            "id": str(uuid4()),
            "user_id": current_user.id,
            "user_email": current_user.email,
            "user_name": current_user.name,
            "user_message": user_message,
            "ai_response": response,
            "created_at": datetime.now(timezone.utc),
            "model": "Meduf 2.0 Clinic"
        }
        await chat_history_collection.insert_one(chat_entry)
        
        return {
            "response": response,
            "model": "Meduf 2.0 Clinic"
        }
        
    except Exception as e:
        import traceback
        print(f"❌ Error in medical chat: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao processar consulta: {str(e)}")


# ===== USER CHAT HISTORY =====

@app.get("/api/my-chat-history")
async def get_my_chat_history(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get chat history for current user"""
    try:
        chats = await chat_history_collection.find(
            {"user_id": current_user.id}, 
            {"_id": 0}
        ).sort("created_at", -1).to_list(1000)
        
        # Ensure timezone info
        for chat in chats:
            if chat.get("created_at"):
                chat["created_at"] = ensure_utc_timezone(chat["created_at"]).isoformat()
        
        return chats
    except Exception as e:
        print(f"Error fetching user chat history: {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar histórico de conversas")


# ===== ADMIN CHAT HISTORY =====

@app.get("/api/admin/chat-history")
async def get_all_chat_history(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get all chat history for admin panel"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        chats = await chat_history_collection.find(
            {}, 
            {"_id": 0}
        ).sort("created_at", -1).to_list(1000)
        
        # Ensure timezone info
        for chat in chats:
            if chat.get("created_at"):
                chat["created_at"] = ensure_utc_timezone(chat["created_at"]).isoformat()
        
        return chats
    except Exception as e:
        print(f"Error fetching chat history: {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar histórico de conversas")


@app.get("/api/admin/chat-history/stats")
async def get_chat_history_stats(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get chat history statistics"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        total_chats = await chat_history_collection.count_documents({})
        
        # Get unique users who used chat
        unique_users = await chat_history_collection.distinct("user_id")
        
        # Get chats from last 24 hours
        yesterday = datetime.now(timezone.utc) - timedelta(days=1)
        recent_chats = await chat_history_collection.count_documents({
            "created_at": {"$gte": yesterday}
        })
        
        return {
            "total_conversations": total_chats,
            "unique_users": len(unique_users),
            "last_24h": recent_chats
        }
    except Exception as e:
        print(f"Error fetching chat stats: {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar estatísticas")


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
    
    # Iniciar task de atualização horária de alertas epidemiológicos
    from epidemiological_alerts import start_hourly_update_task, get_cached_alerts
    asyncio.create_task(start_hourly_update_task())
    
    # Carregar alertas iniciais
    await get_cached_alerts()
    print("✅ Sistema de alertas epidemiológicos iniciado (atualização a cada 1 hora)")
    print("=" * 80)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
