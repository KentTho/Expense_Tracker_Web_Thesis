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


# income_schemas.py (Phần cuối)
# ... (Đảm bảo đã import Decimal)

class IncomeSummaryOut(BaseModel):
    """Schema cho Tổng quan Thu nhập theo danh mục (Bar Chart)"""
    category_name: str
    total_amount: Decimal # Tổng tiền của danh mục

    class Config:
        from_attributes = True
        # FastAPI/Pydantic cần chuyển Decimal thành float/str khi serialize JSON
        json_encoders = {
            Decimal: lambda v: str(v),
        }