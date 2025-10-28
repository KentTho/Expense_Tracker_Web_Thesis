# main.py
import os
import json
from io import BytesIO
from datetime import date
from typing import List, Optional
from uuid import UUID
from routes import auth_route, income_route, category_route  # tùy theo dự án

import pandas as pd
import firebase_admin
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from firebase_admin import credentials, auth as fb_auth
from sqlalchemy import func

# internal imports (the files you already have)
import models
from db.database import SessionLocal, engine, get_db  # assumes database.py exposes SessionLocal and engine
import crud
from schemas import ( IncomeOut, ExpenseOut,
    ExpenseCreate, IncomeCreate,
    CategoryOut, CategoryCreate, TransactionOut, SummaryOut,
    DashboardResponse, DefaultCategoryOut
)
from services.auth_token_db import get_current_user_db

# create tables if not handled elsewhere (optional)
models.Base.metadata.create_all(bind=engine)

# -------------------------------------------------
# Firebase initialization (from .env FIREBASE_SERVICE_ACCOUNT JSON)
# -------------------------------------------------
load_dotenv()
firebase_key_json = os.getenv("FIREBASE_SERVICE_ACCOUNT")
if not firebase_admin._apps:
    if firebase_key_json:
        try:
            firebase_dict = json.loads(firebase_key_json)
            cred = credentials.Certificate(firebase_dict)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized from .env successfully")
        except Exception as e:
            print("❌ Error loading Firebase credentials from .env:", e)
    else:
        raise RuntimeError("FIREBASE_SERVICE_ACCOUNT not found in .env")

# -------------------------------------------------
# FastAPI app + CORS
# -------------------------------------------------
app = FastAPI(title="Expense Tracker API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # add your deployed frontend origins if any
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# 👇 Đăng ký router
app.include_router(auth_route.router)
app.include_router(income_route.router)
app.include_router(category_route.router)  # 👈 thêm dòng này
@app.get("/")
def root():
    return {"message": "API running successfully!"}
# ----------------------
# EXPENSE ROUTES
# ----------------------
@app.post("/expenses", response_model=ExpenseOut)
def create_expense(payload: ExpenseCreate, current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    expense = crud.create_expense(
        db=db,
        user_id=current_user.id,
        amount=payload.amount,
        date_val=payload.date,
        emoji=payload.emoji,
        category_id=payload.category_id,
        category_name=payload.category_name or None,
    )
    return expense

@app.get("/expenses", response_model=List[ExpenseOut])
def list_expenses(current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    expenses = crud.list_expenses_for_user(db, current_user.id)
    return expenses

@app.put("/expenses/{expense_id}", response_model=ExpenseOut)
def update_expense(expense_id: UUID, update_data: dict, current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    updated_expense = crud.update_expense(db, expense_id, current_user.id, update_data)
    if not updated_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return updated_expense

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: UUID, current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    deleted = crud.delete_expense(db, expense_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted successfully"}

# ----------------------
# TRANSACTIONS (Read-only, T3)
# ----------------------
@app.get("/transactions", response_model=List[TransactionOut])
def list_transactions(current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    """Lấy tất cả giao dịch (thu + chi). Read-only per decision T3."""
    transactions = crud.list_transactions_for_user(db, current_user.id)
    return transactions

@app.get("/transactions/summary", response_model=SummaryOut)
def get_summary(current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    summary = crud.get_financial_summary(db, current_user.id)
    # crud.get_financial_summary already returns dict with floats
    return {"total_income": summary["total_income"], "total_expense": summary["total_expense"], "balance": summary["balance"]}

@app.get("/transactions/category-summary", response_model=List[dict])
def get_expense_by_category(current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    return crud.get_expense_by_category(db, current_user.id)

# ----------------------
# DASHBOARD & ANALYTICS
# ----------------------
@app.get("/dashboard/summary", response_model=SummaryOut)
def get_dashboard_summary(current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    total_income = float(crud.get_income_summary(db, current_user.id) or 0)
    total_expense = float(crud.get_expense_summary(db, current_user.id) or 0)
    total_balance = total_income - total_expense
    return {"total_income": total_income, "total_expense": total_expense, "balance": total_balance}

@app.get("/dashboard/data", response_model=DashboardResponse)
def get_dashboard_data(current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    data = crud.get_dashboard_data(db, current_user.id)
    # crud.get_dashboard_data returns summary, recent_transactions (list of dicts), income_chart, expense_chart
    return data

@app.get("/analytics/trends")
def get_analytics_trends(current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    income_data = (
        db.query(models.Income.date, func.sum(models.Income.amount))
        .filter(models.Income.user_id == current_user.id)
        .group_by(models.Income.date)
        .order_by(models.Income.date)
        .limit(60)
        .all()
    )
    expense_data = (
        db.query(models.Expense.date, func.sum(models.Expense.amount))
        .filter(models.Expense.user_id == current_user.id)
        .group_by(models.Expense.date)
        .order_by(models.Expense.date)
        .limit(60)
        .all()
    )

    return {
        "income_trend": [{"date": str(d), "amount": float(a)} for d, a in income_data],
        "expense_trend": [{"date": str(d), "amount": float(a)} for d, a in expense_data],
    }

# ----------------------
# EXPORT (Excel)
# ----------------------
@app.get("/export/income")
def export_income(current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    incomes = crud.list_incomes_for_user(db, current_user.id)
    df = pd.DataFrame([
        {"ID": str(i.id), "Category": i.category_name, "Amount": float(i.amount), "Date": i.date.isoformat(), "Emoji": i.emoji}
        for i in incomes
    ])
    df.loc[len(df)] = ["", "TOTAL", df["Amount"].sum(), "", ""]
    stream = BytesIO()
    df.to_excel(stream, index=False)
    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=incomes.xlsx"}
    )

@app.get("/export/expense")
def export_expense(current_user = Depends(get_current_user_db), db: Session = Depends(get_db)):
    expenses = crud.list_expenses_for_user(db, current_user.id)
    df = pd.DataFrame([
        {"ID": str(e.id), "Category": e.category_name, "Amount": float(e.amount), "Date": e.date.isoformat(), "Emoji": e.emoji}
        for e in expenses
    ])
    df.loc[len(df)] = ["", "TOTAL", df["Amount"].sum(), "", ""]
    stream = BytesIO()
    df.to_excel(stream, index=False)
    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=expenses.xlsx"}
    )

# ----------------------
# DEFAULT CATEGORIES (static)
# ----------------------


# -------------------------------------------------
# Root
# -------------------------------------------------
@app.get("/")
def root():
    return {"message": "Expense Tracker API is running"}

