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
    is_positive: bool  # True nếu balance > 0, dùng để FE đổi màu xanh/đỏ nhanh chóng

    currency: str = "VND"

class ChartPoint(BaseModel):
    date: date
    total: float

class DashboardResponse(BaseModel):
    summary: SummaryStats
    recent_transactions: List[RecentTransactionOut]
    income_chart: List[ChartPoint]
    expense_chart: List[ChartPoint]

class TrendMeta(BaseModel):
    direction: str   # "up" | "down" | "flat"
    percent: float

class ChartSeries(BaseModel):
    label: str
    points: List[ChartPoint]

class ForecastStats(BaseModel):
    estimated_remaining: float # Dự kiến số dư còn lại cuối tháng dựa trên thói quen chi tiêu

class GoalProgress(BaseModel):
    goal_name: str
    target_amount: float
    current_amount: float
    percentage: float
