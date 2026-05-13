# routes/transaction_route.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional
from uuid import UUID

from cruds.crud_summary import get_financial_summary_from_transactions, get_expense_by_category as crud_get_expense_by_category
from cruds.crud_transaction import get_recent_transactions, create_transaction, delete_transaction, update_transaction, list_transactions_for_user
from db.database import get_db
from schemas import TransactionOut, SummaryOut, RecentTransactionOut
from services.auth_token_db import get_current_user_db

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("/", response_model=List[TransactionOut])
def list_transactions(
    current_user=Depends(get_current_user_db),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: Optional[int] = Query(None, ge=1, le=500),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    category_id: Optional[UUID] = Query(None),
    type: Optional[str] = Query(None, pattern="^(income|expense)$"),
):
    """Get all income + expense transactions."""
    return list_transactions_for_user(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        start_date=start_date,
        end_date=end_date,
        category_id=category_id,
        type_filter=type,
    )

@router.get("/summary", response_model=SummaryOut)
def get_summary(current_user=Depends(get_current_user_db), db: Session = Depends(get_db)):
    summary = get_financial_summary_from_transactions(db, current_user.id)
    return {
        "total_income": summary["total_income"],
        "total_expense": summary["total_expense"],
        "balance": summary["balance"],
    }

@router.get("/category-summary", response_model=List[dict])
def get_expense_by_category(current_user=Depends(get_current_user_db), db: Session = Depends(get_db)):
    return crud_get_expense_by_category(db, current_user.id)


@router.get("/recent", response_model=List[RecentTransactionOut])
def get_recent_transactions_route(
    current_user=Depends(get_current_user_db),
    db: Session = Depends(get_db),
    limit: int = Query(10, description="Number of recent transactions to return")
):
    """Lấy danh sách các giao dịch thu nhập và chi tiêu gần đây."""
    # Hàm crud_transaction.get_recent_transactions cần phải được import
    return get_recent_transactions(db, current_user.id, limit=limit)
