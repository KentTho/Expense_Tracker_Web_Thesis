from datetime import date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from cruds.crud_income import list_incomes_for_user_filtered, create_income as crud_create_income, delete_income as crud_delete_income, update_income as crud_update_income, get_income_summary
from db.database import get_db
from schemas import IncomeOut, IncomeCreate
from schemas.income_schemas import IncomeListOut, IncomeSummaryOut
from services.auth_token_db import get_current_user_db

router = APIRouter(prefix="/incomes", tags=["Income"])

@router.post("", response_model=IncomeOut)
def create_income(
    payload: IncomeCreate,
    current_user = Depends(get_current_user_db),
    db: Session = Depends(get_db)
):
    """Thêm thu nhập mới."""
    # ✅ Truyền đầy đủ các trường Pydantic xuống CRUD
    income = crud_create_income(
        db=db,
        user_id=current_user.id,
        category_name=payload.category_name,
        amount=payload.amount,
        currency_code=payload.currency_code,
        date_val=payload.date,
        emoji=payload.emoji,
        category_id=payload.category_id,
        note=payload.note,
    )
    return income

# ✅ CẬP NHẬT: Sử dụng response_model=IncomeListOut
@router.get("", response_model=IncomeListOut)
def list_incomes(
    current_user = Depends(get_current_user_db),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: Optional[int] = Query(None, ge=1, le=500),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    category_id: Optional[UUID] = Query(None),
):
    """Danh sách thu nhập của người dùng kèm cài đặt tiền tệ."""
    # CRUD đã trả về dict có items, currency_code, currency_symbol, khớp với IncomeListOut
    return list_incomes_for_user_filtered(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        start_date=start_date,
        end_date=end_date,
        category_id=category_id,
    )

@router.put("/{income_id}", response_model=IncomeOut)
def update_income(
    income_id: UUID,
    update_data: IncomeCreate,
    current_user = Depends(get_current_user_db),
    db: Session = Depends(get_db)
):
    """Cập nhật thu nhập."""
    updated_income = crud_update_income(db, income_id, current_user.id, update_data.model_dump())
    if not updated_income:
        raise HTTPException(status_code=404, detail="Income not found")
    return updated_income

@router.delete("/{income_id}")
def delete_income(
    income_id: UUID,
    current_user = Depends(get_current_user_db),
    db: Session = Depends(get_db)
):
    """Xóa thu nhập."""
    deleted = crud_delete_income(db, income_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Income not found")
    return {"message": "Income deleted successfully"}


@router.get("/summary", response_model=List[IncomeSummaryOut])
def get_summary(
        current_user=Depends(get_current_user_db),
        db: Session = Depends(get_db)
):
    """📊 Lấy tổng thu nhập theo danh mục (cho Bar Chart)"""
    # Hàm get_income_summary được import từ cruds.crud_income
    summary_data = get_income_summary(db, current_user.id)

    if not summary_data:
        # Trả về list rỗng nếu không có dữ liệu
        return []

    return summary_data
