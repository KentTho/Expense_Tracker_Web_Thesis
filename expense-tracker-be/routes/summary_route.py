from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from cruds.crud_expense import get_expense_summary as crud_expense_get_expense_summary
from cruds.crud_summary import get_financial_summary_from_transactions, get_expense_daily_trend # Sẽ tạo/sửa hàm này
from db.database import get_db
from schemas.summary_schemas import KpiSummaryOut, ExpenseTrendOut, ExpenseBreakdownOut
from services.auth_token_db import get_current_user_db

router = APIRouter(prefix="/summary", tags=["Summary"])

# 1. API cho KPI Cards (GET /summary/kpis)
@router.get("/kpis", response_model=KpiSummaryOut)
def get_kpis(current_user=Depends(get_current_user_db), db: Session = Depends(get_db)):
    """💰 Lấy tổng thu và tổng chi cho KPI Cards"""
    return get_financial_summary_from_transactions(db, current_user.id)
# 2. API cho Expense Daily Trend (GET /summary/expenses/trend/daily)
@router.get("/expenses/trend/daily", response_model=List[ExpenseTrendOut])
def get_daily_expense_trend(days: int = 30, current_user=Depends(get_current_user_db), db: Session = Depends(get_db)):
    """📊 Lấy tổng chi tiêu theo ngày trong N ngày qua (Bar Chart)"""
    return get_expense_daily_trend(db, current_user.id, days=days)
# 3. API cho Expense Breakdown (GET /summary/expense-breakdown)
@router.get("/expense-breakdown", response_model=List[ExpenseBreakdownOut])
def get_expense_breakdown(current_user=Depends(get_current_user_db), db: Session = Depends(get_db)):
    """🥧 Lấy tổng chi tiêu theo danh mục (Pie Chart)"""
    # Tái sử dụng hàm get_expense_summary (đã tồn tại trong crud_expense.py)
    return crud_expense_get_expense_summary(db, current_user.id)