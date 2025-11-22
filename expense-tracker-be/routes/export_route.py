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
    raw_data = list_incomes_for_user(db, current_user.id)
    # Lấy list items từ object trả về
    incomes = raw_data.get("items", []) if isinstance(raw_data, dict) else getattr(raw_data, "items", [])

    # 1. Tạo DataFrame
    df = pd.DataFrame([
        {
            "Category": i.category_name or "",
            "Amount": float(i.amount or 0),
            "Date": i.date.isoformat(),
            # ✅ FIX LỖI EMOJI: Ưu tiên lấy icon của Category, nếu không có mới lấy emoji của giao dịch
            "Emoji": (i.category.icon if i.category else "") or i.emoji or "",
        }
        for i in incomes
    ])

    # 2. Tính tổng
    total_amount = df["Amount"].sum() if not df.empty else 0

    # 3. Thêm dòng TOTAL (4 cột)
    if not df.empty:
        df.loc[len(df)] = ["TOTAL", total_amount, "", ""]

    # 4. Xuất file
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
    raw_data = list_expenses_for_user(db, current_user.id)
    expenses = raw_data.get("items", []) if isinstance(raw_data, dict) else getattr(raw_data, "items", [])

    # 1. Tạo DataFrame
    df = pd.DataFrame([
        {
            "Category": e.category_name or "",
            "Amount": float(e.amount or 0),
            "Date": e.date.isoformat(),
            # ✅ FIX LỖI EMOJI: Ưu tiên lấy icon của Category
            "Emoji": (e.category.icon if e.category else "") or e.emoji or "",
        }
        for e in expenses
    ])

    # 2. Tính tổng
    total_amount = df["Amount"].sum() if not df.empty else 0

    # 3. Thêm dòng TOTAL (4 cột)
    if not df.empty:
        df.loc[len(df)] = ["TOTAL", total_amount, "", ""]

    # 4. Xuất file
    stream = BytesIO()
    df.to_excel(stream, index=False)
    stream.seek(0)

    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=expenses.xlsx"}
    )