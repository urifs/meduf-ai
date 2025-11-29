import os
import asyncio
import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import shutil
from pathlib import Path
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from bson import ObjectId

# --- Configuration ---
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
SECRET_KEY = os.environ.get("SECRET_KEY", "supersecretkey123") # In prod, use a real secret
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours
ADMIN_USER = os.environ.get("ADMIN_USER", "ur1fs")
ADMIN_PASS = os.environ.get("ADMIN_PASS", "@Fred1807")

# --- Database Setup ---
client = AsyncIOMotorClient(MONGO_URL)
db_name = os.environ.get("DB_NAME", "meduf_ai")
db = client[db_name]
users_collection = db.users
consultations_collection = db.consultations

# --- Security ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# --- Models ---
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class UserBase(BaseModel):
    email: str
    name: str
    avatar_url: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str
    crm: Optional[str] = None
    days_valid: int = 30
    role: str = "USER"

class UserInDB(UserBase):
    id: str = Field(alias="_id")
    role: str = "USER"
    status: str = "Ativo"
    created_at: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    session_id: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class Token(BaseModel):
    access_token: str
    token_type: str
    user_name: str
    user_role: str
    expiration_date: Optional[datetime] = None

class ConsultationCreate(BaseModel):
    patient: dict
    report: dict

