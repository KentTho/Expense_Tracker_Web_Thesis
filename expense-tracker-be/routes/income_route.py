from uuid import UUID

import crud
from main import get_db, app
from schemas import ( IncomeOut, IncomeCreate)
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from services.auth_token_db import get_current_user_db


# ----------------------
# INCOME ROUTES
# ----------------------
@app.post("/incomes", response_model=IncomeOut)
def create_income(payload: IncomeCreate, current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    """
    Thêm thu nhập mới.
    """
    income = crud.create_income(
        db=db,
        user_id=current_user.id,
        category_name=payload.category_name,
        amount=payload.amount,
        date_val=payload.date,
        emoji=payload.emoji,
        category_id=payload.category_id,
    )
    return income

@app.get("/incomes", response_model=List[IncomeOut])
def list_incomes(current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    incomes = crud.list_incomes_for_user(db, current_user.id)
    return incomes

@app.put("/incomes/{income_id}", response_model=IncomeOut)
def update_income(income_id: UUID, update_data: dict, current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    updated_income = crud.update_income(db, income_id, current_user.id, update_data)
    if not updated_income:
        raise HTTPException(status_code=404, detail="Income not found")
    return updated_income

@app.delete("/incomes/{income_id}")
def delete_income(income_id: UUID, current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    deleted = crud.delete_income(db, income_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Income not found")
    return {"message": "Income deleted successfully"}
