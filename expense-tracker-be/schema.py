# schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from uuid import UUID

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    profile_image: Optional[str] = None
    gender: Optional[str] = None               # ✅ Thêm
    birthday: Optional[date] = None            # ✅ Thêm

class UserOut(BaseModel):
    id: UUID
    name: Optional[str]
    email: Optional[str]
    profile_image: Optional[str]
    gender: Optional[str]
    birthday: Optional[date]
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


class UserSyncPayload(BaseModel):
    email: str
    firebase_uid: str
    display_name: Optional[str] = None

class IncomeCreate(BaseModel):
    source: Optional[str]
    amount: float
    date: date
    emoji: Optional[str]

class ExpenseCreate(BaseModel):
    category: Optional[str]
    amount: float
    date: date
    emoji: Optional[str]

class IncomeOut(IncomeCreate):
    id: int
    user_id: int
    created_at: Optional[str]
    model_config = {
        "from_attributes": True
    }


class ExpenseOut(ExpenseCreate):
    id: int
    user_id: int
    created_at: Optional[str]
    model_config = {
        "from_attributes": True
    }
