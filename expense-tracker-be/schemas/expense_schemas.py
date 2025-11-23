from decimal import Decimal

from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID
from .category_schemas import CategoryOut


class ExpenseBase(BaseModel):
    """Schema cơ bản cho bảng chi tiêu"""
    category_name: Optional[str] = None
    amount: Decimal
    currency_code: str = "USD"  # 💡 Bổ sung
    date: date
    emoji: Optional[str] = None
    note: Optional[str] = None
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


# ✅ THÊM: Schema mới cho API list
class ExpenseListOut(BaseModel):
    """Schema phản hồi cho danh sách chi tiêu kèm cài đặt tiền tệ."""
    items: List[ExpenseOut]
    currency_code: str
    currency_symbol: str

    class Config:
        from_attributes = True


# 💡 THÊM: Schema cho Daily Trend (Xu hướng theo ngày)
class ExpenseTrendItem(BaseModel):
    """Schema cho một mục dữ liệu xu hướng chi tiêu theo ngày."""
    # crud_expense.py trả về trường 'date' (là date.date) và 'total_amount' (là float)
    date: date
    total_amount: float # Đã được chuyển từ Decimal sang float trong CRUD

    class Config:
        from_attributes = True
        # Allow population by field name (e.g., 'total_amount')