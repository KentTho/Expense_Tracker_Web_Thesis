# routes/export_route.py
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO
import pandas as pd
from cruds.crud_income import list_incomes_for_user
from cruds.crud_expense import list_expenses_for_user
from db.database import get_db
from services.auth_token_db import get_current_user_db

router = APIRouter(prefix="/export", tags=["Export"])


@router.get("/income")
def export_income(current_user=Depends(get_current_user_db), db: Session = Depends(get_db)):
    """Xuất danh sách thu nhập thành Excel"""
    incomes = list_incomes_for_user(db, current_user.id)
    df = pd.DataFrame([
        {
            "ID": str(i.id),
            "Category": i.category_name or "",
            "Amount": float(i.amount or 0),
            "Date": i.date.isoformat(),
            "Emoji": i.emoji or "",
        }
        for i in incomes
    ])
    total_amount = df["Amount"].sum() if not df.empty else 0
    df.loc[len(df)] = ["", "TOTAL", total_amount, "", ""]

    stream = BytesIO()
    df.to_excel(stream, index=False)
    stream.seek(0)

    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=incomes.xlsx"}
    )


@router.get("/expense")
def export_expense(current_user=Depends(get_current_user_db), db: Session = Depends(get_db)):
    """Xuất danh sách chi tiêu thành Excel"""
    expenses = list_expenses_for_user(db, current_user.id)
    df = pd.DataFrame([
        {
            "ID": str(e.id),
            "Category": e.category_name or "",
            "Amount": float(e.amount or 0),
            "Date": e.date.isoformat(),
            "Emoji": e.emoji or "",
        }
        for e in expenses
    ])
    total_amount = df["Amount"].sum() if not df.empty else 0
    df.loc[len(df)] = ["", "TOTAL", total_amount, "", ""]

    stream = BytesIO()
    df.to_excel(stream, index=False)
    stream.seek(0)

    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=expenses.xlsx"}
    )
