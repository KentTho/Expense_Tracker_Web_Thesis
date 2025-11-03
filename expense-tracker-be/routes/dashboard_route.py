# routes/dashboard_route.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

# ✅ Import các hàm từ các file CRUD đã được phân tách
# Giả sử bạn có thư mục cruds/ và các file crud_*.py bên trong
from cruds.crud_summary import (
    get_dashboard_data as crud_get_dashboard_data, # Đổi tên để tránh xung đột với tên hàm route
    get_analytics_trends_data # Hàm mới được thêm vào crud_summary
)
from cruds.crud_income import get_income_summary # Lấy hàm summary từ Income CRUD
from cruds.crud_expense import get_expense_summary # Lấy hàm summary từ Expense CRUD

from db.database import get_db
from schemas import SummaryOut, DashboardResponse # Giả sử các Schema này tồn tại
from services.auth_token_db import get_current_user_db # Giả sử hàm xác thực này tồn tại

router = APIRouter(tags=["Dashboard & Analytics"])

# --- Các hàm Summary (Tính tổng) ---

# Endpoint 1: Dashboard summary (Chỉ tính tổng)
@router.get("/dashboard/summary", response_model=SummaryOut)
def get_dashboard_summary(current_user=Depends(get_current_user_db), db: Session = Depends(get_db)):
    """Lấy tổng thu nhập, chi tiêu và số dư sử dụng bảng Income/Expense."""
    # Sử dụng các hàm summary đã được import từ các file CRUD nhỏ
    total_income = float(get_income_summary(db, current_user.id) or 0)
    total_expense = float(get_expense_summary(db, current_user.id) or 0)
    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense
    }

# Endpoint 2: Dashboard full data (Tổng hợp mọi thứ)
@router.get("/dashboard/data", response_model=DashboardResponse)
def get_dashboard_data(current_user=Depends(get_current_user_db), db: Session = Depends(get_db)):
    """Lấy toàn bộ dữ liệu dashboard (Summary, biểu đồ, giao dịch gần đây)."""
    # Sử dụng hàm tổng hợp từ crud_summary
    return crud_get_dashboard_data(db, current_user.id)

# Endpoint 3: Analytics trends (Biểu đồ xu hướng)
@router.get("/analytics/trends")
def get_analytics_trends(current_user=Depends(get_current_user_db), db: Session = Depends(get_db)):
    """Lấy dữ liệu xu hướng thu nhập và chi tiêu trong 60 ngày."""
    # Chuyển logic query vào hàm mới trong crud_summary.py
    return get_analytics_trends_data(db, current_user.id)