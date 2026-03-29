from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any
from datetime import date
from decimal import Decimal
from uuid import UUID
from enum import Enum

from schemas.expense_schemas import ExpenseOut  # Import schema giao dịch chi tiêu
from schemas.income_schemas import IncomeOut  # Import schema giao dịch thu nhập


# =========================================================
# 📝 Request Schema (Dữ liệu gửi từ Frontend cho bộ lọc)
# =========================================================
class AnalyticsType(str, Enum):
    all = "all"
    income = "income"
    expense = "expense"

class AnalyticsMeta(BaseModel):
    start_date: Optional[date]
    end_date: Optional[date]
    type: str


class AnalyticsFilter(BaseModel):
    """Schema cho bộ lọc dữ liệu Analytics"""

    # Loại giao dịch: 'all', 'income', 'expense'
    type: AnalyticsType = AnalyticsType.all
    # Ngày bắt đầu và kết thúc (Tùy chọn)
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    # Category ID (Tùy chọn - để lọc sâu hơn)
    category_id: Optional[UUID] = None


# =========================================================
# 📊 Response Schema (Cấu trúc dữ liệu trả về)
# =========================================================

class CategorySummary(BaseModel):
    """Schema cho tổng hợp theo danh mục"""
    category_name: str
    total_amount: Decimal
    type: str  # 'income' hoặc 'expense'

    class Config:
        from_attributes = True


class AnalyticsTransactionOut(BaseModel):
    id: UUID
    amount: Decimal
    date: date
    category_name: Optional[str] = None
    type: str  # 'income' | 'expense'
    currency_code: str = "USD"
    note: Optional[str] = None
    emoji: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AnalyticsSummary(BaseModel):
    """Schema tổng hợp toàn bộ dữ liệu Analytics"""

    # Tổng hợp số dư
    total_income: Decimal
    total_expense: Decimal
    total_balance: Decimal
    average_daily_spending: Decimal = Decimal("0")
    most_expensive_day: Optional[date] = None
    average_daily_spending: Decimal  # Chi tiêu trung bình mỗi ngày
    most_expensive_day: date  # Ngày tiêu nhiều tiền nhất

    # Dữ liệu cho biểu đồ (Bar Chart & Pie Chart)
    average_daily_spending: Decimal = Decimal("0")
    most_expensive_day: Optional[date] = None
    category_distribution: List[CategorySummary]

    # Danh sách giao dịch chi tiết (IncomeOut/ExpenseOut)
    transactions: List[AnalyticsTransactionOut]  # Sử dụng Any vì list chứa cả IncomeOut và ExpenseOut

    # Thông tin người dùng
    currency_symbol: str = Field("$", description="Currency symbol of the user")

    class Config:
        from_attributes = True
        json_encoders = {Decimal: lambda v: float(v)}


class CategorySummary(BaseModel):
    category_name: str
    total_amount: Decimal
    type: str

    model_config = ConfigDict(from_attributes=True)


class AnalyticsTransactionOut(BaseModel):
    id: UUID
    amount: Decimal
    date: date
    category_name: Optional[str] = None
    type: str
    currency_code: str = "USD"
    note: Optional[str] = None
    emoji: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AnalyticsFilter(BaseModel):
    type: AnalyticsType = AnalyticsType.all
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    category_id: Optional[UUID] = None


class AnalyticsSummary(BaseModel):
    total_income: Decimal
    total_expense: Decimal
    total_balance: Decimal
    average_daily_spending: Decimal = Decimal("0")
    most_expensive_day: Optional[date] = None
    category_distribution: List[CategorySummary]
    transactions: List[AnalyticsTransactionOut]
    currency_symbol: str = Field("$", description="Currency symbol of the user")

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={Decimal: lambda v: float(v)},
    )
