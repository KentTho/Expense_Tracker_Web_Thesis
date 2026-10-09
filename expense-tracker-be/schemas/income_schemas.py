from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID
from .category_schemas import CategoryOut
from decimal import Decimal


class IncomeBase(BaseModel):
    """Schema cơ bản cho bảng thu nhập"""
    category_name: Optional[str] = None
    amount: Decimal = Field(..., gt=0)
    currency_code: str = "USD"  # 💡 Bổ sung
    date: date
    emoji: Optional[str] = None
    note: Optional[str] = None
    category_id: Optional[UUID] = None  # Liên kết Category (nếu có)

    @field_validator("category_id", mode="before")
    @classmethod
    def empty_category_id_to_none(cls, v):
        if v == "" or v is None:
            return None
        return v

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
    category_name: Optional[str] = "Other"
    total_amount: Decimal = Decimal("0")

    class Config:
        from_attributes = True
        # FastAPI/Pydantic cần chuyển Decimal thành float/str khi serialize JSON
        json_encoders = {
            Decimal: lambda v: str(v),
        }