class ConsultationInDB(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    patient: dict
    report: dict
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# --- Helper Functions ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_session_id: str = payload.get("session_id")
        
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await users_collection.find_one({"email": email})
    if user is None:
        raise credentials_exception
        
    # Single Session Enforcement
    # If the user has a session_id in DB, it MUST match the token's session_id
    # We allow token_session_id to be None for backward compatibility with old tokens during migration,
    # BUT for strict enforcement, we should require it. 
    # Let's enforce: if DB has session_id, token must match.
    if user.get("session_id") and user.get("session_id") != token_session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessão expirada. Você conectou em outro dispositivo.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Convert ObjectId to string for the model
    user["_id"] = str(user["_id"])
    
    # Track active user (update timestamp)
    active_user_sessions[user["_id"]] = datetime.utcnow()
    
    return UserInDB(**user)

async def get_current_active_user(current_user: UserInDB = Depends(get_current_user)):
    if current_user.status == "Bloqueado":
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_admin_user(current_user: UserInDB = Depends(get_current_active_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

# --- Background Tasks ---
async def remove_expired_users():
    """Background task to remove users whose expiration date has passed."""
    while True:
        try:
            now = datetime.utcnow()
            # Find users where expiration_date exists and is less than now
            result = await users_collection.delete_many({
                "expiration_date": {"$lt": now},
                "role": {"$ne": "ADMIN"} # Never delete admins automatically
            })
            if result.deleted_count > 0:
                print(f"Cleaned up {result.deleted_count} expired user accounts.")
        except Exception as e:
            print(f"Error in cleanup task: {e}")
        
        # Run every hour
        await asyncio.sleep(3600)

# --- App Setup ---
app = FastAPI()

# Mount static files
static_path = Path(__file__).parent / "static"
app.mount("/api/static", StaticFiles(directory=static_path), name="static")

# --- Active Users Tracking ---
active_users = set()

@app.middleware("http")
async def track_active_users(request, call_next):
    # Simple tracking: count unique IPs or tokens in the last X minutes?
    # For real-time "online", websockets are best, but for HTTP, we can track "active in last 5 mins".
    # We'll use a global set and a background task to clear it, or just a timestamp dict.
    # Let's use a dict: {user_id: timestamp}
    
    response = await call_next(request)
    return response

# We need a way to identify the user in middleware or just update "last_seen" in DB on every request.
# Updating DB on every request is heavy.
# Let's use an in-memory dict for this prototype feature.
active_user_sessions = {}

@app.get("/api/admin/stats/online")
async def get_online_users_count(admin: UserInDB = Depends(get_admin_user)):
    # Count users active in last 5 minutes
    now = datetime.utcnow()
    threshold = now - timedelta(minutes=5)
    
    # Clean up old sessions
    expired_users = [uid for uid, timestamp in active_user_sessions.items() if timestamp < threshold]
    for uid in expired_users:
        del active_user_sessions[uid]
        
    return {"online_count": len(active_user_sessions)}

# We need to inject this tracking into the dependency or a middleware that parses the token.
# Since we already have `get_current_user`, let's update the timestamp there.
# But `get_current_user` is a dependency.
# We can modify `get_current_user` to update the global dict.

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(remove_expired_users())

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routes ---

@app.get("/api/")
async def root():
    return {"message": "Meduf AI API is running"}

# Auth Routes
# NOTE: Public registration is DISABLED. Only Admins can create users via /api/admin/users
# @app.post("/api/auth/register", response_model=Token)
# async def register(user: UserCreate):
#     ... (Disabled)

@app.post("/api/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    email_query = form_data.username
    
    # Admin fallback creation
    if form_data.username == ADMIN_USER and form_data.password == ADMIN_PASS:
        admin_user = await users_collection.find_one({"email": ADMIN_USER})
        if not admin_user:
            hashed = get_password_hash(ADMIN_PASS)
            await users_collection.insert_one({
                "email": ADMIN_USER,
                "name": "Administrador",
                "password_hash": hashed,
                "role": "ADMIN",
                "status": "Ativo",
                "created_at": datetime.utcnow(),
                "expiration_date": datetime.utcnow() + timedelta(days=3650) # 10 years for admin
            })
        email_query = ADMIN_USER

    user = await users_collection.find_one({"email": email_query})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check Expiration
    if user.get("expiration_date") and user["expiration_date"] < datetime.utcnow():
        # Delete expired user immediately if they try to login
        await users_collection.delete_one({"_id": user["_id"]})
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sua conta expirou após 30 dias. Por favor, crie uma nova conta."
        )

    if user.get("status") == "Bloqueado":
         raise HTTPException(status_code=400, detail="User account is blocked")

    # Generate and update Session ID (Single Session Enforcement)
    session_id = str(uuid.uuid4())
    await users_collection.update_one({"_id": user["_id"]}, {"$set": {"session_id": session_id}})

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"], "role": user.get("role", "USER"), "session_id": session_id}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user_name": user["name"], 
        "user_role": user.get("role", "USER"),
        "expiration_date": user.get("expiration_date")
    }

# Consultation Routes
@app.post("/api/consultations", response_model=dict)
async def create_consultation(consultation: ConsultationCreate, current_user: UserInDB = Depends(get_current_active_user)):
    consultation_dict = consultation.dict()
    consultation_dict["user_id"] = current_user.id
    consultation_dict["created_at"] = datetime.utcnow()
    
    result = await consultations_collection.insert_one(consultation_dict)
    return {"id": str(result.inserted_id), "message": "Consultation saved"}

@app.get("/api/consultations", response_model=List[ConsultationInDB])
async def get_consultations(current_user: UserInDB = Depends(get_current_active_user)):
    consultations = []
    cursor = consultations_collection.find({"user_id": current_user.id}).sort("created_at", -1)
    async for document in cursor:
        document["_id"] = str(document["_id"])
        consultations.append(ConsultationInDB(**document))
    return consultations

@app.patch("/api/users/me", response_model=UserInDB)
async def update_user_me(user_update: UserUpdate, current_user: UserInDB = Depends(get_current_active_user)):
    update_data = user_update.dict(exclude_unset=True)
    if update_data:
        await users_collection.update_one({"_id": ObjectId(current_user.id)}, {"$set": update_data})
        # Fetch updated user
        updated_user = await users_collection.find_one({"_id": ObjectId(current_user.id)})
        updated_user["_id"] = str(updated_user["_id"])
        return UserInDB(**updated_user)
    return current_user

@app.post("/api/users/me/avatar")
async def upload_avatar(file: UploadFile = File(...), current_user: UserInDB = Depends(get_current_active_user)):
    try:
        # Create uploads directory if it doesn't exist
        upload_dir = static_path / "uploads"
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate filename (user_id + extension)
        file_extension = file.filename.split(".")[-1] if "." in file.filename else "png"
        filename = f"{current_user.id}.{file_extension}"
        file_path = upload_dir / filename
        
        # Save file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Construct URL (assuming app is served at root, but we need the full URL or relative)
        # Since frontend and backend might be on different ports in dev, but same domain in prod via nginx
        # We will return a relative path that the frontend can prepend with backend URL if needed
        # Or better, return the full path if we knew the host. 
        # Let's return a relative path "/static/uploads/..." and let frontend handle it.
        # Note: In the Nginx config (if any), /static needs to be routed to backend.
        # But wait, the frontend connects to /api. 
        # I mounted /static at root level of FastAPI app. So it is accessible at http://backend:8001/static
        
        avatar_url = f"/static/uploads/{filename}"
        
        # Update user in DB
        await users_collection.update_one(
            {"_id": ObjectId(current_user.id)}, 
            {"$set": {"avatar_url": avatar_url}}
        )
        
        return {"avatar_url": avatar_url}
        
    except Exception as e:
        print(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail="Could not upload file")

@app.delete("/api/consultations/{id}")
async def delete_consultation(id: str, current_user: UserInDB = Depends(get_current_active_user)):
    result = await consultations_collection.delete_one({"_id": ObjectId(id), "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return {"message": "Consultation deleted"}

# Admin Routes
@app.get("/api/admin/users", response_model=List[UserInDB])
async def get_all_users(admin: UserInDB = Depends(get_admin_user)):
    users = []
    # Removed limit to show all users
    cursor = users_collection.find({}).sort("created_at", -1)
    async for document in cursor:
        document["_id"] = str(document["_id"])
        try:
            users.append(UserInDB(**document))
        except Exception as e:
            print(f"Skipping invalid user document {document.get('_id')}: {e}")
    return users

@app.post("/api/admin/users", response_model=dict)
async def create_user_admin(user: UserCreate, admin: UserInDB = Depends(get_admin_user)):
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    
    # Set expiration date (custom days from now)
    created_at = datetime.utcnow()
    expiration_date = created_at + timedelta(days=user.days_valid)
    
    # Generate Session ID
    session_id = str(uuid.uuid4())

    user_dict = {
        "email": user.email,
        "name": user.name,
        "password_hash": hashed_password,
        "role": user.role,
        "status": "Ativo",
        "created_at": created_at,
        "expiration_date": expiration_date,
        "session_id": session_id
    }
    
    result = await users_collection.insert_one(user_dict)
    return {"id": str(result.inserted_id), "message": "User created successfully"}

from bson import ObjectId
from bson.errors import InvalidId

# ... (rest of imports)

# ...

class AdminUserUpdate(BaseModel):
    days_valid: Optional[int] = None
    role: Optional[str] = None

@app.patch("/api/admin/users/{id}")
async def update_user_admin(id: str, update: AdminUserUpdate, admin: UserInDB = Depends(get_admin_user)):
    try:
        oid = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid user ID")
        
    user = await users_collection.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = {}
    
    if update.days_valid is not None:
        # Reset expiration to X days from NOW
        update_data["expiration_date"] = datetime.utcnow() + timedelta(days=update.days_valid)
        
    if update.role is not None:
        update_data["role"] = update.role
        
    if update_data:
        await users_collection.update_one({"_id": oid}, {"$set": update_data})
        
    return {"message": "User updated successfully"}

class AdminUserUpdate(BaseModel):
    days_valid: Optional[int] = None
    role: Optional[str] = None

@app.patch("/api/admin/users/{id}")
async def update_user_admin(id: str, update: AdminUserUpdate, admin: UserInDB = Depends(get_admin_user)):
    try:
        oid = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid user ID")
        
    user = await users_collection.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = {}
    
    if update.days_valid is not None:
        # Reset expiration to X days from NOW
        update_data["expiration_date"] = datetime.utcnow() + timedelta(days=update.days_valid)
        
    if update.role is not None:
        update_data["role"] = update.role
        
    if update_data:
        await users_collection.update_one({"_id": oid}, {"$set": update_data})
        
    return {"message": "User updated successfully"}

@app.patch("/api/admin/users/{id}/status")
async def toggle_user_status(id: str, admin: UserInDB = Depends(get_admin_user)):
    try:
        oid = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    user = await users_collection.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_status = "Bloqueado" if user.get("status") == "Ativo" else "Ativo"
    await users_collection.update_one({"_id": oid}, {"$set": {"status": new_status}})
    return {"status": new_status}

@app.delete("/api/admin/users/{id}")
async def delete_user(id: str, admin: UserInDB = Depends(get_admin_user)):
    try:
        oid = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    # Delete user
    result = await users_collection.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete user's consultations
    await consultations_collection.delete_many({"user_id": id})
    
    return {"message": "User and associated data deleted"}

@app.get("/api/admin/consultations")
async def get_all_consultations(admin: UserInDB = Depends(get_admin_user)):
    # This is a simplified view for the admin dashboard
    consultations = []
    # Join with users to get doctor name would be better, but for now we'll fetch recent ones
    # User requested NO LIMIT on counters, so we remove the limit.
    cursor = consultations_collection.find({}).sort("created_at", -1)
    
    async for doc in cursor:
        # Fetch doctor name
        user = await users_collection.find_one({"_id": ObjectId(doc["user_id"])})
        doctor_name = user["name"] if user else "Unknown"
        
        consultations.append({
            "id": str(doc["_id"]),
            "doctor": doctor_name,
            "patient": doc['patient'],
            "report": doc['report'],
            "created_at": doc['created_at']
        })
    
    return consultations

# --- Generic Database Manager Routes (Admin Only) ---

@app.get("/api/admin/db/collections")
async def list_collections(admin: UserInDB = Depends(get_admin_user)):
    return await db.list_collection_names()

@app.delete("/api/admin/db/collections/{collection_name}")
async def drop_collection(collection_name: str, admin: UserInDB = Depends(get_admin_user)):
    if collection_name not in await db.list_collection_names():
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Prevent deleting critical collections if necessary, but for a DB manager, maybe allow it with caution.
    # Let's protect 'users' just in case, or leave it open as requested "qualquer informação".
    # User asked for "qualquer informação", so I will allow it.
    
    await db[collection_name].drop()
    return {"message": f"Collection {collection_name} dropped"}

@app.get("/api/admin/db/{collection_name}")
async def list_documents(collection_name: str, limit: int = 50, skip: int = 0, q: Optional[str] = None, admin: UserInDB = Depends(get_admin_user)):
    if collection_name not in await db.list_collection_names():
        raise HTTPException(status_code=404, detail="Collection not found")
    
    collection = db[collection_name]
    query = {}
    if q:
        # 1. Try to parse as direct JSON query
        try:
            import json
            query = json.loads(q)
        except:
            # 2. Construct a text/regex search
            search_conditions = []
            
            # ID Match
            if ObjectId.is_valid(q):
                search_conditions.append({"_id": ObjectId(q)})
            
            # Regex match on common fields
            regex = {"$regex": q, "$options": "i"}
            fields_to_search = ["name", "email", "role", "status", "patient.queixa", "patient.sexo", "doctor"]
            
            for field in fields_to_search:
                search_conditions.append({field: regex})
                
            query = {"$or": search_conditions}

    cursor = collection.find(query).skip(skip).limit(limit).sort("_id", -1)
    documents = []
    async for doc in cursor:
        # Convert ObjectId and datetime to string/isoformat for JSON serialization
        doc["_id"] = str(doc["_id"])
        for k, v in doc.items():
            if isinstance(v, datetime):
                doc[k] = v.isoformat()
        documents.append(doc)
    return documents

@app.post("/api/admin/db/{collection_name}")
async def create_document(collection_name: str, document: dict, admin: UserInDB = Depends(get_admin_user)):
    if collection_name not in await db.list_collection_names():
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Remove _id if present to let MongoDB generate it
    if "_id" in document:
        del document["_id"]
        
    # Convert ISO strings back to datetime if needed? 
    # For a raw editor, we might just store strings or try to parse standard fields.
    # Let's keep it simple: store as received (mostly strings/ints/dicts).
    
    result = await db[collection_name].insert_one(document)
    return {"id": str(result.inserted_id), "message": "Document created"}

@app.put("/api/admin/db/{collection_name}/{id}")
async def update_document(collection_name: str, id: str, document: dict, admin: UserInDB = Depends(get_admin_user)):
    if collection_name not in await db.list_collection_names():
        raise HTTPException(status_code=404, detail="Collection not found")
    
    try:
        oid = ObjectId(id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")
        
    if "_id" in document:
        del document["_id"]
        
    result = await db[collection_name].replace_one({"_id": oid}, document)
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
        
    return {"message": "Document updated"}

@app.delete("/api/admin/db/{collection_name}/{id}")
async def delete_document(collection_name: str, id: str, admin: UserInDB = Depends(get_admin_user)):
    if collection_name not in await db.list_collection_names():
        raise HTTPException(status_code=404, detail="Collection not found")
        
    try:
        oid = ObjectId(id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")
        
    result = await db[collection_name].delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
        
    return {"message": "Document deleted"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
