# routes/system_route.py
import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from db.database import get_db
from services.auth_token_db import get_current_admin_user, get_current_user_db
from cruds import crud_system
from schemas import system_schemas

router = APIRouter(prefix="/system", tags=["System Settings"])

# API cho ADMIN: Cập nhật cài đặt
@router.put("/settings", response_model=system_schemas.SystemSettingsOut)
def update_settings(
    payload: system_schemas.SystemSettingsUpdate,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin_user) # 🔒 Chỉ Admin
):
    return crud_system.update_system_settings(db, payload)

# API cho USER (và Admin): Xem cài đặt
@router.get("/settings", response_model=system_schemas.SystemSettingsOut)
def get_settings(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_db)
):
    return crud_system.get_system_settings(db)

# ✅ ĐÃ CHUYỂN TỪ ADMIN SANG ĐÂY (Đường dẫn sẽ là /system/health)
@router.get("/health")
def check_system_health(db: Session = Depends(get_db)):
    """Đo độ trễ API và kiểm tra kết nối Database thực tế"""
    import os
    build_sha = os.environ.get("RENDER_GIT_COMMIT") or os.environ.get("APP_BUILD_SHA") or "unknown"
    status_data = {
        "db_status": "Disconnected",
        "latency": 0,
        "color": "red",
        "build_sha": build_sha
    }

    try:
        # Bắt đầu bấm giờ
        start_time = time.time()

        # Thực hiện một truy vấn siêu nhẹ vào DB để test kết nối
        db.execute(text("SELECT 1"))

        # Kết thúc bấm giờ
        end_time = time.time()

        # Tính độ trễ (ms)
        latency_ms = (end_time - start_time) * 1000

        status_data["db_status"] = "Active"
        status_data["latency"] = round(latency_ms, 2)

        # Đánh giá màu sắc dựa trên tốc độ
        if latency_ms < 100:
            status_data["color"] = "green"
        elif latency_ms < 500:
            status_data["color"] = "yellow"
        else:
            status_data["color"] = "orange"

    except Exception as e:
        print(f"❌ Database Health Check Error: {e}")
        status_data["db_status"] = "Error"

    return status_data