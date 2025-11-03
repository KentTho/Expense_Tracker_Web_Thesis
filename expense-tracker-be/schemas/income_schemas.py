from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from uuid import UUID
from .category_schemas import CategoryOut
from decimal import Decimal

class IncomeBase(BaseModel):
    """Schema cơ bản cho bảng thu nhập"""
    amount: Decimal
    date: date
    emoji: Optional[str] = None
    category_id: Optional[UUID] = None   # Liên kết Category (nếu có)


class IncomeCreate(IncomeBase):
    """Schema tạo mới thu nhập"""
    pass


class IncomeOut(IncomeBase):
    """Schema phản hồi thu nhập"""
    id: UUID
    user_id: UUID
    created_at: Optional[datetime] = None
    category: Optional[CategoryOut] = None

    class Config:
        from_attributes = True
