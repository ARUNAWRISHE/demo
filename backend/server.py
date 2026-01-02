from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== Models ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

class Department(BaseModel):
    model_config = ConfigDict(extra="ignore")
    department_id: str = Field(default_factory=lambda: f"dept_{uuid.uuid4().hex[:12]}")
    name: str
    code: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DepartmentCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None

class Staff(BaseModel):
    model_config = ConfigDict(extra="ignore")
    staff_id: str = Field(default_factory=lambda: f"staff_{uuid.uuid4().hex[:12]}")
    name: str
    email: str
    department_id: str
    designation: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StaffCreate(BaseModel):
    name: str
    email: str
    department_id: str
    designation: Optional[str] = None

class Subject(BaseModel):
    model_config = ConfigDict(extra="ignore")
    subject_id: str = Field(default_factory=lambda: f"subj_{uuid.uuid4().hex[:12]}")
    code: str
    name: str
    credits: int
    department_id: str
    subject_type: Optional[str] = "REGULAR"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubjectCreate(BaseModel):
    code: str
    name: str
    credits: int
    department_id: str
    subject_type: Optional[str] = "REGULAR"

class TimeSlot(BaseModel):
    model_config = ConfigDict(extra="ignore")
    slot_id: str = Field(default_factory=lambda: f"slot_{uuid.uuid4().hex[:12]}")
    start_time: str
    end_time: str
    period_number: int
    slot_type: str = "CLASS"

class TimetableEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    entry_id: str = Field(default_factory=lambda: f"entry_{uuid.uuid4().hex[:12]}")
    academic_year: str
    program: str
    year_semester: str
    section: str
    day_of_week: str
    slot_id: str
    subject_id: Optional[str] = None
    staff_id: Optional[str] = None
    classroom: Optional[str] = None
    entry_type: str = "CLASS"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TimetableEntryCreate(BaseModel):
    academic_year: str
    program: str
    year_semester: str
    section: str
    day_of_week: str
    slot_id: str
    subject_id: Optional[str] = None
    staff_id: Optional[str] = None
    classroom: Optional[str] = None
    entry_type: str = "CLASS"

# ==================== Authentication Helper ====================

async def get_current_user(request: Request) -> User:
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

# ==================== Authentication Routes ====================

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session ID")
    
    try:
        resp = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
            timeout=10
        )
        
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session ID")
        
        data = resp.json()
        session_token = data["session_token"]
        
        user_doc = await db.users.find_one({"email": data["email"]}, {"_id": 0})
        
        if user_doc:
            user_id = user_doc["user_id"]
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {
                    "name": data["name"],
                    "picture": data.get("picture")
                }}
            )
        else:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            await db.users.insert_one({
                "user_id": user_id,
                "email": data["email"],
                "name": data["name"],
                "picture": data.get("picture"),
                "created_at": datetime.now(timezone.utc)
            })
        
        await db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "created_at": datetime.now(timezone.utc)
        })
        
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7 * 24 * 60 * 60
        )
        
        return {
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data.get("picture")
        }
    
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Authentication service error: {str(e)}")

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ==================== Department Routes ====================

@api_router.post("/departments", response_model=Department)
async def create_department(dept: DepartmentCreate, current_user: User = Depends(get_current_user)):
    dept_obj = Department(**dept.model_dump())
    doc = dept_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.departments.insert_one(doc)
    return dept_obj

@api_router.get("/departments", response_model=List[Department])
async def get_departments(current_user: User = Depends(get_current_user)):
    departments = await db.departments.find({}, {"_id": 0}).to_list(1000)
    for dept in departments:
        if isinstance(dept['created_at'], str):
            dept['created_at'] = datetime.fromisoformat(dept['created_at'])
    return departments

