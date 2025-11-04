from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date
from decimal import Decimal
from uuid import UUID
from schemas.expense_schemas import ExpenseOut  # Import schema giao dịch chi tiêu
from schemas.income_schemas import IncomeOut  # Import schema giao dịch thu nhập


# =========================================================
# 📝 Request Schema (Dữ liệu gửi từ Frontend cho bộ lọc)
# =========================================================
class AnalyticsFilter(BaseModel):
    """Schema cho bộ lọc dữ liệu Analytics"""

    # Loại giao dịch: 'all', 'income', 'expense'
    type: str = Field('all', description="Transaction type: 'all', 'income', or 'expense'")

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


class AnalyticsSummary(BaseModel):
    """Schema tổng hợp toàn bộ dữ liệu Analytics"""

    # Tổng hợp số dư
    total_income: Decimal
    total_expense: Decimal
    total_balance: Decimal

    # Dữ liệu cho biểu đồ (Bar Chart & Pie Chart)
    category_distribution: List[CategorySummary]

    # Danh sách giao dịch chi tiết (IncomeOut/ExpenseOut)
    transactions: List[Any]  # Sử dụng Any vì list chứa cả IncomeOut và ExpenseOut

    # Thông tin người dùng
    currency_symbol: str = Field("$", description="Currency symbol of the user")

    class Config:
        from_attributes = True
        json_encoders = {
            # Giữ nguyên config đã có nếu cần
        }