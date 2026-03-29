from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime
from uuid import UUID
from .category_schemas import CategoryOut


class TransactionBase(BaseModel):
    """Schema cơ bản cho giao dịch tổng hợp"""
    type: str                             # "income" hoặc "expense"
    amount: float
    currency_code: str = "USD"
    date: date
    note: Optional[str] = None
    category_name: Optional[str] = None
    category_id: Optional[UUID] = None
    emoji: Optional[str] = None


class TransactionCreate(TransactionBase):
    """Schema tạo mới giao dịch"""
    pass


class TransactionOut(TransactionBase):
    """Schema phản hồi giao dịch"""
    id: UUID
    user_id: UUID
    created_at: datetime
    category: Optional[CategoryOut] = None

    model_config = ConfigDict(from_attributes=True)


class RecentTransactionOut(BaseModel):
    """Schema cho danh sách giao dịch gần đây"""
    id: UUID
    type: str
    emoji: Optional[str] = None
    amount: float
    currency_code: str = "USD"
    date: date
    category_name: Optional[str] = None
    note: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TransactionBase(BaseModel):
    type: str
    amount: float
    currency_code: str = "USD"
    date: date
    note: Optional[str] = None
    category_name: Optional[str] = None
    category_id: Optional[UUID] = None
    emoji: Optional[str] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionOut(TransactionBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    category: Optional[CategoryOut] = None

    model_config = ConfigDict(from_attributes=True)


class RecentTransactionOut(BaseModel):
    id: UUID
    type: str
    emoji: Optional[str] = None
    amount: float
    currency_code: str = "USD"
    date: date
    category_name: Optional[str] = None
    note: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
