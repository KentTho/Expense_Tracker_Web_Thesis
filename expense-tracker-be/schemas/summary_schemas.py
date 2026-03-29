# schemas/summary_schemas.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from decimal import Decimal
from uuid import UUID


# =====================================================
# 1. Schema cho API /summary/kpis
# =====================================================
class KPISummaryResponse(BaseModel):
    total_income: Decimal
    total_expense: Decimal

    # SỬA 2 DÒNG DƯỚI ĐÂY:
    income_growth: Optional[float] = 0.0  # Hoặc = None
    expense_growth: Optional[float] = 0.0  # Hoặc = None


class KpiSummaryOut(BaseModel):
    """Schema cho Tổng quan KPI (Tổng thu, Tổng chi)"""
    total_income: Decimal
    total_expense: Decimal
    income_growth: Optional[float] = 0.0  # Thêm Optional + default
    expense_growth: Optional[float] = 0.0  # Thêm Optional + default

    class Config:
        # Cho phép Decimal được truyền từ SQLAlchemy Row
        from_attributes = True
        # FastAPI/Pydantic cần chuyển Decimal thành float/str khi serialize JSON
        json_encoders = {
            Decimal: lambda v: str(v),
        }



# =====================================================
# 2. Schema cho API /summary/expenses/trend/daily
# =====================================================
class ExpenseTrendOut(BaseModel):
    """Schema cho Xu hướng Chi tiêu theo ngày (Bar Chart)"""
    date: date  # Tên field phải là 'date' (đã chuẩn hóa trong crud)
    total_amount: Decimal  # Tên field phải là 'total_amount' (đã chuẩn hóa trong crud)

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: str(v),
        }

class IncomeTrendOut(BaseModel):
    """Schema cho Xu hướng Chi tiêu theo ngày (Bar Chart)"""
    date: date  # Tên field phải là 'date' (đã chuẩn hóa trong crud)
    total_amount: Decimal  # Tên field phải là 'total_amount' (đã chuẩn hóa trong crud)

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: str(v),
        }

# =====================================================
# 3. Schema cho API /summary/expense-breakdown
# (Frontend sử dụng cấu trúc tương tự Expense Summary)
# =====================================================
class ExpenseBreakdownOut(BaseModel):
    """Schema cho Phân tích chi tiêu theo danh mục (Pie Chart)"""
    category_name: str
    total_amount: Decimal
    percentage: Optional[float] = None

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: str(v),
        }

class IncomeBreakdownOut(BaseModel):
    """Schema cho Phân tích chi tiêu theo danh mục (Pie Chart)"""
    category_name: str
    total_amount: Decimal
    percentage: Optional[float] = None

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: str(v),
        }

class AmountTrendOut(BaseModel):
    date: date
    total_amount: Decimal


class AdvancedKpiSummaryOut(KpiSummaryOut):
    balance: Decimal
    saving_rate: Optional[Decimal]
