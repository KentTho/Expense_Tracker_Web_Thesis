# schemas/admin_schemas.py (TẠO FILE MỚI)
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from .user_schemas import UserOut # Import UserOut để tái sử dụng

# --- Schemas cho User Management ---

class AdminUserListOut(BaseModel):
    """Schema trả về danh sách người dùng cho Admin"""
    id: UUID
    name: Optional[str]
    email: Optional[str]
    profile_image: Optional[str]
    created_at: datetime
    is_admin: bool
    is_2fa_enabled: bool

    class Config:
        from_attributes = True

class AdminUserUpdate(BaseModel):
    """Schema Admin dùng để cập nhật User"""
    name: Optional[str] = None
    email: Optional[str] = None
    is_admin: Optional[bool] = None

# --- Schemas cho Admin Stats ---

class AdminGlobalKPIs(BaseModel):
    """Schema cho các thẻ KPI trên Admin Dashboard"""
    total_users: int
    total_income: float
    total_expense: float
    net_balance: float
    total_2fa_users: int = 0
    new_users_24h: int = 0

class AdminUserGrowth(BaseModel):
    """Schema cho biểu đồ tăng trưởng user"""
    date: str # Định dạng 'YYYY-MM-DD'
    count: int