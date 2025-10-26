from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from schema import IncomeCreate, IncomeOut, ExpenseCreate, ExpenseOut, TransactionOut, SummaryOut
from utils.auth_helpers import get_current_user_db
from db.database import get_db
import crud

router = APIRouter(tags=["Transactions"])

# Incomes
@router.post("/incomes", response_model=IncomeOut)
def create_income(payload: IncomeCreate, current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    return crud.create_income(db=db, user_id=current_user.id, **payload.dict())

@router.get("/incomes", response_model=List[IncomeOut])
def list_incomes(current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    return crud.list_incomes_for_user(db, current_user.id)

# Expenses
@router.post("/expenses", response_model=ExpenseOut)
def create_expense(payload: ExpenseCreate, current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    return crud.create_expense(db=db, user_id=current_user.id, **payload.dict())

@router.get("/expenses", response_model=List[ExpenseOut])
def list_expenses(current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    return crud.list_expenses_for_user(db, current_user.id)

# Combined
@router.get("/transactions", response_model=List[TransactionOut])
def list_transactions(current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    return crud.list_transactions_for_user(db, current_user.id)
