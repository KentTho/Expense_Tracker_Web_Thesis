from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID
from .category_schemas import CategoryOut
from decimal import Decimal


class IncomeBase(BaseModel):
    """Schema cơ bản cho bảng thu nhập"""
    # ✅ TRƯỜNG BỊ THIẾU: BẮT BUỘC PHẢI THÊM VÀO ĐÂY
    category_name: Optional[str] = None

    amount: Decimal
    date: date
    emoji: Optional[str] = None
    category_id: Optional[UUID] = None  # Liên kết Category (nếu có)


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

# ✅ THÊM: Schema mới cho API list
class IncomeListOut(BaseModel):
    """Schema phản hồi cho danh sách thu nhập kèm cài đặt tiền tệ."""
    items: List[IncomeOut]
    currency_code: str
    currency_symbol: str

    class Config:
        from_attributes = True