@api_router.delete("/departments/{department_id}")
async def delete_department(department_id: str, current_user: User = Depends(get_current_user)):
    result = await db.departments.delete_one({"department_id": department_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Department not found")
    return {"message": "Department deleted successfully"}

# ==================== Staff Routes ====================

@api_router.post("/staff", response_model=Staff)
async def create_staff(staff: StaffCreate, current_user: User = Depends(get_current_user)):
    staff_obj = Staff(**staff.model_dump())
    doc = staff_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.staff.insert_one(doc)
    return staff_obj

@api_router.get("/staff", response_model=List[Staff])
async def get_staff(department_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {"department_id": department_id} if department_id else {}
    staff_list = await db.staff.find(query, {"_id": 0}).to_list(1000)
    for staff in staff_list:
        if isinstance(staff['created_at'], str):
            staff['created_at'] = datetime.fromisoformat(staff['created_at'])
    return staff_list

@api_router.delete("/staff/{staff_id}")
async def delete_staff(staff_id: str, current_user: User = Depends(get_current_user)):
    result = await db.staff.delete_one({"staff_id": staff_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Staff not found")
    return {"message": "Staff deleted successfully"}

# ==================== Subject Routes ====================

@api_router.post("/subjects", response_model=Subject)
async def create_subject(subject: SubjectCreate, current_user: User = Depends(get_current_user)):
    subject_obj = Subject(**subject.model_dump())
    doc = subject_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.subjects.insert_one(doc)
    return subject_obj

@api_router.get("/subjects", response_model=List[Subject])
async def get_subjects(department_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {"department_id": department_id} if department_id else {}
    subjects = await db.subjects.find(query, {"_id": 0}).to_list(1000)
    for subj in subjects:
        if isinstance(subj['created_at'], str):
            subj['created_at'] = datetime.fromisoformat(subj['created_at'])
    return subjects

@api_router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: str, current_user: User = Depends(get_current_user)):
    result = await db.subjects.delete_one({"subject_id": subject_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subject not found")
    return {"message": "Subject deleted successfully"}

# ==================== Time Slots Routes ====================

@api_router.get("/time-slots", response_model=List[TimeSlot])
async def get_time_slots(current_user: User = Depends(get_current_user)):
    slots = await db.time_slots.find({}, {"_id": 0}).to_list(100)
    
    if not slots:
        default_slots = [
            {"slot_id": f"slot_{uuid.uuid4().hex[:12]}", "start_time": "09:00", "end_time": "10:00", "period_number": 1, "slot_type": "CLASS"},
            {"slot_id": f"slot_{uuid.uuid4().hex[:12]}", "start_time": "10:00", "end_time": "11:00", "period_number": 2, "slot_type": "CLASS"},
            {"slot_id": f"slot_{uuid.uuid4().hex[:12]}", "start_time": "11:00", "end_time": "11:30", "period_number": 0, "slot_type": "BREAK"},
            {"slot_id": f"slot_{uuid.uuid4().hex[:12]}", "start_time": "11:30", "end_time": "12:30", "period_number": 3, "slot_type": "CLASS"},
            {"slot_id": f"slot_{uuid.uuid4().hex[:12]}", "start_time": "12:30", "end_time": "13:30", "period_number": 4, "slot_type": "CLASS"},
            {"slot_id": f"slot_{uuid.uuid4().hex[:12]}", "start_time": "13:30", "end_time": "14:30", "period_number": 0, "slot_type": "LUNCH"},
            {"slot_id": f"slot_{uuid.uuid4().hex[:12]}", "start_time": "14:30", "end_time": "15:30", "period_number": 5, "slot_type": "CLASS"},
            {"slot_id": f"slot_{uuid.uuid4().hex[:12]}", "start_time": "15:30", "end_time": "16:30", "period_number": 6, "slot_type": "CLASS"},
        ]
        await db.time_slots.insert_many(default_slots)
        return [TimeSlot(**slot) for slot in default_slots]
    
    return slots

# ==================== Timetable Routes ====================

@api_router.post("/timetable", response_model=TimetableEntry)
async def create_timetable_entry(entry: TimetableEntryCreate, current_user: User = Depends(get_current_user)):
    entry_obj = TimetableEntry(**entry.model_dump())
    doc = entry_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.timetable.insert_one(doc)
    return entry_obj

@api_router.get("/timetable", response_model=List[TimetableEntry])
async def get_timetable(
    academic_year: Optional[str] = None,
    program: Optional[str] = None,
    year_semester: Optional[str] = None,
    section: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if academic_year:
        query["academic_year"] = academic_year
    if program:
        query["program"] = program
    if year_semester:
        query["year_semester"] = year_semester
    if section:
        query["section"] = section
    
    entries = await db.timetable.find(query, {"_id": 0}).to_list(1000)
    for entry in entries:
        if isinstance(entry['created_at'], str):
            entry['created_at'] = datetime.fromisoformat(entry['created_at'])
    return entries

@api_router.delete("/timetable/{entry_id}")
async def delete_timetable_entry(entry_id: str, current_user: User = Depends(get_current_user)):
    result = await db.timetable.delete_one({"entry_id": entry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    return {"message": "Timetable entry deleted successfully"}

@api_router.get("/staff/{staff_id}/schedule")
async def get_staff_schedule(staff_id: str, current_user: User = Depends(get_current_user)):
    entries = await db.timetable.find({"staff_id": staff_id}, {"_id": 0}).to_list(1000)
    for entry in entries:
        if isinstance(entry['created_at'], str):
            entry['created_at'] = datetime.fromisoformat(entry['created_at'])
    return entries

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()