# routes/transaction_route.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from cruds.crud_summary import get_financial_summary_from_transactions
from cruds.crud_transaction import get_recent_transactions, create_transaction, delete_transaction, update_transaction, list_transactions_for_user
from db.database import get_db
from schemas import TransactionOut, SummaryOut
from services.auth_token_db import get_current_user_db

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("/", response_model=List[TransactionOut])
def list_transactions(current_user=Depends(get_current_user_db), db: Session = Depends(get_db)):
    """Get all income + expense transactions."""
    return list_transactions_for_user(db, current_user.id)

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
    return get_expense_by_category(db, current_user.id)
