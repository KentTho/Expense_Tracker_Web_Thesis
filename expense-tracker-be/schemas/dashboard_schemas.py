from pydantic import BaseModel
from typing import List
from datetime import date
from .transaction_schemas import RecentTransactionOut


class SummaryOut(BaseModel):
    """Schema phản hồi tổng thu – chi"""
    total_income: float
    total_expense: float
    balance: float


class CategorySummaryOut(BaseModel):
    """Schema thống kê thu/chi theo danh mục"""
    category: str
    total: float


class SummaryStats(BaseModel):
    total_income: float
    total_expense: float
    total_balance: float


class ChartPoint(BaseModel):
    date: date
    total: float


class DashboardResponse(BaseModel):
    summary: SummaryStats
    recent_transactions: List[RecentTransactionOut]
    income_chart: List[ChartPoint]
    expense_chart: List[ChartPoint]
