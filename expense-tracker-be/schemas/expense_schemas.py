from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from uuid import UUID
from .category_schemas import CategoryOut


class ExpenseBase(BaseModel):
    """Schema cơ bản cho bảng chi tiêu"""
    category_name: Optional[str] = None
    amount: float
    date: date
    emoji: Optional[str] = None
    category_id: Optional[UUID] = None   # Liên kết Category (nếu có)


class ExpenseCreate(ExpenseBase):
    """Schema tạo mới chi tiêu"""
    pass


class ExpenseOut(ExpenseBase):
    """Schema phản hồi chi tiêu"""
    id: UUID
    user_id: UUID
    created_at: Optional[datetime] = None
    category: Optional[CategoryOut] = None

    class Config:
        from_attributes = True
