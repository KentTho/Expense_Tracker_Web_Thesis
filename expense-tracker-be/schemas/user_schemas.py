from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from uuid import UUID
from decimal import Decimal # ✅ Import Decimal

class UserUpdate(BaseModel):
    """Schema cập nhật thông tin người dùng"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    profile_image: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None
    currency_code: Optional[str] = None
    currency_symbol: Optional[str] = None
    monthly_budget: Optional[Decimal] = None
    has_onboard: Optional[bool] = None
    restrict_multi_device: Optional[bool] = None

class UserOut(BaseModel):
    """Schema phản hồi thông tin người dùng"""
    id: UUID
    name: Optional[str]
    email: Optional[str]
    profile_image: Optional[str]
    gender: Optional[str]
    birthday: Optional[date]
    created_at: datetime
    firebase_uid: Optional[str] = None
    is_2fa_enabled: bool = False
    restrict_multi_device: bool = False
    is_admin: bool = False
    currency_code: str = "USD"
    currency_symbol: str = "$"
    monthly_budget: Optional[Decimal] = None
    has_onboard: Optional[bool] = None

    class Config:
        from_attributes = True


class UserSyncPayload(BaseModel):
    """Schema đồng bộ thông tin từ Firebase"""
    email: str
    firebase_uid: str
    display_name: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut