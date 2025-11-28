from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from uuid import UUID
from .category_schemas import CategoryOut


class TransactionBase(BaseModel):
    """Schema cơ bản cho giao dịch tổng hợp"""
    type: str                             # "income" hoặc "expense"
    amount: float
    transaction_date: date
    note: Optional[str] = None
    source_or_category: Optional[str] = None
    category_id: Optional[UUID] = None


class TransactionCreate(TransactionBase):
    """Schema tạo mới giao dịch"""
    pass


class TransactionOut(TransactionBase):
    """Schema phản hồi giao dịch"""
    id: UUID
    user_id: UUID
    created_at: datetime
    category: Optional[CategoryOut] = None

    class Config:
        from_attributes = True


class RecentTransactionOut(BaseModel):
    """Schema cho danh sách giao dịch gần đây"""
    id: UUID
    type: str
    emoji: Optional[str]
    amount: float
    transaction_date: date
    category_name: Optional[str]

class RecentTransactionOut(BaseModel):
    """Schema cho danh sách giao dịch gần đây"""
    id: UUID
    type: str
    emoji: Optional[str]
    amount: float
    transaction_date: date
    category_name: Optional[str]
    # ✅ THÊM DÒNG NÀY: Để API trả về cả ghi chú
    note: Optional[str] = None

    class Config:
        from_attributes = True