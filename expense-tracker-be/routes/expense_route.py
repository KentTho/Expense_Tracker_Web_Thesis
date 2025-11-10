# routes/expense_route.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from cruds.crud_expense import (
    create_expense as crud_create_expense,
    delete_expense as crud_delete_expense,
    update_expense as crud_update_expense,
    get_expense_summary as crud_get_expense_summary,
    get_expense_daily_trend as crud_get_expense_daily_trend,
    list_expenses_for_user)
from db.database import get_db
from schemas import ExpenseOut, ExpenseCreate
from schemas.expense_schemas import ExpenseListOut, ExpenseTrendItem
from services.auth_token_db import get_current_user_db

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.post("/", response_model=ExpenseOut)
def create_expense(payload: ExpenseCreate, current_user=Depends(get_current_user_db), db: Session = Depends(get_db)):
    expense = crud_create_expense(
        db=db,
        user_id=current_user.id,
        amount=payload.amount,
        currency_code=payload.currency_code,
        date_val=payload.date,
        emoji=payload.emoji,
        category_id=payload.category_id,
        category_name=payload.category_name or None,
    )
    return expense

# ✅ CẬP NHẬT: Sử dụng response_model=ExpenseListOut
@router.get("/", response_model=ExpenseListOut)
def list_expenses(current_user=Depends(get_current_user_db), db: Session = Depends(get_db)):
    """Danh sách chi tiêu của người dùng kèm cài đặt tiền tệ."""
    # CRUD đã trả về dict có items, currency_code, currency_symbol, khớp với ExpenseListOut
    return list_expenses_for_user(db, current_user.id)
@router.put("/{expense_id}", response_model=ExpenseOut)
def update_expense(expense_id: UUID, update_data: dict, current_user=Depends(get_current_user_db), db: Session = Depends(get_db)):
    updated = crud_update_expense(db, expense_id, current_user.id, update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Expense not found")
    return updated

@router.delete("/{expense_id}")
def delete_expense(expense_id: UUID, current_user=Depends(get_current_user_db), db: Session = Depends(get_db)):
    deleted = crud_delete_expense(db, expense_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted successfully"}
# ...
@router.get("/summary", response_model=List[dict])
def get_expense_summary_route(current_user=Depends(get_current_user_db), db: Session = Depends(get_db)):
    """API lấy tổng chi tiêu theo danh mục (cho Pie Chart)."""
    # ✅ Đây là hàm bạn cần dùng
    return crud_get_expense_summary(db, current_user.id)


# 💡 ROUTE MỚI: Daily Trend (SỬA LỖI 404)
# Route đầy đủ: GET /expenses/summary/expense-trend/daily?days=N
# FE cần điều chỉnh đường dẫn gọi API để khớp với prefix /expenses/
@router.get("/summary/expense-trend/daily", response_model=List[ExpenseTrendItem])
def get_daily_trend(
    current_user=Depends(get_current_user_db),
    db: Session = Depends(get_db),
    days: int = Query(7, ge=1, description="Số ngày cần lấy dữ liệu xu hướng")
):
    """
    📊 Lấy dữ liệu tổng chi tiêu theo ngày trong N ngày qua (cho Line Chart).
    """
    trend_data = crud_get_expense_daily_trend(db, current_user.id, days=days)
    return trend_data


