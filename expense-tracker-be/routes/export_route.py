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
    # Lấy dữ liệu thô (trả về Schema hoặc Dict chứa items)
    raw_data = list_incomes_for_user(db, current_user.id)

    # ✅ SỬA LỖI: Trích xuất danh sách 'items' từ kết quả trả về
    # Kiểm tra nếu raw_data là dict thì dùng .get(), nếu là object (Pydantic) thì dùng .items
    incomes = raw_data.get("items", []) if isinstance(raw_data, dict) else getattr(raw_data, "items", [])

    df = pd.DataFrame([
        {
            "Category": i.category_name or "",
            "Amount": float(i.amount or 0),
            "Date": i.date.isoformat(),
            "Emoji": i.emoji or "",
        }
        for i in incomes  # Bây giờ 'i' đã là object Transaction thực sự
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
    # Lấy dữ liệu thô
    raw_data = list_expenses_for_user(db, current_user.id)

    # ✅ SỬA LỖI: Trích xuất danh sách 'items'
    expenses = raw_data.get("items", []) if isinstance(raw_data, dict) else getattr(raw_data, "items", [])

    df = pd.DataFrame([
        {
            "Category": e.category_name or "",
            "Amount": float(e.amount or 0),
            "Date": e.date.isoformat(),
            "Emoji": e.emoji or "",
        }
        for e in expenses  # Bây giờ 'e' đã là object Transaction thực sự
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