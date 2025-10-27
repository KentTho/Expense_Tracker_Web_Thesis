from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from uuid import UUID


class UserUpdate(BaseModel):
    """Schema cập nhật thông tin người dùng"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    profile_image: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None


class UserOut(BaseModel):
    """Schema phản hồi thông tin người dùng"""
    id: UUID
    name: Optional[str]
    email: Optional[str]
    profile_image: Optional[str]
    gender: Optional[str]
    birthday: Optional[date]
    created_at: datetime

    class Config:
        from_attributes = True


class UserSyncPayload(BaseModel):
    """Schema đồng bộ thông tin từ Firebase"""
    email: str
    firebase_uid: str
    display_name: Optional[str] = None
