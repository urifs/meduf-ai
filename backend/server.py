import os
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
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

class UserCreate(UserBase):
    password: str
    crm: Optional[str] = None
    days_valid: int = 30

class UserInDB(UserBase):
    id: str = Field(alias="_id")
    role: str = "USER"
    status: str = "Ativo"
    created_at: Optional[datetime] = None
    expiration_date: Optional[datetime] = None

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
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await users_collection.find_one({"email": email})
    if user is None:
        raise credentials_exception
    
    # Convert ObjectId to string for the model
    user["_id"] = str(user["_id"])
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

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"], "role": user.get("role", "USER")}, expires_delta=access_token_expires
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
    cursor = users_collection.find({}).sort("created_at", -1)
    async for document in cursor:
        document["_id"] = str(document["_id"])
        users.append(UserInDB(**document))
    return users

@app.post("/api/admin/users", response_model=dict)
async def create_user_admin(user: UserCreate, admin: UserInDB = Depends(get_admin_user)):
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    
    # Set expiration date (30 days from now)
    created_at = datetime.utcnow()
    expiration_date = created_at + timedelta(days=30)

    user_dict = {
        "email": user.email,
        "name": user.name,
        "password_hash": hashed_password,
        "role": "USER",
        "status": "Ativo",
        "created_at": created_at,
        "expiration_date": expiration_date
    }
    
    result = await users_collection.insert_one(user_dict)
    return {"id": str(result.inserted_id), "message": "User created successfully"}

@app.patch("/api/admin/users/{id}/status")
async def toggle_user_status(id: str, admin: UserInDB = Depends(get_admin_user)):
    user = await users_collection.find_one({"_id": ObjectId(id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_status = "Bloqueado" if user.get("status") == "Ativo" else "Ativo"
    await users_collection.update_one({"_id": ObjectId(id)}, {"$set": {"status": new_status}})
    return {"status": new_status}

@app.delete("/api/admin/users/{id}")
async def delete_user(id: str, admin: UserInDB = Depends(get_admin_user)):
    # Delete user
    result = await users_collection.delete_one({"_id": ObjectId(id)})
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
    cursor = consultations_collection.find({}).sort("created_at", -1).limit(50)
    
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
